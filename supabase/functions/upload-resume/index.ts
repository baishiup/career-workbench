/**
 * 简历列表上传入口。
 *
 * 这个函数只创建 resumes 记录并返回 profile_candidate，不覆盖
 * profiles.profile_data；用户确认覆盖 Profile 需要走 apply-resume-to-profile。
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { DifyResumeParseError, parseResumeWithDify } from "../_shared/dify-resume-parse.ts";
import { buildBaseResumeFromAIParsedDraft } from "../_shared/resume-normalize.ts";

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
    const parseResult = await parseResumeWithDify(file);
    // upload-resume 保持无 Profile 副作用；ProfileDraft 只作为候选结果返回。
    const built = buildBaseResumeFromAIParsedDraft(parseResult.parsed, {
      title: getResumeTitle(file.name, parseResult.parsed.candidate.full_name),
    });
    const { data: resume, error } = await auth.supabase
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
        updated_at: new Date().toISOString(),
        user_id: auth.user.id,
      })
      .select("id,title,source_type,status,document_json,style_json,created_at,updated_at")
      .single();

    if (error) {
      return errorResponse(error.message, 500, "database", error);
    }

    return jsonResponse({
      status: "ok",
      provider: parseResult.provider,
      file: parseResult.file,
      profile_candidate: built.profile,
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

  return errorResponse("Upload resume failed", 500, "request", serializeDetails(error));
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
