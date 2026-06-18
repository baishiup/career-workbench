import { EdgeFunctionError, invokeEdgeFunction } from "@/lib/edge-functions";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  JobPreferences,
  ResumeDocument,
  ResumeStyleConfig,
} from "@career-workbench/domain";
import type {
  ApplyResumeToProfileResponse,
  CompleteOnboardingWithResumeResponse,
  ResumeChatResponse,
  ResumeGenerateResponse,
  ResumeFunctionRow,
  ResumeListRow,
  UploadResumeResponse,
} from "@/lib/resumes/types";

// 历史命名保留：resumes feature 内沿用 ResumeFunctionError 这个名字。
const ResumeFunctionError = EdgeFunctionError;
const serviceUnavailableMessage = "当前无法连接服务，请稍后重试。";

async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("resume_file", file);

  return invokeEdgeFunction<UploadResumeResponse>("upload-resume", formData);
}

async function listResumes() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError(serviceUnavailableMessage);
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,source_type,created_at,updated_at")
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
    throw new ResumeFunctionError(serviceUnavailableMessage);
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
    .select("id,title,source_type,created_at,updated_at")
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
    throw new ResumeFunctionError(serviceUnavailableMessage);
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

/** 保存编辑器修改：行 title 始终跟随 document.title，保持列表展示一致。 */
async function saveResumeContent(
  resumeId: string,
  input: { document: ResumeDocument; style: ResumeStyleConfig },
) {
  const supabase = getSupabaseClient();
  const title = input.document.title.trim();

  if (!supabase) {
    throw new ResumeFunctionError(serviceUnavailableMessage);
  }

  if (!title) {
    throw new ResumeFunctionError("简历标题不能为空，无法保存。");
  }

  const { data, error } = await supabase
    .from("resumes")
    .update({
      document_json: { ...input.document, title },
      style_json: input.style,
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId)
    .select(
      "id,title,source_type,document_json,style_json,created_at,updated_at",
    )
    .single();

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  if (!data) {
    throw new ResumeFunctionError("没有找到这份简历。");
  }

  return data as ResumeFunctionRow;
}

async function getResume(resumeId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError(serviceUnavailableMessage);
  }

  const { data, error } = await supabase
    .from("resumes")
    .select(
      "id,title,source_type,document_json,style_json,created_at,updated_at",
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

async function getLatestTargetJobResume(jobId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ResumeFunctionError(serviceUnavailableMessage);
  }

  const { data, error } = await supabase
    .from("resumes")
    .select(
      "id,title,source_type,document_json,style_json,source_context_json,created_at,updated_at",
    )
    .eq("source_type", "target_job")
    .contains("source_context_json", { job_id: jobId })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ResumeFunctionError(error.message, { details: error });
  }

  return (data ?? null) as ResumeFunctionRow | null;
}

async function completeOnboardingWithResume(
  file: File,
  preferences: JobPreferences,
) {
  const formData = new FormData();
  formData.append("resume_file", file);
  formData.append("preferences_json", JSON.stringify(preferences));

  return invokeEdgeFunction<CompleteOnboardingWithResumeResponse>(
    "complete-onboarding-with-resume",
    formData,
  );
}

async function applyResumeToProfile(resumeId: string) {
  return invokeEdgeFunction<ApplyResumeToProfileResponse>(
    "apply-resume-to-profile",
    {
      resume_id: resumeId,
    },
  );
}

async function generateTargetJobResume(jobId: string) {
  return invokeEdgeFunction<ResumeGenerateResponse>("resume-generate", {
    job_id: jobId,
  });
}

async function generateResumeChatPatch(input: {
  conversationId?: string | null;
  document: ResumeDocument;
  prompt: string;
  resumeId: string;
  selectedModuleId?: string | null;
}) {
  return invokeEdgeFunction<ResumeChatResponse>("resume-chat", {
    conversation_id: input.conversationId ?? null,
    document: input.document,
    prompt: input.prompt,
    resume_id: input.resumeId,
    selected_module_id: input.selectedModuleId ?? null,
  });
}

export {
  applyResumeToProfile,
  completeOnboardingWithResume,
  deleteResume,
  generateResumeChatPatch,
  generateTargetJobResume,
  getLatestTargetJobResume,
  getResume,
  listResumes,
  renameResume,
  ResumeFunctionError,
  saveResumeContent,
  uploadResume,
};
