/**
 * Dify job_match 适配层。
 *
 * 负责 Workflow 调用和叙事输出提取；业务函数只消费 JobMatchNarrative，
 * 不直接关心 Dify 的响应形状。叙事不含分数，分数始终来自规则匹配。
 */
import "@supabase/functions-js/edge-runtime.d.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_USER = "career-workbench-debug";

/** 标记 Dify 调用链路中的失败阶段，用于 API 错误返回和排查日志。 */
type DifyJobMatchStage =
  | "config"
  | "workflow_run"
  | "workflow_output";

/** job_match workflow 输出的叙事结构，对齐 match_reports.report_json。 */
type JobMatchNarrative = {
  schema_version: "job.match.v1";
  evidence: string[];
  gaps: string[];
  risks: string[];
  ai_note: string;
};

type DifyJobMatchInput = {
  /** ProfileDraft JSON 字符串。 */
  profileJson: string;
  /** 结构化 JD 字段 JSON 字符串。 */
  jobJson: string;
  /** 规则匹配结果 JSON 字符串（分数与等级以此为准）。 */
  ruleMatchJson: string;
};

/** runJobMatchWithDify 返回给业务函数的稳定结构。 */
type DifyJobMatchResult = {
  narrative: JobMatchNarrative;
  provider: "dify";
  /** Dify workflow_run_id，仅用于排错，可能缺失。 */
  workflowRunId: string | null;
};

/** 带阶段信息的分析错误，避免业务函数只能拿到模糊的 500。 */
class DifyJobMatchError extends Error {
  details?: unknown;
  stage: DifyJobMatchStage;
  status: number;
  /** 失败发生前已拿到的 workflow_run_id，便于失败行也能记录。 */
  workflowRunId: string | null;

  constructor(
    message: string,
    status: number,
    stage: DifyJobMatchStage,
    details?: unknown,
    workflowRunId: string | null = null,
  ) {
    super(message);
    this.name = "DifyJobMatchError";
    this.status = status;
    this.stage = stage;
    this.details = details;
    this.workflowRunId = workflowRunId;
  }
}

/** Profile + JD + 规则结果 -> Dify workflow run -> JobMatchNarrative。 */
async function runJobMatchWithDify(
  input: DifyJobMatchInput,
): Promise<DifyJobMatchResult> {
  const difyApiKey = Deno.env.get("DIFY_JOB_MATCH_API_KEY")?.trim();

  if (!difyApiKey) {
    throw new DifyJobMatchError(
      "Missing DIFY_JOB_MATCH_API_KEY",
      500,
      "config",
    );
  }

  const difyBaseUrl = normalizeBaseUrl(
    getEnv("DIFY_BASE_URL", DEFAULT_DIFY_BASE_URL),
  );
  const difyUser = getEnv("DIFY_USER", DEFAULT_DIFY_USER);

  const workflowPayload = {
    inputs: {
      profile_json: input.profileJson,
      job_json: input.jobJson,
      rule_match_json: input.ruleMatchJson,
    },
    response_mode: "blocking",
    user: difyUser,
  };

  const workflowResponse = await fetch(`${difyBaseUrl}/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${difyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowPayload),
  });
  const workflowBody = await readResponseBody(workflowResponse);
  const workflowRunId = getWorkflowRunId(workflowBody);

  if (!workflowResponse.ok) {
    throw new DifyJobMatchError(
      "Dify workflow failed",
      502,
      "workflow_run",
      {
        body: workflowBody,
        status: workflowResponse.status,
      },
      workflowRunId,
    );
  }

  // blocking 模式 HTTP 200 不代表 run 成功：节点失败时 status=failed、
  // outputs 为空，真正的原因在 data.error（例如上游模型 503）。
  const runData = isRecord(workflowBody) && isRecord(workflowBody.data)
    ? workflowBody.data
    : null;

  if (runData && runData.status !== "succeeded") {
    throw new DifyJobMatchError(
      "Dify workflow run did not succeed",
      502,
      "workflow_run",
      {
        error: runData.error ?? null,
        status: runData.status ?? null,
      },
      workflowRunId,
    );
  }

  const outputs = getWorkflowOutputs(workflowBody);
  const narrative = extractJobMatchNarrative(outputs, workflowRunId);

  return {
    narrative,
    provider: "dify",
    workflowRunId,
  };
}

function extractJobMatchNarrative(
  outputs: unknown,
  workflowRunId: string | null,
): JobMatchNarrative {
  const candidates = getOutputCandidates(outputs);

  for (const candidate of candidates) {
    const value = parseMaybeJson(candidate);
    const coerced = coerceJobMatchNarrative(value);

    if (coerced) {
      return coerced;
    }
  }

  throw new DifyJobMatchError(
    "Dify workflow output is missing JobMatchNarrative.",
    502,
    "workflow_output",
    { outputs },
    workflowRunId,
  );
}

// Dify 工作流输出字段名容易随着节点命名变化，先兼容常见输出键。
function getOutputCandidates(value: unknown): unknown[] {
  if (!isRecord(value)) {
    return [value];
  }

  return [
    value,
    value.report,
    value.result,
    value.output,
    value.text,
  ];
}

// 兼容 LLM 节点把 JSON 包在 markdown code fence 里的情况。
function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(withoutFence);
  } catch {
    return value;
  }
}

function coerceJobMatchNarrative(value: unknown): JobMatchNarrative | null {
  if (!isRecord(value)) {
    return null;
  }

  // ai_note 是叙事核心，作为输出形状的最低要求；列表允许为空。
  if (typeof value.ai_note !== "string" || value.ai_note.trim().length === 0) {
    return null;
  }

  return {
    schema_version: "job.match.v1",
    evidence: toStringArray(value.evidence),
    gaps: toStringArray(value.gaps),
    risks: toStringArray(value.risks),
    ai_note: value.ai_note.trim(),
  };
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )
    : [];
}

function getWorkflowRunId(body: unknown) {
  if (isRecord(body) && typeof body.workflow_run_id === "string") {
    return body.workflow_run_id;
  }

  return null;
}

function getWorkflowOutputs(body: unknown) {
  if (!isRecord(body) || !isRecord(body.data)) {
    return null;
  }

  return body.data.outputs ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getEnv(name: string, fallback: string) {
  return Deno.env.get(name)?.trim() || fallback;
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type { DifyJobMatchResult, JobMatchNarrative };
export { DifyJobMatchError, runJobMatchWithDify };
