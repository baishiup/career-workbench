/**
 * match_reports 的读取与分析触发。
 *
 * 职位详情页消费；后续 resume_generate 任务也会复用最新匹配报告。
 * 匹配度和叙事都由 AI 产出，这里只管报告的持久化读写。
 */

import { invokeEdgeFunction } from "@/lib/edge-functions";
import { mockJobs } from "@/lib/jobs/mock-data";
import { getSupabaseClient } from "@/lib/supabase";
import {
  coerceMatchReportNarrative,
  isMatchReportStale,
  type MatchReportNarrative,
  type MatchReportStatus,
} from "@career-workbench/domain";

type MatchReportsDataMode = "supabase" | "mock";

/** 一条 (user, job) 的叙事分析报告，对应 match_reports 行。 */
type MatchReportRecord = {
  id: string;
  jobId: string;
  status: MatchReportStatus;
  /** 解析后的叙事；pending / failed 或 report_json 非法时为 null。 */
  narrative: MatchReportNarrative | null;
  profileSnapshotAt: string | null;
  jobSnapshotAt: string | null;
  /** 外部分析任务 ID，仅排错展示用。 */
  externalRunId: string | null;
  errorMessage: string | null;
  updatedAt: string | null;
};

/** 详情页一次拉取的报告上下文：报告本体 + 过期判断结果。 */
type MatchReportContext = {
  report: MatchReportRecord | null;
  /** 资料或职位在报告生成后是否更新过。 */
  isStale: boolean;
  mode: MatchReportsDataMode;
};

type MatchReportRow = {
  id: string;
  job_id: string;
  status: MatchReportStatus;
  report_json: unknown;
  profile_snapshot_at: string | null;
  job_snapshot_at: string | null;
  external_run_id: string | null;
  error_message: string | null;
  updated_at: string | null;
};

type JobMatchResponse = {
  status: "ok";
  provider: "dify";
  report: MatchReportRow;
};

const reportSelectColumns =
  "id,job_id,status,report_json,profile_snapshot_at,job_snapshot_at,external_run_id,error_message,updated_at";

class MatchReportApiError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "MatchReportApiError";
    this.details = details;
  }
}

/** 读取当前用户在该职位下的报告，并基于双快照判断是否过期。 */
async function fetchMatchReportContext(
  jobId: string,
): Promise<MatchReportContext> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return buildMockContext(jobId);
  }

  const [reportResult, profileResult, jobResult] = await Promise.all([
    supabase
      .from("match_reports")
      .select(reportSelectColumns)
      .eq("job_id", jobId)
      .maybeSingle(),
    // RLS owner-only，select 不带 user 条件也只会返回自己的资料行。
    supabase.from("profiles").select("updated_at").maybeSingle(),
    supabase
      .from("job_descriptions")
      .select("updated_at")
      .eq("id", jobId)
      .maybeSingle(),
  ]);

  const firstError =
    reportResult.error ?? profileResult.error ?? jobResult.error;

  if (firstError) {
    throw new MatchReportApiError(firstError.message, firstError);
  }

  const report = reportResult.data
    ? mapReportRow(reportResult.data as MatchReportRow)
    : null;

  const isStale =
    report?.status === "succeeded" &&
    isMatchReportStale({
      profileSnapshotAt: report.profileSnapshotAt,
      jobSnapshotAt: report.jobSnapshotAt,
      profileUpdatedAt: profileResult.data?.updated_at ?? null,
      jobUpdatedAt: jobResult.data?.updated_at ?? null,
    });

  return { report, isStale, mode: "supabase" };
}

/** 触发 job-match，由 AI 读取资料和职位描述产出匹配度与叙事。 */
async function runJobMatchAnalysis(jobId: string): Promise<MatchReportRecord> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const mockReport = buildMockContext(jobId).report;

    if (!mockReport) {
      throw new MatchReportApiError("当前无法连接服务，请稍后重试。");
    }

    return mockReport;
  }

  const response = await invokeEdgeFunction<JobMatchResponse>("job-match", {
    job_id: jobId,
  });

  return mapReportRow(response.report);
}

/** 无 Supabase env 时用 fixture 里的 demo 报告验证 UI。 */
function buildMockContext(jobId: string): MatchReportContext {
  const mockMatch = mockJobs.find((job) => job.id === jobId)?.match;

  if (!mockMatch) {
    return { report: null, isStale: false, mode: "mock" };
  }

  return {
    report: {
      id: mockMatch.runId,
      jobId,
      status: "succeeded",
      narrative: {
        matchScore: mockMatch.score,
        evidence: mockMatch.evidence,
        gaps: mockMatch.gaps,
        risks: mockMatch.risks,
        aiNote: mockMatch.aiNote,
      },
      profileSnapshotAt: null,
      jobSnapshotAt: null,
      externalRunId: mockMatch.runId,
      errorMessage: null,
      updatedAt: mockMatch.generatedAt,
    },
    isStale: false,
    mode: "mock",
  };
}

function mapReportRow(row: MatchReportRow): MatchReportRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    status: row.status,
    narrative: coerceMatchReportNarrative(row.report_json),
    profileSnapshotAt: row.profile_snapshot_at,
    jobSnapshotAt: row.job_snapshot_at,
    externalRunId: row.external_run_id,
    errorMessage: row.error_message,
    updatedAt: row.updated_at,
  };
}

export { fetchMatchReportContext, MatchReportApiError, runJobMatchAnalysis };
export type { MatchReportContext, MatchReportRecord, MatchReportsDataMode };
