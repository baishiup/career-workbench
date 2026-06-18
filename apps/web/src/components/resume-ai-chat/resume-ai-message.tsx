"use client";

import {
  MessagePartPrimitive,
  MessagePrimitive,
  type EnrichedPartState,
} from "@assistant-ui/react";

import { cn } from "@/lib/utils";

import {
  isResumeModuleContextData,
  isResumePatchData,
} from "./resume-ai-runtime-provider";
import { ResumePatchMessagePart } from "./resume-patch-message-part";

type ResumeAiMessageProps = {
  role: "assistant" | "system" | "user";
};

function ResumeAiMessage({ role }: ResumeAiMessageProps) {
  return (
    <MessagePrimitive.Root
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-xl px-3 py-2.5 text-sm leading-6",
          role === "user"
            ? "bg-blue-600 text-white"
            : "border border-slate-200 bg-white text-slate-700",
        )}
      >
        <MessagePrimitive.Parts>
          {({ part }) => <ResumeAiMessagePart part={part} />}
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

function ResumeAiMessagePart({ part }: { part: EnrichedPartState }) {
  if (part.type === "text") {
    return (
      <p className="whitespace-pre-wrap">
        <MessagePartPrimitive.Text />
      </p>
    );
  }

  if (
    part.type === "data" &&
    part.name === "resume-module-context" &&
    isResumeModuleContextData(part.data)
  ) {
    return (
      <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-2 py-1 text-xs text-white/90">
        <span className="min-w-0 truncate">{part.data.label}</span>
      </div>
    );
  }

  if (
    part.type === "data" &&
    part.name === "resume-patch" &&
    isResumePatchData(part.data)
  ) {
    return (
      <div className="mt-2">
        <ResumePatchMessagePart patch={part.data} />
      </div>
    );
  }

  return null;
}

export { ResumeAiMessage };
