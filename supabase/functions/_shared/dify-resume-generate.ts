/**
 * Dify resume_generate 适配层。
 *
 * 负责 Workflow 调用和 ResumeDocument 输出提取；业务函数只消费
 * ResumeDocument，不直接依赖 Dify 的响应形状。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import { coerceRichText, type ResumeDocument } from "./resume-normalize.ts";

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
    const value = coerceResumeDocumentTypes(parseMaybeJson(candidate));

    if (isResumeDocument(value)) {
      return coerceModuleRichText(value);
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

// LLM 输出的 description / content 是纯文本字符串；落库前统一转成富文本 Delta，
// 保证存储形态与编辑器/预览一致（前端读取虽也会兜底 coerce）。
function coerceModuleRichText(document: ResumeDocument): ResumeDocument {
  return {
    ...document,
    modules: document.modules.map((module) => {
      switch (module.kind) {
        case "education":
          return {
            ...module,
            items: module.items.map((item) => ({
              ...item,
              description: coerceRichText(item.description),
            })),
          };
        case "work":
          return {
            ...module,
            items: module.items.map((item) => ({
              ...item,
              description: coerceRichText(item.description),
            })),
          };
        case "projects":
          return {
            ...module,
            items: module.items.map((item) => ({
              ...item,
              description: coerceRichText(item.description),
            })),
          };
        case "custom":
          return {
            ...module,
            module: {
              ...module.module,
              content: coerceRichText(module.module.content),
            },
          };
        default:
          return module;
      }
    }),
  };
}

// Gemini 的 structured output 经常把布尔值序列化成字符串（"true"/"false"），
// 直接交给严格校验会被判为非法文档并触发 fallback。这里在校验前把已知的
// 布尔字段还原成真正的布尔值；非文档候选原样返回。
function coerceResumeDocumentTypes(value: unknown): unknown {
  if (!isRecord(value) || !Array.isArray(value.modules)) {
    return value;
  }

  for (const module of value.modules) {
    if (!isRecord(module)) {
      continue;
    }

    // 模块默认可见，缺失或非法时回退为 true。
    module.visible = coerceBoolean(module.visible, true);

    if (!Array.isArray(module.items)) {
      continue;
    }

    for (const item of module.items) {
      if (isRecord(item) && typeof item.current === "string") {
        const coerced = coerceBoolean(item.current, undefined);

        if (coerced !== undefined) {
          item.current = coerced;
        }
      }
    }
  }

  return value;
}

function coerceBoolean(value: unknown, fallback: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();

    if (lowered === "true") {
      return true;
    }

    if (lowered === "false") {
      return false;
    }
  }

  return fallback;
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
    Array.isArray(value.modules) &&
    value.modules.length > 0 &&
    value.modules.every(isResumeModule);
}

function isResumeModule(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.id !== "string" || value.id.trim().length === 0) {
    return false;
  }

  if (typeof value.visible !== "boolean") {
    return false;
  }

  switch (value.kind) {
    case "personal":
      return isRecord(value.personal);
    case "preferences":
      return isRecord(value.preferences);
    case "education":
    case "work":
    case "projects":
      return Array.isArray(value.items);
    case "skills":
      return Array.isArray(value.skills) &&
        value.skills.every((skill) => typeof skill === "string");
    case "custom":
      return isRecord(value.module);
    default:
      return false;
  }
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
