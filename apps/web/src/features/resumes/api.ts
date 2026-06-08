import { getSupabaseClient } from "@/lib/supabase";
import type { JobPreferences } from "@career-workbench/resume";
import type {
  ApplyResumeToProfileResponse,
  CompleteOnboardingWithResumeResponse,
  ResumeFunctionErrorDetails,
  UploadResumeResponse,
} from "@/features/resumes/types";

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
    throw new ResumeFunctionError(error.message, details);
  }

  if (!data) {
    throw new ResumeFunctionError(`${functionName} Edge Function 返回为空。`);
  }

  return data;
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
  ResumeFunctionError,
  uploadResume,
};
