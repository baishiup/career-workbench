/**
 * JD 解析入口（仅 admin）。
 *
 * 接收 JD 文本和/或职位截图，调 Dify job_parse workflow 解析成结构化职位
 * 草稿返回给前端预填导入表单。本函数不落库，保存由 admin 在前端确认后
 * 直接写 job_descriptions（RLS 限 admin）。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  DifyJobParseError,
  parseJobWithDify,
} from "../_shared/dify-job-parse.ts";

/** 用于前端和日志定位失败发生在哪一层。 */
type Stage = "request" | "auth" | "config" | "dify";

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

  // 用户态 client 读自己那行 users，RLS 放行 owner select。
  const { data: userRow, error: userError } = await auth.supabase
    .from("users")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (userError) {
    return errorResponse(userError.message, 500, "auth", userError);
  }

  if (!userRow?.is_admin) {
    return errorResponse("Admin access required", 403, "auth");
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    return errorResponse("Invalid multipart form data", 400, "request", error);
  }

  const jdTextField = formData.get("jd_text");
  const jdText = typeof jdTextField === "string" ? jdTextField.trim() : "";
  const screenshots = formData
    .getAll("screenshots")
    .filter((field): field is File => field instanceof File);

  if (!jdText && screenshots.length === 0) {
    return errorResponse(
      "Either jd_text or screenshots is required",
      400,
      "request",
    );
  }

  try {
    const parseResult = await parseJobWithDify({
      jdText: jdText || null,
      screenshots,
    });

    return jsonResponse({
      status: "ok",
      provider: parseResult.provider,
      parsed: parseResult.parsed,
      parse_warnings: parseResult.parsed.parse_warnings,
    });
  } catch (error) {
    return parseErrorResponse(error);
  }
});

function parseErrorResponse(error: unknown) {
  if (error instanceof DifyJobParseError) {
    console.error("[job-parse:dify-error]", {
      details: error.details,
      message: error.message,
      stage: error.stage,
      status: error.status,
    });

    return errorResponse(error.message, error.status, getErrorStage(error), {
      details: error.details,
      stage: error.stage,
    });
  }

  return errorResponse(
    "Job parse failed",
    500,
    "request",
    serializeDetails(error),
  );
}

function getErrorStage(error: DifyJobParseError): Stage {
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
