/**
 * Dify 简历解析适配层。
 *
 * 这里负责文件上传、Workflow 调用和输出提取；业务函数只消费
 * AIParsedResumeDraft，不直接关心 Dify 的响应形状。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import type { AIParsedResumeDraft } from "./resume-normalize.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_RESUME_INPUT_NAME = "resume_file";
const DEFAULT_DIFY_USER = "career-workbench-debug";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** 标记 Dify 调用链路中的失败阶段，用于 API 错误返回和排查日志。 */
type DifyResumeParseStage =
  | "request"
  | "config"
  | "file_upload"
  | "workflow_run"
  | "workflow_output";

/** Dify workflow 文件输入要求的 local_file 对象。 */
type DifyFileObject = {
  type: "document";
  transfer_method: "local_file";
  upload_file_id: string;
};

/** parseResumeWithDify 返回给业务函数的稳定结构。 */
type DifyResumeParseResult = {
  file: {
    name: string;
    size: number;
    type: string;
  };
  parsed: AIParsedResumeDraft;
  provider: "dify";
  raw: {
    outputs: unknown;
    upload: unknown;
    workflow: unknown;
  };
};

/** 带阶段信息的解析错误，避免业务函数只能拿到模糊的 500。 */
class DifyResumeParseError extends Error {
  details?: unknown;
  stage: DifyResumeParseStage;
  status: number;

  constructor(
    message: string,
    status: number,
    stage: DifyResumeParseStage,
    details?: unknown,
  ) {
    super(message);
    this.name = "DifyResumeParseError";
    this.status = status;
    this.stage = stage;
    this.details = details;
  }
}

/** PDF -> Dify file upload -> workflow run -> AIParsedResumeDraft。 */
async function parseResumeWithDify(file: File): Promise<DifyResumeParseResult> {
  validateResumeFile(file);

  const difyApiKey = Deno.env.get("DIFY_API_KEY")?.trim();

  if (!difyApiKey) {
    throw new DifyResumeParseError("Missing DIFY_API_KEY", 500, "config");
  }

  const difyBaseUrl = normalizeBaseUrl(
    getEnv("DIFY_BASE_URL", DEFAULT_DIFY_BASE_URL),
  );
  const resumeInputName = getEnv(
    "DIFY_RESUME_INPUT_NAME",
    DEFAULT_DIFY_RESUME_INPUT_NAME,
  );
  const difyUser = getEnv("DIFY_USER", DEFAULT_DIFY_USER);

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
    throw new DifyResumeParseError(
      "Dify file upload failed",
      502,
      "file_upload",
      {
        body: uploadBody,
        status: uploadResponse.status,
      },
    );
  }

  const uploadFileId = getUploadFileId(uploadBody);

  if (!uploadFileId) {
    throw new DifyResumeParseError(
      "Dify upload response is missing file id",
      502,
      "file_upload",
      { body: uploadBody },
    );
  }

  const difyFile: DifyFileObject = {
    type: "document",
    transfer_method: "local_file",
    upload_file_id: uploadFileId,
  };
  const workflowPayload = {
    inputs: {
      [resumeInputName]: difyFile,
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
    throw new DifyResumeParseError(
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
  const parsed = extractAIParsedResumeDraft(outputs);

  return {
    file: {
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
    },
    parsed,
    provider: "dify",
    raw: {
      outputs,
      upload: uploadBody,
      workflow: workflowBody,
    },
  };
}

function validateResumeFile(file: File) {
  if (!isPdf(file)) {
    throw new DifyResumeParseError(
      "Only PDF files are supported",
      415,
      "request",
      {
        name: file.name,
        type: file.type,
      },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new DifyResumeParseError("File is too large", 413, "request", {
      maxBytes: MAX_FILE_BYTES,
      size: file.size,
    });
  }
}

function extractAIParsedResumeDraft(outputs: unknown): AIParsedResumeDraft {
  const candidates = getOutputCandidates(outputs);

  for (const candidate of candidates) {
    const value = parseMaybeJson(candidate);

    if (isAIParsedResumeDraft(value)) {
      return value;
    }

    const coerced = coerceAIParsedResumeDraft(value);

    if (coerced) {
      return coerced;
    }
  }

  throw new DifyResumeParseError(
    "Dify workflow output is missing AIParsedResumeDraft.",
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
    value.parsed_resume,
    value.parsed_resume_json,
    value.resume,
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

function isAIParsedResumeDraft(value: unknown): value is AIParsedResumeDraft {
  return isRecord(value) &&
    value.schema_version === "resume.parse.v1" &&
    isRecord(value.candidate) &&
    Array.isArray(value.work_experiences) &&
    Array.isArray(value.projects) &&
    Array.isArray(value.education) &&
    Array.isArray(value.skills) &&
    Array.isArray(value.parse_warnings) &&
    Array.isArray(value.unmapped_text);
}

function coerceAIParsedResumeDraft(value: unknown): AIParsedResumeDraft | null {
  if (!isRecord(value) || !isRecord(value.candidate)) {
    return null;
  }

  if (
    !Array.isArray(value.work_experiences) ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.education) ||
    !Array.isArray(value.skills)
  ) {
    return null;
  }

  return {
    schema_version: "resume.parse.v1",
    candidate: {
      full_name: getNullableString(value.candidate.full_name),
      email: getNullableString(value.candidate.email),
      phone: getNullableString(value.candidate.phone),
      city: getNullableString(value.candidate.city),
      headline: getNullableString(value.candidate.headline),
      links: toLinkArray(value.candidate.links),
    },
    work_experiences: value.work_experiences
      .filter(isRecord)
      .map((item) => ({
        company: getNullableString(item.company),
        title: getNullableString(item.title),
        location: getNullableString(item.location),
        start_date: getNullableString(item.start_date),
        end_date: getNullableString(item.end_date),
        current: typeof item.current === "boolean" ? item.current : null,
        raw_date: getNullableString(item.raw_date),
        summary: getNullableString(item.summary),
        bullets: toStringArray(item.bullets),
        technologies: toStringArray(item.technologies),
      })),
    projects: value.projects
      .filter(isRecord)
      .map((item) => ({
        name: getNullableString(item.name),
        role: getNullableString(item.role),
        start_date: getNullableString(item.start_date),
        end_date: getNullableString(item.end_date),
        raw_date: getNullableString(item.raw_date),
        summary: getNullableString(item.summary),
        bullets: toStringArray(item.bullets),
        links: toLinkArray(item.links),
        technologies: toStringArray(item.technologies),
      })),
    education: value.education
      .filter(isRecord)
      .map((item) => ({
        school: getNullableString(item.school),
        degree: getNullableString(item.degree),
        major: getNullableString(item.major ?? item.field),
        location: getNullableString(item.location),
        start_date: getNullableString(item.start_date),
        end_date: getNullableString(item.end_date),
        raw_date: getNullableString(item.raw_date),
        description: getNullableString(item.description),
      })),
    skills: toStringArray(value.skills),
    parse_warnings: toStringArray(value.parse_warnings),
    unmapped_text: toStringArray(value.unmapped_text),
  };
}

function getNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toLinkArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).flatMap((item) => {
    const url = getNullableString(item.url);

    if (!url) {
      return [];
    }

    return [{
      label: getNullableString(item.label),
      url,
    }];
  });
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

function isPdf(file: File) {
  return file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
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

export type { DifyResumeParseResult };
export {
  DifyResumeParseError,
  extractAIParsedResumeDraft,
  parseResumeWithDify,
};
