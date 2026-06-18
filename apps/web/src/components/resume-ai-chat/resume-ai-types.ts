import { createContext, useContext } from "react";
import type {
  ResumeChangeLogEntry,
  ResumePatch,
} from "@career-workbench/domain";

type ResumeAiComposerContext = {
  label: string;
  moduleId: string;
};

type ResumeAssistantMessagePart =
  | { type: "text"; text: string }
  | { type: "resume-module-context"; context: ResumeAiComposerContext }
  | { type: "resume-patch"; patch: ResumePatch };

type ResumeChatMessage = {
  createdAt: string;
  id: string;
  parts: ResumeAssistantMessagePart[];
  role: "user" | "assistant" | "system";
  status?: "failed" | "sent" | "sending";
};

type ResumeAiChatPanelProps = {
  changeLogs: ResumeChangeLogEntry[];
  composerContext: ResumeAiComposerContext | null;
  error: string | null;
  isRunning: boolean;
  messages: ResumeChatMessage[];
  onAcceptPatch: (patch: ResumePatch) => void;
  onClearComposerContext: () => void;
  onRejectPatch: (patch: ResumePatch) => void;
  onSendPrompt: (prompt: string) => void;
  pendingPatch: ResumePatch | null;
};

type ResumeAiPatchActions = {
  onAcceptPatch: (patch: ResumePatch) => void;
  onRejectPatch: (patch: ResumePatch) => void;
};

const ResumeAiPatchActionsContext = createContext<ResumeAiPatchActions | null>(
  null,
);

function useResumeAiPatchActions() {
  const value = useContext(ResumeAiPatchActionsContext);

  if (!value) {
    throw new Error(
      "useResumeAiPatchActions must be used inside ResumeAiPatchActionsContext.",
    );
  }

  return value;
}

export { ResumeAiPatchActionsContext, useResumeAiPatchActions };
export type {
  ResumeAiChatPanelProps,
  ResumeAiComposerContext,
  ResumeAssistantMessagePart,
  ResumeChatMessage,
};
