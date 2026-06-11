import { invokeEdgeFunction } from "@/lib/edge-functions";
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

/** job-parse Edge Function 返回的结构化职位草稿（snake_case 对齐 Dify 输出）。 */
type JobParseDraft = {
  schema_version: "job.parse.v1";
  source_platform: string | null;
  company: string | null;
  title: string | null;
  company_stage: string | null;
  location: string | null;
  remote_status: JobRemoteStatus | null;
  job_type: JobEmploymentType | null;
  seniority: string | null;
  years_required: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  requirements: string[];
  salary_range: string | null;
  posted_at: string | null;
  summary: string | null;
  parse_warnings: string[];
};

type JobParseResponse = {
  status: "ok";
  provider: "dify";
  parsed: JobParseDraft;
  parse_warnings: string[];
};

/** admin 创建/编辑职位时的输入；id 与时间戳由数据库管理。 */
type JobDraftInput = {
  sourcePlatform: string | null;
  sourceUrl: string | null;
  company: string;
  title: string;
  companyStage: string | null;
  location: string | null;
  remoteStatus: JobRemoteStatus;
  jobType: JobEmploymentType;
  seniority: string | null;
  yearsRequired: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requirements: string[];
  salaryRange: string | null;
  postedAt: string | null;
  summary: string | null;
  importedBy: string | null;
  importMethod: JobImportMethod;
  importStatus: JobImportStatus;
};

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
  is_active: boolean;
};

const jobSelectColumns =
  "id,source_platform,source_url,company,title,company_stage,location,remote_status,job_type,seniority,years_required,required_skills,preferred_skills,responsibilities,requirements,salary_range,posted_at,summary,imported_by,import_method,import_status,is_active";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function listJobs(): Promise<{ jobs: JobRecord[]; mode: JobsDataMode }> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    // mock 模式没有 admin，本地直接过滤掉停用职位。
    return { jobs: mockJobs.filter((job) => job.isActive), mode: "mock" };
  }

  // 可见性交给 RLS：普通用户只放行启用职位，admin 能读到停用职位。
  const { data, error } = await supabase
    .from("job_descriptions")
    .select(jobSelectColumns)
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
    .maybeSingle();

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  return {
    job: data ? mapJobRow(data as JobDescriptionRow) : null,
    mode: "supabase",
  };
}

async function createJob(input: JobDraftInput): Promise<JobRecord> {
  const supabase = requireSupabase("创建职位");

  const { data, error } = await supabase
    .from("job_descriptions")
    .insert(toJobRowPayload(input))
    .select(jobSelectColumns)
    .single();

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  return mapJobRow(data as JobDescriptionRow);
}

async function updateJob(
  jobId: string,
  input: JobDraftInput,
): Promise<JobRecord> {
  const supabase = requireSupabase("编辑职位");

  const { data, error } = await supabase
    .from("job_descriptions")
    .update({
      ...toJobRowPayload(input),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select(jobSelectColumns)
    .maybeSingle();

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  if (!data) {
    throw new JobsApiError("没有找到这个职位，或没有编辑权限。");
  }

  return mapJobRow(data as JobDescriptionRow);
}

async function setJobActive(
  jobId: string,
  isActive: boolean,
): Promise<JobRecord> {
  const supabase = requireSupabase(isActive ? "启用职位" : "停用职位");

  const { data, error } = await supabase
    .from("job_descriptions")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select(jobSelectColumns)
    .maybeSingle();

  if (error) {
    throw new JobsApiError(error.message, error);
  }

  if (!data) {
    throw new JobsApiError("没有找到这个职位，或没有操作权限。");
  }

  return mapJobRow(data as JobDescriptionRow);
}

/** 调 job-parse Edge Function 解析 JD 文本和/或截图，仅 admin 可用。 */
async function parseJobDescription(input: {
  jdText?: string;
  screenshots?: File[];
}): Promise<JobParseResponse> {
  const formData = new FormData();

  if (input.jdText?.trim()) {
    formData.append("jd_text", input.jdText.trim());
  }

  for (const screenshot of input.screenshots ?? []) {
    formData.append("screenshots", screenshot, screenshot.name);
  }

  return invokeEdgeFunction<JobParseResponse>("job-parse", formData);
}

function requireSupabase(action: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new JobsApiError(`Supabase 未配置，无法${action}。`);
  }

  return supabase;
}

function toJobRowPayload(input: JobDraftInput) {
  return {
    company: input.company,
    company_stage: input.companyStage,
    import_method: input.importMethod,
    import_status: input.importStatus,
    imported_by: input.importedBy,
    job_type: input.jobType,
    location: input.location,
    posted_at: input.postedAt,
    preferred_skills: input.preferredSkills,
    remote_status: input.remoteStatus,
    required_skills: input.requiredSkills,
    requirements: input.requirements,
    responsibilities: input.responsibilities,
    salary_range: input.salaryRange,
    seniority: input.seniority,
    source_platform: input.sourcePlatform,
    source_url: input.sourceUrl,
    summary: input.summary,
    title: input.title,
    years_required: input.yearsRequired,
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
    isActive: row.is_active,
  };
}

export {
  createJob,
  getJob,
  JobsApiError,
  listJobs,
  parseJobDescription,
  setJobActive,
  updateJob,
};
export type { JobDraftInput, JobParseDraft, JobParseResponse, JobsDataMode };
