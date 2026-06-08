/**
 * 把已上传简历确认应用到 Profile。
 *
 * 这个函数不重新调用 Dify，只读取 resumes.ai_parsed_draft_json 重新归一化；
 * 这样用户确认动作可重复执行，也不会产生新的 AI 成本和不一致结果。
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  aiParsedResumeDraftToProfileDraft,
  type AIParsedResumeDraft,
} from "../_shared/resume-normalize.ts";

/** 用于前端和日志定位失败发生在哪一层。 */
type Stage = "request" | "auth" | "database";

/** apply-resume-to-profile 的最小请求体。 */
type ApplyResumeToProfileRequest = {
  resume_id?: string;
};

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

  let body: ApplyResumeToProfileRequest;

  try {
    body = await request.json();
  } catch (error) {
    return errorResponse("Invalid JSON body", 400, "request", error);
  }

  if (!body.resume_id) {
    return errorResponse("resume_id is required", 400, "request");
  }

  const { data: resume, error: resumeError } = await auth.supabase
    .from("resumes")
    .select("id,ai_parsed_draft_json")
    .eq("id", body.resume_id)
    .single();

  if (resumeError) {
    return errorResponse(resumeError.message, 500, "database", resumeError);
  }

  if (!isAIParsedResumeDraft(resume.ai_parsed_draft_json)) {
    return errorResponse(
      "Resume does not contain AIParsedResumeDraft.",
      400,
      "database",
    );
  }

  // 用保存下来的 AIParsedResumeDraft 重新生成 Profile，保持和上传链路同一套归一化规则。
  const profile = aiParsedResumeDraftToProfileDraft(resume.ai_parsed_draft_json);
  const { error: profileError } = await auth.supabase.from("profiles").upsert(
    {
      profile_data: profile,
      source: "resume_upload_apply",
      updated_at: new Date().toISOString(),
      user_id: auth.user.id,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return errorResponse(profileError.message, 500, "database", profileError);
  }

  return jsonResponse({
    status: "ok",
    profile,
    resume_id: body.resume_id,
  });
});

/** 轻量运行时校验，避免把任意 JSON 当作 AIParsedResumeDraft 写入 Profile。 */
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

function serializeDetails(details: unknown) {
  if (details instanceof Error) {
    return {
      message: details.message,
      name: details.name,
    };
  }

  return details ?? null;
}
