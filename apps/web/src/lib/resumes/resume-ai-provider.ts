import type { ResumeDocument, ResumePatch } from "@career-workbench/domain";

import { EdgeFunctionError } from "@/lib/edge-functions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { generateResumeChatPatch } from "./api";
import { generateMockResumePatch } from "./resume-ai-mock-provider";

type ResumeAiInput = {
  conversationId?: string | null;
  document: ResumeDocument;
  prompt: string;
  resumeId: string;
  selectedModuleId: string | null;
};

type ResumeAiResult = {
  conversationId: string | null;
  message: string;
  patch: ResumePatch | null;
  provider: "dify" | "mock";
};

async function generateResumePatch(
  input: ResumeAiInput,
): Promise<ResumeAiResult> {
  if (!isSupabaseConfigured) {
    const result = await generateMockResumePatch(input);

    return {
      conversationId: null,
      message: result.message,
      patch: result.patch,
      provider: "mock",
    };
  }

  try {
    const result = await generateResumeChatPatch(input);

    return {
      conversationId: result.conversation_id,
      message: result.message,
      patch: result.patch,
      provider: result.provider,
    };
  } catch (error) {
    if (canUseMockFallback(error)) {
      const result = await generateMockResumePatch(input);

      return {
        conversationId: input.conversationId ?? null,
        message: `${result.message}（AI 助手暂时不可用，已生成一份可人工复核的修改建议。）`,
        patch: result.patch,
        provider: "mock",
      };
    }

    throw error;
  }
}

function canUseMockFallback(error: unknown) {
  if (!(error instanceof EdgeFunctionError)) {
    return false;
  }

  return /Missing DIFY_RESUME_CHAT_API_KEY|服务未连接/i.test(error.message);
}

export { generateResumePatch };
export type { ResumeAiInput, ResumeAiResult };
