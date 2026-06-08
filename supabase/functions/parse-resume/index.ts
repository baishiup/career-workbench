import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_RESUME_INPUT_NAME = "resume_file";
const DEFAULT_DIFY_USER = "career-workbench-debug";
const MAX_FILE_BYTES = 15 * 1024 * 1024;

type Stage = "request" | "config" | "file_upload" | "workflow_run";

type DifyFileObject = {
  type: "document";
  transfer_method: "local_file";
  upload_file_id: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405, "request");
  }

  const difyApiKey = Deno.env.get("DIFY_API_KEY")?.trim();

  if (!difyApiKey) {
    return errorResponse("Missing DIFY_API_KEY", 500, "config");
  }

  const difyBaseUrl = normalizeBaseUrl(
    getEnv("DIFY_BASE_URL", DEFAULT_DIFY_BASE_URL),
  );
  const resumeInputName = getEnv(
    "DIFY_RESUME_INPUT_NAME",
    DEFAULT_DIFY_RESUME_INPUT_NAME,
  );
  const difyUser = getEnv("DIFY_USER", DEFAULT_DIFY_USER);

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    return errorResponse("Invalid multipart form data", 400, "request", error);
  }

  const fileField = formData.get("resume_file") ?? formData.get("file");

  if (!(fileField instanceof File)) {
    return errorResponse("resume_file is required", 400, "request");
  }

  const file = fileField;

  if (!isPdf(file)) {
    return errorResponse("Only PDF files are supported", 415, "request", {
      name: file.name,
      type: file.type,
    });
  }

  if (file.size > MAX_FILE_BYTES) {
    return errorResponse("File is too large", 413, "request", {
      maxBytes: MAX_FILE_BYTES,
      size: file.size,
    });
  }

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
    return errorResponse("Dify file upload failed", 502, "file_upload", {
      status: uploadResponse.status,
      body: uploadBody,
    });
  }

  const uploadFileId = getUploadFileId(uploadBody);

  if (!uploadFileId) {
    return errorResponse("Dify upload response is missing file id", 502, "file_upload", {
      body: uploadBody,
    });
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
    return errorResponse("Dify workflow failed", 502, "workflow_run", {
      status: workflowResponse.status,
      body: workflowBody,
    });
  }

  return jsonResponse({
    status: "ok",
    provider: "dify",
    file: {
      name: file.name,
      size: file.size,
      type: file.type || "application/pdf",
    },
    dify: {
      upload: uploadBody,
      workflow: workflowBody,
      outputs: getWorkflowOutputs(workflowBody),
    },
  });
});

function errorResponse(
  message: string,
  status: number,
  stage: Stage,
  details?: unknown,
) {
  return jsonResponse(
    {
      error: message,
      details: serializeDetails(details),
      stage,
    },
    { status },
  );
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

function serializeDetails(details: unknown) {
  if (details instanceof Error) {
    return {
      name: details.name,
      message: details.message,
    };
  }

  return details ?? null;
}
