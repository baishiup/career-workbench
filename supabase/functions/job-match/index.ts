/**
 * AI 匹配分析入口（登录用户）。
 *
 * 接收职位 id，读取当前用户 Profile 与职位行，在 match_reports 中 upsert
 * pending 行，调 Dify job_match workflow，把含匹配度的报告 JSON、双快照和
 * external_run_id 写回，最终置 succeeded / failed。每用户每职位一行，
 * 重新分析覆盖更新；匹配度由 AI 读取 Profile + JD 后产出。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import type { Database } from "../_shared/database.types.ts";
import {
  DifyJobMatchError,
  runJobMatchWithDify,
} from "../_shared/dify-job-match.ts";

/** 用于前端和日志定位失败发生在哪一层。 */
type Stage = "request" | "auth" | "config" | "data" | "dify" | "persist";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reportSelectColumns =
  "id,job_id,status,report_json,profile_snapshot_at,job_snapshot_at,external_run_id,error_message,created_at,updated_at";

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

  if (!isRecord(body)) {
    return errorResponse("Request body must be a JSON object", 400, "request");
  }

  const jobId = typeof body.job_id === "string" ? body.job_id.trim() : "";

  if (!uuidPattern.test(jobId)) {
    return errorResponse("job_id must be a valid uuid", 400, "request");
  }

  const supabase = auth.supabase;

  // 读取 Profile：叙事分析的事实来源，同时取 updated_at 作为快照。
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("profile_data,updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (profileError) {
    return errorResponse(profileError.message, 500, "data", profileError);
  }

  if (!profileRow || !hasProfileContent(profileRow.profile_data)) {
    return errorResponse(
      "Profile is required before running match analysis",
      400,
      "data",
    );
  }

  // 读取职位：RLS 已限制普通用户只能读启用职位。
  const { data: jobRow, error: jobError } = await supabase
    .from("job_descriptions")
    .select(
      "id,company,title,location,remote_status,job_type,years_required,required_skills,preferred_skills,responsibilities,requirements,salary_range,summary,updated_at",
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    return errorResponse(jobError.message, 500, "data", jobError);
  }

  if (!jobRow) {
    return errorResponse("Job not found", 404, "data");
  }

  // upsert pending：unique(user_id, job_id) 保证每用户每职位只有一行，
  // 重新分析覆盖旧报告，不留历史。
  const { error: pendingError } = await supabase
    .from("match_reports")
    .upsert(
      {
        user_id: auth.user.id,
        job_id: jobId,
        status: "pending",
        report_json: null,
        profile_snapshot_at: profileRow.updated_at,
        job_snapshot_at: jobRow.updated_at,
        external_run_id: null,
        error_message: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id" },
    );

  if (pendingError) {
    return errorResponse(pendingError.message, 500, "persist", pendingError);
  }

  try {
    const matchResult = await runJobMatchWithDify({
      profileJson: JSON.stringify(profileRow.profile_data),
      jobJson: JSON.stringify(jobRow),
    });

    const { data: reportRow, error: succeededError } = await supabase
      .from("match_reports")
      .update({
        status: "succeeded",
        report_json: matchResult.narrative,
        external_run_id: matchResult.workflowRunId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", auth.user.id)
      .eq("job_id", jobId)
      .select(reportSelectColumns)
      .single();

    if (succeededError) {
      return errorResponse(
        succeededError.message,
        500,
        "persist",
        succeededError,
      );
    }

    return jsonResponse({
      status: "ok",
      provider: matchResult.provider,
      report: reportRow,
    });
  } catch (error) {
    await markReportFailed(supabase, auth.user.id, jobId, error);
    return matchErrorResponse(error);
  }
});

/** Dify 失败时把行置为 failed，让前端能展示失败态并重试。 */
async function markReportFailed(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : "Job match failed";
  const workflowRunId = error instanceof DifyJobMatchError
    ? error.workflowRunId
    : null;

  const { error: failedError } = await supabase
    .from("match_reports")
    .update({
      status: "failed",
      external_run_id: workflowRunId,
      error_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("job_id", jobId);

  if (failedError) {
    console.error("[job-match:mark-failed-error]", {
      jobId,
      message: failedError.message,
    });
  }
}

function matchErrorResponse(error: unknown) {
  if (error instanceof DifyJobMatchError) {
    console.error("[job-match:dify-error]", {
      details: error.details,
      message: error.message,
      stage: error.stage,
      status: error.status,
      workflowRunId: error.workflowRunId,
    });

    return errorResponse(
      error.message,
      error.status,
      error.stage === "config" ? "config" : "dify",
      {
        details: error.details,
        stage: error.stage,
      },
    );
  }

  return errorResponse(
    "Job match failed",
    500,
    "dify",
    serializeDetails(error),
  );
}

/** Profile 行存在但 profile_data 还是空对象时同样视为无 Profile。 */
function hasProfileContent(value: unknown) {
  return isRecord(value) && Object.keys(value).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
