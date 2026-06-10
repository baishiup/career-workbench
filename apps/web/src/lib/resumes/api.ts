import { getSupabaseClient } from "@/lib/supabase";
import type { JobPreferences } from "@career-workbench/domain";
import type {
  ApplyResumeToProfileResponse,
  CompleteOnboardingWithResumeResponse,
  ResumeFunctionErrorDetails,
  ResumeFunctionRow,
  ResumeListRow,
  UploadResumeResponse,
} from "@/lib/resumes/types";

class ResumeFunctionError extends Error {
  details?: unknown;
  status?: number;

  constructor(message: string, options: ResumeFunctionErrorDetails = {}) {
    super(message);
    this.name = "ResumeFunctionError";
    this.details = options.details;
    this.status = options.status;
  }
}

async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("resume_file", file);

  return invokeResumeFunction<UploadResumeResponse>("upload-resume", formData);
}

async function listResumes() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError("Supabase 未配置，无法读取简历列表。");
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,source_type,status,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  return (data ?? []) as ResumeListRow[];
}

async function renameResume(resumeId: string, title: string) {
  const supabase = getSupabaseClient();
  const nextTitle = title.trim();

  if (!supabase) {
    throw new ResumeFunctionError("Supabase 未配置，无法修改简历名称。");
  }

  if (!nextTitle) {
    throw new ResumeFunctionError("简历名称不能为空。");
  }

  const { data, error } = await supabase
    .from("resumes")
    .update({
      title: nextTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId)
    .select("id,title,source_type,status,created_at,updated_at")
    .single();

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  if (!data) {
    throw new ResumeFunctionError("没有找到这份简历。");
  }

  return data as ResumeListRow;
}

async function deleteResume(resumeId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError("Supabase 未配置，无法删除简历。");
  }

  const { count, error: countError } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new ResumeFunctionError(countError.message, { details: countError });
  }

  if ((count ?? 0) <= 1) {
    throw new ResumeFunctionError("至少保留一份简历。");
  }

  const { data, error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .select("id")
    .single();

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  if (!data) {
    throw new ResumeFunctionError("没有找到这份简历。");
  }

  return { id: data.id as string };
}

async function getResume(resumeId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError("Supabase 未配置，无法读取简历详情。");
  }

  const { data, error } = await supabase
    .from("resumes")
    .select(
      "id,title,source_type,status,document_json,style_json,created_at,updated_at",
    )
    .eq("id", resumeId)
    .single();

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  if (!data) {
    throw new ResumeFunctionError("没有找到这份简历。");
  }

  return data as ResumeFunctionRow;
}

async function completeOnboardingWithResume(
  file: File,
  preferences: JobPreferences,
) {
  const formData = new FormData();
  formData.append("resume_file", file);
  formData.append("preferences_json", JSON.stringify(preferences));

  return invokeResumeFunction<CompleteOnboardingWithResumeResponse>(
    "complete-onboarding-with-resume",
    formData,
  );
}

async function applyResumeToProfile(resumeId: string) {
  return invokeResumeFunction<ApplyResumeToProfileResponse>(
    "apply-resume-to-profile",
    {
      resume_id: resumeId,
    },
  );
}

async function invokeResumeFunction<TResponse>(
  functionName: string,
  body: BodyInit | Record<string, unknown>,
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError(
      `Supabase 未配置，无法调用 ${functionName} Edge Function。`,
    );
  }

  const { data, error } = await supabase.functions.invoke<TResponse>(
    functionName,
    {
      body,
    },
  );

  if (error) {
    const details = await readFunctionErrorDetails(error);
    throw new ResumeFunctionError(
      buildFunctionErrorMessage(error.message, details),
      details,
    );
  }

  if (!data) {
    throw new ResumeFunctionError(`${functionName} Edge Function 返回为空。`);
  }

  return data;
}

function buildFunctionErrorMessage(
  fallback: string,
  errorDetails: ResumeFunctionErrorDetails,
) {
  const body = asRecord(errorDetails.details);
  const nested = asRecord(body?.details);
  const upstreamDetails = asRecord(nested?.details);
  const upstreamBody = asRecord(upstreamDetails?.body);
  const stages = [body?.stage, nested?.stage]
    .map((stage) => typeof stage === "string" ? stage : null)
    .filter(Boolean);
  const upstreamMessage = getFirstString(
    upstreamBody?.message,
    upstreamBody?.error,
    upstreamBody?.code,
  );
  const metadata = [
    errorDetails.status ? `HTTP ${errorDetails.status}` : null,
    stages.length > 0 ? `stage: ${stages.join("/")}` : null,
    typeof upstreamDetails?.status === "number"
      ? `upstream: ${upstreamDetails.status}`
      : null,
    upstreamMessage ? `原因: ${upstreamMessage}` : null,
  ].filter(Boolean);
  const message = getFirstString(body?.error, fallback) ?? fallback;

  return metadata.length > 0 ? `${message}（${metadata.join("，")}）` : message;
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

async function readFunctionErrorDetails(
  error: unknown,
): Promise<ResumeFunctionErrorDetails> {
  const context = (error as { context?: unknown }).context;

  if (!(context instanceof Response)) {
    return {};
  }

  return {
    details: await readResponseBody(context),
    status: context.status,
  };
}

async function readResponseBody(response: Response) {
  const text = await response.clone().text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export {
  applyResumeToProfile,
  completeOnboardingWithResume,
  deleteResume,
  getResume,
  listResumes,
  renameResume,
  ResumeFunctionError,
  uploadResume,
};
