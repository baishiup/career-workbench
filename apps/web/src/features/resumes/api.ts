import { getSupabaseClient } from "@/lib/supabase";
import type {
  ParseResumeErrorDetails,
  ParseResumeResponse,
} from "@/features/resumes/types";

export class ParseResumeError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, options: ParseResumeErrorDetails = {}) {
    super(message);
    this.name = "ParseResumeError";
    this.status = options.status;
    this.details = options.details;
  }
}

export async function parseResume(file: File) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new ParseResumeError(
      "Supabase 未配置，无法调用 parse-resume Edge Function。",
    );
  }

  const formData = new FormData();
  formData.append("resume_file", file);

  const { data, error } = await supabase.functions.invoke<ParseResumeResponse>(
    "parse-resume",
    {
      body: formData,
    },
  );

  if (error) {
    const details = await readFunctionErrorDetails(error);
    throw new ParseResumeError(error.message, details);
  }

  if (!data) {
    throw new ParseResumeError("parse-resume Edge Function 返回为空。");
  }

  return data;
}

async function readFunctionErrorDetails(
  error: unknown,
): Promise<ParseResumeErrorDetails> {
  const context = (error as { context?: unknown }).context;

  if (!(context instanceof Response)) {
    return {};
  }

  return {
    status: context.status,
    details: await readResponseBody(context),
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
