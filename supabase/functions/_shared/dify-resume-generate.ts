/**
 * Dify resume_generate 适配层。
 *
 * 负责 Workflow 调用和 ResumeDocument 输出提取；业务函数只消费
 * ResumeDocument，不直接依赖 Dify 的响应形状。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import type { ResumeDocument } from "./resume-normalize.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_USER = "career-workbench-debug";

/** 标记 Dify 调用链路中的失败阶段，用于 API 错误返回和排查日志。 */
type DifyResumeGenerateStage =
  | "config"
  | "workflow_run"
  | "workflow_output";

type DifyResumeGenerateInput = {
  /** ProfileDraft JSON 字符串。 */
  profileJson: string;
  /** 结构化 JD JSON 字符串。 */
  jobJson: string;
  /** match_reports.report_json 与报告元数据 JSON 字符串。 */
  matchReportJson: string;
};

/** runResumeGenerateWithDify 返回给业务函数的稳定结构。 */
type DifyResumeGenerateResult = {
  document: ResumeDocument;
  provider: "dify";
  /** Dify workflow_run_id，仅用于排错，可能缺失。 */
  workflowRunId: string | null;
};

class DifyResumeGenerateError extends Error {
  details?: unknown;
  stage: DifyResumeGenerateStage;
  status: number;
  workflowRunId: string | null;

  constructor(
    message: string,
    status: number,
    stage: DifyResumeGenerateStage,
    details?: unknown,
    workflowRunId: string | null = null,
  ) {
    super(message);
    this.name = "DifyResumeGenerateError";
    this.status = status;
    this.stage = stage;
    this.details = details;
    this.workflowRunId = workflowRunId;
  }
}

/** Profile + JD + match report -> Dify workflow run -> ResumeDocument。 */
async function runResumeGenerateWithDify(
  input: DifyResumeGenerateInput,
): Promise<DifyResumeGenerateResult> {
  const difyApiKey = Deno.env.get("DIFY_RESUME_GENERATE_API_KEY")?.trim();

  if (!difyApiKey) {
    throw new DifyResumeGenerateError(
      "Missing DIFY_RESUME_GENERATE_API_KEY",
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
      job_json: input.jobJson,
      match_report_json: input.matchReportJson,
      profile_json: input.profileJson,
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
    throw new DifyResumeGenerateError(
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

  const runData = isRecord(workflowBody) && isRecord(workflowBody.data)
    ? workflowBody.data
    : null;

  if (runData && runData.status !== "succeeded") {
    throw new DifyResumeGenerateError(
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
  const document = extractResumeDocument(outputs, workflowRunId);

  return {
    document,
    provider: "dify",
    workflowRunId,
  };
}

function extractResumeDocument(
  outputs: unknown,
  workflowRunId: string | null,
): ResumeDocument {
  const candidates = getOutputCandidates(outputs);

  for (const candidate of candidates) {
    const value = parseMaybeJson(candidate);

    if (isResumeDocument(value)) {
      return value;
    }
  }

  throw new DifyResumeGenerateError(
    "Dify workflow output is missing ResumeDocument.",
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
    value.resume,
    value.document,
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

function isResumeDocument(value: unknown): value is ResumeDocument {
  return isRecord(value) &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    typeof value.locale === "string" &&
    value.locale.trim().length > 0 &&
    Array.isArray(value.sections) &&
    value.sections.length > 0 &&
    value.sections.every(isResumeSection);
}

function isResumeSection(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    isSectionKind(value.kind) &&
    typeof value.title === "string" &&
    typeof value.visible === "boolean" &&
    Array.isArray(value.blocks) &&
    value.blocks.every(isResumeBlock);
}

function isResumeBlock(value: unknown) {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return false;
  }

  const hasBase = typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    (value.label === undefined || typeof value.label === "string");

  if (!hasBase) {
    return false;
  }

  if (value.kind === "text" || value.kind === "paragraph") {
    return typeof value.text === "string";
  }

  if (value.kind === "bulletList") {
    return Array.isArray(value.items) &&
      value.items.every((item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.text === "string"
      );
  }

  if (value.kind === "tagList") {
    return Array.isArray(value.tags) &&
      value.tags.every((tag) => typeof tag === "string");
  }

  if (value.kind === "dateRange") {
    return typeof value.startDate === "string" &&
      typeof value.endDate === "string" &&
      (value.current === undefined || typeof value.current === "boolean");
  }

  if (value.kind === "linkList") {
    return Array.isArray(value.links) &&
      value.links.every((link) =>
        isRecord(link) &&
        typeof link.id === "string" &&
        typeof link.label === "string" &&
        typeof link.url === "string"
      );
  }

  return false;
}

function isSectionKind(value: unknown) {
  return value === "personal" ||
    value === "summary" ||
    value === "skills" ||
    value === "work" ||
    value === "projects" ||
    value === "education" ||
    value === "custom";
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

export type { DifyResumeGenerateResult };
export { DifyResumeGenerateError, runResumeGenerateWithDify };
