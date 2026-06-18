/**
 * 简历编辑器 AI 对话（登录用户）。
 *
 * 前端发送当前简历、用户 prompt 和可选 module context；函数调用 Dify
 * resume_chat Chatflow，返回自然语言回复和待采纳 ResumePatch。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  DifyResumeChatError,
  runResumeChatWithDify,
} from "../_shared/dify-resume-chat.ts";
import type { ResumeDocument } from "../_shared/resume-normalize.ts";

type Stage = "request" | "auth" | "dify";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405, "request");
  }

  const auth = await requireAuthenticatedClient(request);

  if (!auth.ok) {
    return errorResponse(auth.message, auth.status, "auth");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return errorResponse("Invalid JSON body", 400, "request", error);
  }

  const parsed = parseRequestBody(body);

  if (!parsed.ok) {
    return errorResponse(parsed.message, 400, "request", parsed.details);
  }

  try {
    const result = await runResumeChatWithDify(parsed.input);

    return jsonResponse({
      conversation_id: result.conversationId,
      message: result.message,
      message_id: result.messageId,
      patch: result.patch,
      provider: result.provider,
      status: "ok",
      task_id: result.taskId,
      workflow_run_id: result.workflowRunId,
    });
  } catch (error) {
    return chatErrorResponse(error);
  }
});

function parseRequestBody(body: unknown):
  | {
    ok: true;
    input: {
      conversationId: string | null;
      document: ResumeDocument;
      prompt: string;
      resumeId: string;
      selectedModuleId: string | null;
    };
  }
  | { ok: false; message: string; details?: unknown } {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be a JSON object" };
  }

  const resumeId = getString(body.resume_id);
  const prompt = getString(body.prompt);
  const conversationId = getOptionalString(body.conversation_id);
  const selectedModuleId = getOptionalString(body.selected_module_id);

  if (!resumeId) {
    return { ok: false, message: "resume_id is required" };
  }

  if (!prompt) {
    return { ok: false, message: "prompt is required" };
  }

  if (!isResumeDocument(body.document)) {
    return {
      details: { document: body.document },
      message: "document must be a valid ResumeDocument",
      ok: false,
    };
  }

  return {
    input: {
      conversationId,
      document: body.document,
      prompt,
      resumeId,
      selectedModuleId,
    },
    ok: true,
  };
}

function isResumeDocument(value: unknown): value is ResumeDocument {
  return isRecord(value) &&
    Array.isArray(value.modules) &&
    value.modules.length > 0 &&
    typeof value.title === "string";
}

function chatErrorResponse(error: unknown) {
  if (error instanceof DifyResumeChatError) {
    return errorResponse(error.message, error.status, "dify", {
      details: error.details,
      stage: error.stage,
    });
  }

  return errorResponse("Resume chat failed", 500, "dify", error);
}

function errorResponse(
  message: string,
  status: number,
  stage: Stage,
  details?: unknown,
) {
  console.error("[resume-chat:error]", {
    details,
    message,
    stage,
    status,
  });

  return jsonResponse(
    {
      details,
      error: message,
      stage,
      status: "error",
    },
    { status },
  );
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
