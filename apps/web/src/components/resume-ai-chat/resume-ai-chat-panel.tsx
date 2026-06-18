"use client";

import { Alert, Badge, Button, Popover } from "@heroui/react";
import { type ResumeChangeLogEntry } from "@career-workbench/domain";
import { RotateCcw } from "lucide-react";

import { ResumeAiRuntimeProvider } from "./resume-ai-runtime-provider";
import {
  ResumeAiPatchActionsContext,
  type ResumeAiChatPanelProps,
} from "./resume-ai-types";
import { ResumeAiThread } from "./resume-ai-thread";

const quickPrompts = [
  { label: "移除与该职位无关的技能", prompt: "移除与该职位无关的技能" },
  {
    label: "强化最近一段经历的动作动词",
    prompt: "强化最近一段经历的动作动词",
  },
  { label: "压缩表达，保留关键信息", prompt: "压缩表达，保留关键信息" },
  {
    label: "降低夸张风险，保持事实边界",
    prompt: "降低夸张风险，保持事实边界",
  },
];

function ResumeAiChatPanel({
  changeLogs,
  composerContext,
  error,
  isRunning,
  messages,
  onAcceptPatch,
  onClearComposerContext,
  onRejectPatch,
  onSendPrompt,
  pendingPatch,
}: ResumeAiChatPanelProps) {
  const isSendDisabled = isRunning || Boolean(pendingPatch);

  return (
    <ResumeAiPatchActionsContext.Provider
      value={{ onAcceptPatch, onRejectPatch }}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        {error ? (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Title>AI 生成失败</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <ResumeAiRuntimeProvider
          isRunning={isRunning}
          isSendDisabled={isSendDisabled}
          messages={messages}
          onSendPrompt={onSendPrompt}
        >
          <ResumeAiThread
            composerContext={composerContext}
            onClearComposerContext={onClearComposerContext}
            suggestions={quickPrompts}
          />
        </ResumeAiRuntimeProvider>

        {changeLogs.length > 0 ? (
          <ChangeLogFloatingButton changeLogs={changeLogs} />
        ) : null}
      </div>
    </ResumeAiPatchActionsContext.Provider>
  );
}

function ChangeLogFloatingButton({
  changeLogs,
}: {
  changeLogs: ResumeChangeLogEntry[];
}) {
  return (
    <div className="fixed bottom-24 right-7 z-50">
      <Popover>
        <Button
          aria-label="查看修改日志"
          className="h-10 rounded-full bg-white px-3 shadow-lg shadow-slate-950/10"
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw className="size-4" />
          日志
          <Badge color="accent" size="sm">
            {changeLogs.length}
          </Badge>
        </Button>

        <Popover.Content
          className="w-[360px] overflow-hidden p-0"
          placement="top end"
        >
          <Popover.Dialog data-testid="resume-ai-change-log-popover">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <RotateCcw className="size-4 text-slate-400" />
              <Popover.Heading className="text-sm font-semibold text-slate-900">
                修改日志
              </Popover.Heading>
            </div>
            <div className="max-h-[300px] space-y-2 overflow-y-auto p-3">
              {changeLogs.map((entry) => (
                <div
                  className="rounded-lg bg-slate-50 px-3 py-2"
                  key={entry.id}
                >
                  <p className="text-xs font-semibold text-slate-800">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </div>
  );
}

export { ResumeAiChatPanel };
