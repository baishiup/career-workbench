/**
 * Dify job_parse 适配层。
 *
 * 负责截图上传、Workflow 调用和输出提取；业务函数只消费 JobParseDraft，
 * 不直接关心 Dify 的响应形状。文本和截图至少要有一个。
 */
import "@supabase/functions-js/edge-runtime.d.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_USER = "career-workbench-debug";
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const MAX_SCREENSHOT_COUNT = 5;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** 标记 Dify 调用链路中的失败阶段，用于 API 错误返回和排查日志。 */
type DifyJobParseStage =
  | "request"
  | "config"
  | "file_upload"
  | "workflow_run"
  | "workflow_output";

/** Dify workflow 图片输入要求的 local_file 对象。 */
type DifyImageObject = {
  type: "image";
  transfer_method: "local_file";
  upload_file_id: string;
};

/** job_parse workflow 输出的结构化职位草稿，字段对齐 job_descriptions。 */
type JobParseDraft = {
  schema_version: "job.parse.v1";
  source_platform: string | null;
  company: string | null;
  title: string | null;
  company_stage: string | null;
  location: string | null;
  remote_status: "remote" | "hybrid" | "onsite" | null;
  job_type: "full_time" | "contract" | "part_time" | null;
  seniority: string | null;
  years_required: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  requirements: string[];
  salary_range: string | null;
  posted_at: string | null;
  summary: string | null;
  parse_warnings: string[];
};

type DifyJobParseInput = {
  jdText: string | null;
  screenshots: File[];
};

/** parseJobWithDify 返回给业务函数的稳定结构。 */
type DifyJobParseResult = {
  parsed: JobParseDraft;
  provider: "dify";
  raw: {
    outputs: unknown;
    workflow: unknown;
  };
};

/** 带阶段信息的解析错误，避免业务函数只能拿到模糊的 500。 */
class DifyJobParseError extends Error {
  details?: unknown;
  stage: DifyJobParseStage;
  status: number;

  constructor(
    message: string,
    status: number,
    stage: DifyJobParseStage,
    details?: unknown,
  ) {
    super(message);
    this.name = "DifyJobParseError";
    this.status = status;
    this.stage = stage;
    this.details = details;
  }
}

/** JD 文本 / 截图 -> Dify file upload -> workflow run -> JobParseDraft。 */
async function parseJobWithDify(
  input: DifyJobParseInput,
): Promise<DifyJobParseResult> {
  validateInput(input);

  const difyApiKey = Deno.env.get("DIFY_JOB_PARSE_API_KEY")?.trim();

  if (!difyApiKey) {
    throw new DifyJobParseError(
      "Missing DIFY_JOB_PARSE_API_KEY",
      500,
      "config",
    );
  }

  const difyBaseUrl = normalizeBaseUrl(
    getEnv("DIFY_BASE_URL", DEFAULT_DIFY_BASE_URL),
  );
  const difyUser = getEnv("DIFY_USER", DEFAULT_DIFY_USER);

  const screenshotObjects: DifyImageObject[] = [];

  for (const screenshot of input.screenshots) {
    const uploadFileId = await uploadScreenshot(
      difyBaseUrl,
      difyApiKey,
      difyUser,
      screenshot,
    );

    screenshotObjects.push({
      type: "image",
      transfer_method: "local_file",
      upload_file_id: uploadFileId,
    });
  }

  const workflowPayload = {
    inputs: {
      jd_text: input.jdText ?? "",
      jd_screenshots: screenshotObjects,
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

  if (!workflowResponse.ok) {
    throw new DifyJobParseError(
      "Dify workflow failed",
      502,
      "workflow_run",
      {
        body: workflowBody,
        status: workflowResponse.status,
      },
    );
  }

  const outputs = getWorkflowOutputs(workflowBody);
  const parsed = extractJobParseDraft(outputs);

  return {
    parsed,
    provider: "dify",
    raw: {
      outputs,
      workflow: workflowBody,
    },
  };
}

function validateInput(input: DifyJobParseInput) {
  const hasText = Boolean(input.jdText && input.jdText.trim().length > 0);

  if (!hasText && input.screenshots.length === 0) {
    throw new DifyJobParseError(
      "Either jd_text or screenshots is required",
      400,
      "request",
    );
  }

  if (input.screenshots.length > MAX_SCREENSHOT_COUNT) {
    throw new DifyJobParseError(
      `At most ${MAX_SCREENSHOT_COUNT} screenshots are supported`,
      400,
      "request",
      { count: input.screenshots.length },
    );
  }

  for (const screenshot of input.screenshots) {
    if (!ALLOWED_IMAGE_TYPES.has(screenshot.type)) {
      throw new DifyJobParseError(
        "Only PNG / JPEG / WebP screenshots are supported",
        415,
        "request",
        { name: screenshot.name, type: screenshot.type },
      );
    }

    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      throw new DifyJobParseError(
        "Screenshot is too large",
        413,
        "request",
        {
          maxBytes: MAX_SCREENSHOT_BYTES,
          name: screenshot.name,
          size: screenshot.size,
        },
      );
    }
  }
}

async function uploadScreenshot(
  difyBaseUrl: string,
  difyApiKey: string,
  difyUser: string,
  file: File,
): Promise<string> {
  const uploadFormData = new FormData();
  uploadFormData.append("file", file, file.name);
  uploadFormData.append("user", difyUser);

  const uploadResponse = await fetch(`${difyBaseUrl}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${difyApiKey}`,
    },
    body: uploadFormData,
  });
  const uploadBody = await readResponseBody(uploadResponse);

  if (!uploadResponse.ok) {
    throw new DifyJobParseError(
      "Dify screenshot upload failed",
      502,
      "file_upload",
      {
        body: uploadBody,
        name: file.name,
        status: uploadResponse.status,
      },
    );
  }

  const uploadFileId = getUploadFileId(uploadBody);

  if (!uploadFileId) {
    throw new DifyJobParseError(
      "Dify upload response is missing file id",
      502,
      "file_upload",
      { body: uploadBody, name: file.name },
    );
  }

  return uploadFileId;
}

function extractJobParseDraft(outputs: unknown): JobParseDraft {
  const candidates = getOutputCandidates(outputs);

  for (const candidate of candidates) {
    const value = parseMaybeJson(candidate);
    const coerced = coerceJobParseDraft(value);

    if (coerced) {
      return coerced;
    }
  }

  throw new DifyJobParseError(
    "Dify workflow output is missing JobParseDraft.",
    502,
    "workflow_output",
    { outputs },
  );
}

// Dify 工作流输出字段名容易随着节点命名变化，先兼容常见输出键。
function getOutputCandidates(value: unknown): unknown[] {
  if (!isRecord(value)) {
    return [value];
  }

  return [
    value,
    value.parsed_job,
    value.job,
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

function coerceJobParseDraft(value: unknown): JobParseDraft | null {
  if (!isRecord(value)) {
    return null;
  }

  // company / title 是判断输出形状的最低要求；其余字段全部可缺省。
  if (!("company" in value) || !("title" in value)) {
    return null;
  }

  return {
    schema_version: "job.parse.v1",
    source_platform: getNullableString(value.source_platform),
    company: getNullableString(value.company),
    title: getNullableString(value.title),
    company_stage: getNullableString(value.company_stage),
    location: getNullableString(value.location),
    remote_status: getEnumValue(
      value.remote_status,
      [
        "remote",
        "hybrid",
        "onsite",
      ] as const,
    ),
    job_type: getEnumValue(
      value.job_type,
      [
        "full_time",
        "contract",
        "part_time",
      ] as const,
    ),
    seniority: getNullableString(value.seniority),
    years_required: getNullableString(value.years_required),
    required_skills: toStringArray(value.required_skills),
    preferred_skills: toStringArray(value.preferred_skills),
    responsibilities: toStringArray(value.responsibilities),
    requirements: toStringArray(value.requirements),
    salary_range: getNullableString(value.salary_range),
    posted_at: getNullableString(value.posted_at),
    summary: getNullableString(value.summary),
    parse_warnings: toStringArray(value.parse_warnings),
  };
}

function getNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getEnumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" &&
      (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getUploadFileId(body: unknown) {
  if (isRecord(body) && typeof body.id === "string") {
    return body.id;
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

export type { DifyJobParseResult, JobParseDraft };
export { DifyJobParseError, parseJobWithDify };
