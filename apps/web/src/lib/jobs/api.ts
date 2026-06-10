import { getSupabaseClient } from "@/lib/supabase";
import { mockJobs } from "@/lib/jobs/mock-data";
import type {
  JobEmploymentType,
  JobImportMethod,
  JobImportStatus,
  JobRecord,
  JobRemoteStatus,
} from "@/lib/jobs/types";

type JobsDataMode = "supabase" | "mock";

class JobsApiError extends Error {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "JobsApiError";
    this.details = details;
  }
}

type JobDescriptionRow = {
  id: string;
  source_platform: string | null;
  source_url: string | null;
  company: string;
  title: string;
  company_stage: string | null;
  location: string | null;
  remote_status: JobRemoteStatus;
  job_type: JobEmploymentType;
  seniority: string | null;
  years_required: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  salary_range: string | null;
  posted_at: string | null;
  summary: string | null;
  imported_by: string | null;
  import_method: JobImportMethod;
  import_status: JobImportStatus;
};

const jobSelectColumns =
  "id,source_platform,source_url,company,title,company_stage,location,remote_status,job_type,seniority,years_required,required_skills,preferred_skills,responsibilities,requirements,salary_range,posted_at,summary,imported_by,import_method,import_status";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function listJobs(): Promise<{ jobs: JobRecord[]; mode: JobsDataMode }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { jobs: mockJobs, mode: "mock" };
  }

  const { data, error } = await supabase
    .from("job_descriptions")
    .select(jobSelectColumns)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  return {
    jobs: ((data ?? []) as JobDescriptionRow[]).map(mapJobRow),
    mode: "supabase",
  };
}

async function getJob(
  jobId: string,
): Promise<{ job: JobRecord | null; mode: JobsDataMode }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      job: mockJobs.find((job) => job.id === jobId) ?? null,
      mode: "mock",
    };
  }

  if (!uuidPattern.test(jobId)) {
    return { job: null, mode: "supabase" };
  }

  const { data, error } = await supabase
    .from("job_descriptions")
    .select(jobSelectColumns)
    .eq("id", jobId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  return {
    job: data ? mapJobRow(data as JobDescriptionRow) : null,
    mode: "supabase",
  };
}

function mapJobRow(row: JobDescriptionRow): JobRecord {
  return {
    id: row.id,
    sourcePlatform: row.source_platform,
    sourceUrl: row.source_url,
    company: row.company,
    title: row.title,
    companyStage: row.company_stage,
    location: row.location,
    remoteStatus: row.remote_status,
    jobType: row.job_type,
    seniority: row.seniority,
    yearsRequired: row.years_required,
    requiredSkills: row.required_skills ?? [],
    preferredSkills: row.preferred_skills ?? [],
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    salaryRange: row.salary_range,
    postedAt: row.posted_at ? row.posted_at.slice(0, 10) : null,
    summary: row.summary,
    importedBy: row.imported_by,
    importMethod: row.import_method,
    importStatus: row.import_status,
  };
}

export { getJob, JobsApiError, listJobs };
export type { JobsDataMode };
