/**
 * 生成 target job 简历草稿（登录用户）。
 *
 * 读取当前用户 Profile、结构化 JD 和最新未过期的 match report，调用
 * Dify resume_generate workflow 生成 ResumeDocument，并写入 resumes 表。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedClient } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import type { Database } from "../_shared/database.types.ts";
import {
  DifyResumeGenerateError,
  runResumeGenerateWithDify,
} from "../_shared/dify-resume-generate.ts";
import {
  createDefaultResumeStyleConfig,
  type ProfileDraft,
  profileDraftToBaseResumeDocument,
  type ResumeDocument,
} from "../_shared/resume-normalize.ts";

/** 用于前端和日志定位失败发生在哪一层。 */
type Stage = "request" | "auth" | "config" | "data" | "dify" | "persist";

type JobRow = {
  company: string;
  id: string;
  job_type: string;
  location: string | null;
  preferred_skills: string[] | null;
  remote_status: string;
  required_skills: string[] | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  salary_range: string | null;
  seniority: string | null;
  summary: string | null;
  title: string;
  updated_at: string | null;
  years_required: string | null;
};

type MatchReportRow = {
  error_message: string | null;
  external_run_id: string | null;
  id: string;
  job_id: string;
  job_snapshot_at: string | null;
  profile_snapshot_at: string | null;
  report_json: unknown;
  status: string;
  updated_at: string | null;
  user_id: string;
};

type FallbackContext = {
  errorMessage: string;
  reason: "invalid_dify_document";
  stage: string;
  workflowRunId: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const resumeSelectColumns =
  "id,title,source_type,document_json,style_json,created_at,updated_at";

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

  const jobId = normalizeJobId(body.job_id);

  if (!jobId) {
    return errorResponse("job_id is required", 400, "request");
  }

  if (!uuidPattern.test(jobId)) {
    return errorResponse("job_id must be a valid uuid", 400, "request");
  }

  const supabase = auth.supabase;
  const prepared = await prepareGenerationInputs(supabase, auth.user.id, jobId);

  if (!prepared.ok) {
    return errorResponse(
      prepared.message,
      prepared.status,
      "data",
      prepared.details,
    );
  }

  const { job, matchReport, profileData } = prepared;
  const generatedAt = new Date().toISOString();

  try {
    try {
      const generateResult = await runResumeGenerateWithDify({
        jobJson: JSON.stringify(job),
        matchReportJson: JSON.stringify({
          id: matchReport.id,
          job_id: matchReport.job_id,
          job_snapshot_at: matchReport.job_snapshot_at,
          profile_snapshot_at: matchReport.profile_snapshot_at,
          report_json: matchReport.report_json,
          updated_at: matchReport.updated_at,
        }),
        profileJson: JSON.stringify(profileData),
      });
      const document = withTargetContext(generateResult.document, job);

      return await persistGeneratedResume({
        document,
        fallback: null,
        generatedAt,
        job,
        matchReport,
        provider: generateResult.provider,
        supabase,
        userId: auth.user.id,
        workflowRunId: generateResult.workflowRunId,
      });
    } catch (error) {
      if (canFallbackToProfileResume(error) && isProfileDraft(profileData)) {
        console.error("[resume-generate:dify-output-fallback]", {
          details: error.details,
          message: error.message,
          stage: error.stage,
          status: error.status,
          workflowRunId: error.workflowRunId,
        });

        const document = buildProfileFallbackDocument(profileData, job);

        return await persistGeneratedResume({
          document,
          fallback: {
            errorMessage: error.message,
            reason: "invalid_dify_document",
            stage: error.stage,
            workflowRunId: error.workflowRunId,
          },
          generatedAt,
          job,
          matchReport,
          provider: "dify",
          supabase,
          userId: auth.user.id,
          workflowRunId: error.workflowRunId,
        });
      }

      throw error;
    }
  } catch (error) {
    return generateErrorResponse(error);
  }
});

async function prepareGenerationInputs(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobId: string,
): Promise<
  | {
    ok: true;
    job: JobRow;
    matchReport: MatchReportRow;
    profileData: unknown;
  }
  | {
    ok: false;
    status: number;
    message: string;
    details?: unknown;
  }
> {
  const [profileResult, jobResult, reportResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("profile_data,updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("job_descriptions")
      .select(
        "id,company,title,location,remote_status,job_type,seniority,years_required,required_skills,preferred_skills,responsibilities,requirements,salary_range,summary,updated_at",
      )
      .eq("id", jobId)
      .maybeSingle(),
    supabase
      .from("match_reports")
      .select(
        "id,user_id,job_id,status,report_json,profile_snapshot_at,job_snapshot_at,external_run_id,error_message,updated_at",
      )
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .maybeSingle(),
  ]);

  const firstError = profileResult.error ?? jobResult.error ??
    reportResult.error;

  if (firstError) {
    return {
      ok: false,
      status: 500,
      message: firstError.message,
      details: firstError,
    };
  }

  if (
    !profileResult.data || !hasProfileContent(profileResult.data.profile_data)
  ) {
    return {
      ok: false,
      status: 400,
      message: "Profile is required before generating a target resume",
    };
  }

  if (!jobResult.data) {
    return {
      ok: false,
      status: 404,
      message: "Job not found",
    };
  }

  const matchReport = reportResult.data as MatchReportRow | null;

  if (!matchReport || matchReport.status !== "succeeded") {
    return {
      ok: false,
      status: 400,
      message: "A fresh match report is required before generating a resume",
      details: { reason: "missing_or_not_succeeded" },
    };
  }

  if (!isRecord(matchReport.report_json)) {
    return {
      ok: false,
      status: 400,
      message: "Match report output is not available",
      details: { reason: "invalid_report_json" },
    };
  }

  if (
    isStale({
      currentJobUpdatedAt: jobResult.data.updated_at,
      currentProfileUpdatedAt: profileResult.data.updated_at,
      jobSnapshotAt: matchReport.job_snapshot_at,
      profileSnapshotAt: matchReport.profile_snapshot_at,
    })
  ) {
    return {
      ok: false,
      status: 400,
      message: "Match report is stale. Re-run analysis before generating.",
      details: { reason: "stale_report" },
    };
  }

  return {
    ok: true,
    job: jobResult.data as JobRow,
    matchReport,
    profileData: profileResult.data.profile_data,
  };
}

function withTargetContext(
  document: ResumeDocument,
  job: JobRow,
): ResumeDocument {
  return {
    ...document,
    target: {
      ...document.target,
      company: job.company,
      jobId: job.id,
      title: job.title,
    },
    title: document.title.trim() ||
      `${job.company} ${job.title} 定制简历`,
  };
}

function buildProfileFallbackDocument(
  profileData: ProfileDraft,
  job: JobRow,
): ResumeDocument {
  const document = withTargetContext(
    profileDraftToBaseResumeDocument(profileData, {
      locale: "zh-CN",
      title: `${job.company} ${job.title} 定制简历`,
    }),
    job,
  );

  if (document.sections.length > 0) {
    return document;
  }

  return {
    ...document,
    sections: [{
      blocks: [{
        id: "fallback-summary",
        kind: "paragraph" as const,
        label: "职业摘要",
        text: "",
      }],
      id: "section-summary",
      kind: "summary" as const,
      title: "Professional Summary",
      visible: true,
    }],
  };
}

async function persistGeneratedResume(input: {
  document: ResumeDocument;
  fallback: FallbackContext | null;
  generatedAt: string;
  job: JobRow;
  matchReport: MatchReportRow;
  provider: "dify";
  supabase: SupabaseClient<Database>;
  userId: string;
  workflowRunId: string | null;
}) {
  const { data: resume, error: resumeError } = await input.supabase
    .from("resumes")
    .insert({
      ai_parsed_draft_json: null,
      document_json: input.document,
      source_context_json: buildSourceContext({
        error: null,
        fallback: input.fallback,
        generatedAt: input.generatedAt,
        job: input.job,
        matchReport: input.matchReport,
        provider: input.provider,
        workflowRunId: input.workflowRunId,
      }),
      source_type: "target_job",
      style_json: createDefaultResumeStyleConfig(),
      title: input.document.title,
      updated_at: input.generatedAt,
      user_id: input.userId,
    })
    .select(resumeSelectColumns)
    .single();

  if (resumeError) {
    return errorResponse(resumeError.message, 500, "persist", resumeError);
  }

  return jsonResponse({
    status: "ok",
    provider: input.provider,
    resume,
  });
}

function buildSourceContext(input: {
  error: { message: string; stage: string } | null;
  fallback: FallbackContext | null;
  generatedAt: string;
  job: JobRow;
  matchReport: MatchReportRow;
  provider: "dify";
  workflowRunId: string | null;
}) {
  return {
    error_message: input.error?.message ?? null,
    error_stage: input.error?.stage ?? null,
    fallback_error_message: input.fallback?.errorMessage ?? null,
    fallback_reason: input.fallback?.reason ?? null,
    fallback_stage: input.fallback?.stage ?? null,
    generated_at: input.generatedAt,
    job: {
      company: input.job.company,
      summary: input.job.summary,
      title: input.job.title,
    },
    job_id: input.job.id,
    match_report_id: input.matchReport.id,
    match_report_updated_at: input.matchReport.updated_at,
    provider: input.provider,
    report_job_snapshot_at: input.matchReport.job_snapshot_at,
    report_profile_snapshot_at: input.matchReport.profile_snapshot_at,
    workflow_run_id: input.workflowRunId,
    workflow_run_id_before_fallback: input.fallback?.workflowRunId ?? null,
  };
}

function generateErrorResponse(error: unknown) {
  if (error instanceof DifyResumeGenerateError) {
    console.error("[resume-generate:dify-error]", {
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
    "Resume generation failed",
    500,
    "dify",
    serializeDetails(error),
  );
}

function canFallbackToProfileResume(
  error: unknown,
): error is DifyResumeGenerateError {
  return error instanceof DifyResumeGenerateError &&
    error.stage === "workflow_output";
}

function hasProfileContent(value: unknown) {
  return isRecord(value) && Object.keys(value).length > 0;
}

function isProfileDraft(value: unknown): value is ProfileDraft {
  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value.personal) &&
    isRecord(value.preferences) &&
    Array.isArray(value.education) &&
    Array.isArray(value.work) &&
    Array.isArray(value.projects) &&
    Array.isArray(value.skills);
}

function normalizeJobId(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const fromCommaSeparatedBytes = uuidFromCommaSeparatedBytes(trimmed);

    return fromCommaSeparatedBytes ?? trimmed;
  }

  if (Array.isArray(value) && value.every(isByte)) {
    return bytesToUuid(value);
  }

  return "";
}

function uuidFromCommaSeparatedBytes(value: string) {
  if (!/^\d+(?:,\d+){15}$/.test(value)) {
    return null;
  }

  const bytes = value.split(",").map((part) => Number(part));

  return bytes.every(isByte) ? bytesToUuid(bytes) : null;
}

function bytesToUuid(bytes: number[]) {
  if (bytes.length !== 16) {
    return "";
  }

  const hex = bytes
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function isByte(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 255;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStale(input: {
  currentJobUpdatedAt: string | null;
  currentProfileUpdatedAt: string | null;
  jobSnapshotAt: string | null;
  profileSnapshotAt: string | null;
}) {
  return (
    isAxisStale(input.profileSnapshotAt, input.currentProfileUpdatedAt) ||
    isAxisStale(input.jobSnapshotAt, input.currentJobUpdatedAt)
  );
}

function isAxisStale(snapshotAt: string | null, updatedAt: string | null) {
  const updated = parseTimestamp(updatedAt);

  if (updated === null) {
    return false;
  }

  const snapshot = parseTimestamp(snapshotAt);

  if (snapshot === null) {
    return true;
  }

  return updated > snapshot;
}

function parseTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
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
