"use client";

import { useMemo, useState } from "react";
import { Chip } from "@heroui/react";
import type {
  ResumeChangeLog,
  ResumePatch,
  ResumePatchStatus,
} from "@career-workbench/resume";
import { Bot, GitBranch, MessageSquareText, WandSparkles } from "lucide-react";

import { AiChatPanel } from "@/features/ai-chat/components/ai-chat-panel";
import { AiTraceDebugPanel } from "@/features/ai-chat/components/ai-trace-debug-panel";
import { ChangeLogTimeline } from "@/features/ai-chat/components/change-log-timeline";
import { ResumePatchCard } from "@/features/ai-chat/components/resume-patch-card";
import {
  createFailedResumeChatRun,
  createPatchDecisionLog,
  createSuccessfulResumeChatRun,
  initialAiChatMessages,
  quickPrompts,
} from "@/features/ai-chat/mock-data";
import type {
  AiChatMessage,
  MockResumeChatResult,
  MockResumeChatRun,
} from "@/features/ai-chat/types";

function AiChatDemoPage() {
  const [messages, setMessages] = useState<AiChatMessage[]>(initialAiChatMessages);
  const [runs, setRuns] = useState<MockResumeChatRun[]>([]);
  const [patches, setPatches] = useState<ResumePatch[]>([]);
  const [changeLogs, setChangeLogs] = useState<ResumeChangeLog[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const activeRun = useMemo(
    () => runs.find((run) => run.runId === activeRunId) ?? runs[0] ?? null,
    [activeRunId, runs],
  );

  function runSuccess(input: string) {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    const result = createSuccessfulResumeChatRun(input);
    commitRunResult(result);
  }

  function runFailure(input: string) {
    if (isRunning) {
      return;
    }

    setIsRunning(true);
    const result = createFailedResumeChatRun(input);
    commitRunResult(result);
  }

  function commitRunResult(result: MockResumeChatResult) {
    setMessages((current) => [
      ...current,
      result.userMessage,
      result.assistantMessage,
    ]);
    setRuns((current) => [result.run, ...current]);
    setActiveRunId(result.run.runId);

    const patch = result.patch;
    const changeLog = result.changeLog;

    if (patch) {
      setPatches((current) => [patch, ...current]);
    }

    if (changeLog) {
      setChangeLogs((current) => [changeLog, ...current]);
    }

    window.setTimeout(() => setIsRunning(false), 220);
  }

  function decidePatch(
    patchId: string,
    status: Extract<ResumePatchStatus, "accepted" | "rejected">,
  ) {
    const patch = patches.find((item) => item.id === patchId);

    if (!patch || patch.status !== "pending") {
      return;
    }

    const decidedPatch: ResumePatch = {
      ...patch,
      decidedAt: new Date().toISOString(),
      status,
    };

    setPatches((current) =>
      current.map((item) => (item.id === patchId ? decidedPatch : item)),
    );
    setChangeLogs((current) => [
      createPatchDecisionLog({ patch: decidedPatch, status }),
      ...current,
    ]);
  }

  return (
    <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-5 lg:px-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <WandSparkles aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                AI 对话 Demo
              </h1>
              <p className="text-sm text-slate-500">
                本地 mock 调试 resume_chat、patch、修改日志和 Trace。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip color="default" size="sm" variant="soft">
            <Bot className="size-3.5" />
            mock provider
          </Chip>
          <Chip color="accent" size="sm" variant="soft">
            <MessageSquareText className="size-3.5" />
            {messages.length} messages
          </Chip>
          <Chip color="success" size="sm" variant="soft">
            <GitBranch className="size-3.5" />
            {runs.length} runs
          </Chip>
        </div>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
        <AiChatPanel
          isRunning={isRunning}
          messages={messages}
          onSend={runSuccess}
          onTriggerFailure={runFailure}
          quickPrompts={quickPrompts}
        />

        <aside className="flex min-w-0 flex-col gap-4">
          <ResumePatchCard onDecide={decidePatch} patches={patches} />
          <ChangeLogTimeline logs={changeLogs} />
          <AiTraceDebugPanel run={activeRun} />
        </aside>
      </div>
    </section>
  );
}

export { AiChatDemoPage };
