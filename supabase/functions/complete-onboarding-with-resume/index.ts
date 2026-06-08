/**
 * Onboarding 简历上传完成入口。
 *
 * 用户仍处在首次建档阶段，所以这里允许用 AI 解析结果覆盖
 * profiles.profile_data，并同步创建一份基础 resume。
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { DifyResumeParseError, parseResumeWithDify } from "../_shared/dify-resume-parse.ts";
import {
  buildBaseResumeFromAIParsedDraft,
  type AIParsedResumeDraftToProfileOptions,
} from "../_shared/resume-normalize.ts";

/** 用于前端和日志定位失败发生在哪一层。 */
type Stage = "request" | "auth" | "config" | "dify" | "database";

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

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    return errorResponse("Invalid multipart form data", 400, "request", error);
  }

  const file = getResumeFile(formData);

  if (!file) {
    return errorResponse("resume_file is required", 400, "request");
  }

  try {
    const preferences = parsePreferences(formData.get("preferences_json"));
    const parseResult = await parseResumeWithDify(file);
    // 主链路必须保持 parsed -> profile -> resume，避免两套 mapper 产生数据漂移。
    const built = buildBaseResumeFromAIParsedDraft(parseResult.parsed, {
      preferences,
      title: getResumeTitle(file.name, parseResult.parsed.candidate.full_name),
    });
    const updatedAt = new Date().toISOString();
    const { error: profileError } = await auth.supabase.from("profiles").upsert(
      {
        profile_data: built.profile,
        source: "onboarding_resume_parse",
        updated_at: updatedAt,
        user_id: auth.user.id,
      },
      { onConflict: "user_id" },
    );

    if (profileError) {
      return errorResponse(profileError.message, 500, "database", profileError);
    }

    const { data: resume, error: resumeError } = await auth.supabase
      .from("resumes")
      .insert({
        ai_parsed_draft_json: parseResult.parsed,
        document_json: built.document,
        source_context_json: {
          file: parseResult.file,
          provider: parseResult.provider,
          workflow_outputs: parseResult.raw.outputs,
        },
        source_type: "manual_upload",
        status: "ready",
        style_json: built.style,
        title: built.document.title,
        updated_at: updatedAt,
        user_id: auth.user.id,
      })
      .select("id,title,source_type,status,document_json,style_json,created_at,updated_at")
      .single();

    if (resumeError) {
      return errorResponse(resumeError.message, 500, "database", resumeError);
    }

    // Onboarding 场景直接完成建档；列表页上传不能复用这个副作用。
    const { error: userError } = await auth.supabase
      .from("users")
      .update({
        has_completed_onboarding: true,
        updated_at: updatedAt,
      })
      .eq("id", auth.user.id);

    if (userError) {
      return errorResponse(userError.message, 500, "database", userError);
    }

    return jsonResponse({
      status: "ok",
      provider: parseResult.provider,
      file: parseResult.file,
      profile: built.profile,
      resume,
      parse_warnings: parseResult.parsed.parse_warnings,
    });
  } catch (error) {
    return parseErrorResponse(error);
  }
});

function getResumeFile(formData: FormData) {
  const fileField = formData.get("resume_file") ?? formData.get("file");

  return fileField instanceof File ? fileField : null;
}

function parsePreferences(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(value) as AIParsedResumeDraftToProfileOptions["preferences"];
  } catch {
    throw new DifyResumeParseError(
      "preferences_json must be valid JSON",
      400,
      "request",
    );
  }
}

function getResumeTitle(fileName: string, fullName: string | null) {
  const baseName = fileName.replace(/\.(pdf|docx?|rtf)$/i, "").trim();

  return baseName || fullName?.trim() || "Uploaded Resume";
}

function parseErrorResponse(error: unknown) {
  if (error instanceof DifyResumeParseError) {
    return errorResponse(error.message, error.status, getErrorStage(error), {
      details: error.details,
      stage: error.stage,
    });
  }

  return errorResponse("Complete onboarding with resume failed", 500, "request", serializeDetails(error));
}

function getErrorStage(error: DifyResumeParseError): Stage {
  if (error.stage === "request" || error.stage === "config") {
    return error.stage;
  }

  return "dify";
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
