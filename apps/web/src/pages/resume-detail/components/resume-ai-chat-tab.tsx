"use client";

import { useState } from "react";

import { AiChatPanel } from "@/components/ai-chat/ai-chat-panel";
import {
  createFailedResumeChatRun,
  createSuccessfulResumeChatRun,
  initialAiChatMessages,
  quickPrompts,
} from "@/components/ai-chat/mock-data";
import type { AiChatMessage } from "@/components/ai-chat/types";

function ResumeAiChatTab() {
  const [messages, setMessages] = useState<AiChatMessage[]>(
    initialAiChatMessages,
  );
  const [isRunning, setIsRunning] = useState(false);

  function runSuccess(input: string) {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    const result = createSuccessfulResumeChatRun(input);
    setMessages((current) => [
      ...current,
      result.userMessage,
      result.assistantMessage,
    ]);
    window.setTimeout(() => setIsRunning(false), 220);
  }

  function runFailure(input: string) {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    const result = createFailedResumeChatRun(input);
    setMessages((current) => [
      ...current,
      result.userMessage,
      result.assistantMessage,
    ]);
    window.setTimeout(() => setIsRunning(false), 220);
  }

  return (
    <AiChatPanel
      isRunning={isRunning}
      messages={messages}
      onSend={runSuccess}
      onTriggerFailure={runFailure}
      quickPrompts={quickPrompts}
    />
  );
}

export { ResumeAiChatTab };
