"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import type { ResumePatch } from "@career-workbench/domain";

import type {
  ResumeAiComposerContext,
  ResumeAssistantMessagePart,
  ResumeChatMessage,
} from "./resume-ai-types";

type RuntimeContentPart = Extract<
  ThreadMessageLike["content"],
  readonly unknown[]
>[number];

type ResumeAiRuntimeProviderProps = {
  children: ReactNode;
  isRunning: boolean;
  isSendDisabled: boolean;
  messages: ResumeChatMessage[];
  onSendPrompt: (prompt: string) => void;
};

function ResumeAiRuntimeProvider({
  children,
  isRunning,
  isSendDisabled,
  messages,
  onSendPrompt,
}: ResumeAiRuntimeProviderProps) {
  const runtime = useExternalStoreRuntime({
    convertMessage: convertResumeMessage,
    isRunning,
    isSendDisabled,
    messages,
    onNew: async (message) => {
      const text = getMessageText(message).trim();

      if (text) {
        onSendPrompt(text);
      }
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

function convertResumeMessage(message: ResumeChatMessage): ThreadMessageLike {
  const status =
    message.role === "assistant"
      ? message.status === "failed"
        ? ({
            error: "AI message failed",
            reason: "error",
            type: "incomplete",
          } as const)
        : ({ reason: "stop", type: "complete" } as const)
      : undefined;

  return {
    content: message.parts.map(convertResumeMessagePart),
    createdAt: new Date(message.createdAt),
    id: message.id,
    role: message.role,
    status,
  };
}

function convertResumeMessagePart(
  part: ResumeAssistantMessagePart,
): RuntimeContentPart {
  if (part.type === "text") {
    return { text: part.text, type: "text" };
  }

  if (part.type === "resume-module-context") {
    return {
      data: part.context,
      type: "data-resume-module-context",
    };
  }

  return {
    data: part.patch,
    type: "data-resume-patch",
  };
}

function getMessageText(message: AppendMessage) {
  return message.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n");
}

function isResumePatchData(value: unknown): value is ResumePatch {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "id" in value && "changes" in value && "original" in value;
}

function isResumeModuleContextData(
  value: unknown,
): value is ResumeAiComposerContext {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "moduleId" in value && "label" in value;
}

export {
  ResumeAiRuntimeProvider,
  isResumeModuleContextData,
  isResumePatchData,
};
