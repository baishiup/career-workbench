"use client";

import { useMemo, useState } from "react";
import { Button, Chip, TextArea } from "@heroui/react";
import { AlertCircle, Bot, SendHorizontal, Sparkles, UserRound } from "lucide-react";
import { cjk } from "@streamdown/cjk";
import { Streamdown } from "streamdown";

import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import type { AiChatMessage } from "@/components/ai-chat/types";
import { cn } from "@/lib/utils";

const streamdownPlugins = { cjk };

type AiChatPanelProps = {
  isRunning: boolean;
  messages: AiChatMessage[];
  onSend: (input: string) => void;
  onTriggerFailure: (input: string) => void;
  quickPrompts: string[];
};

function AiChatPanel({
  isRunning,
  messages,
  onSend,
  onTriggerFailure,
  quickPrompts,
}: AiChatPanelProps) {
  const [draft, setDraft] = useState("");
  const trimmedDraft = draft.trim();
  const canSubmit = trimmedDraft.length > 0 && !isRunning;

  function submitMessage() {
    if (!canSubmit) {
      return;
    }

    onSend(trimmedDraft);
    setDraft("");
  }

  function submitFailureScenario() {
    const input =
      trimmedDraft.length > 0
        ? trimmedDraft
        : "模拟 Dify Chatflow 超时，检查失败态和可重试提示";

    if (isRunning) {
      return;
    }

    onTriggerFailure(input);
    setDraft("");
  }

  return (
    <section className={cn(panelClassName, "flex min-h-[720px] flex-col")}>
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bot aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                AI 对话调试
              </h2>
              <p className="text-sm text-slate-500">
                mock resume_chat，不调用真实 Dify。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip color="default" size="sm" variant="soft">
            provider: mock
          </Chip>
          <Chip color="accent" size="sm" variant="soft">
            resume_chat
          </Chip>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
              isDisabled={isRunning}
              key={prompt}
              onPress={() => setDraft(prompt)}
              type="button"
              variant="tertiary"
            >
              {prompt}
            </Button>
          ))}
        </div>

        <form
          className={cn(softPanelClassName, "flex flex-col gap-3 bg-white p-3")}
          onSubmit={(event) => {
            event.preventDefault();
            submitMessage();
          }}
        >
          <TextArea
            aria-label="输入 AI 修改要求"
            className="min-h-24 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-slate-500"
            fullWidth
            onChange={(event) => setDraft(event.target.value)}
            placeholder="例如：把 Summary 改得更贴近 Senior Frontend Engineer JD"
            rows={4}
            value={draft}
            variant="secondary"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              发送后会生成 mock AiRun、事件、AI 回复和待审阅 patch。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                isDisabled={isRunning}
                onPress={submitFailureScenario}
                type="button"
                variant="outline"
              >
                <AlertCircle data-icon="inline-start" />
                失败场景
              </Button>
              <Button isDisabled={!canSubmit} type="submit" variant="primary">
                {isRunning ? (
                  <Sparkles data-icon="inline-start" />
                ) : (
                  <SendHorizontal data-icon="inline-start" />
                )}
                {isRunning ? "生成中..." : "发送"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";
  const timeLabel = useMemo(
    () => formatTime(message.createdAt),
    [message.createdAt],
  );

  return (
    <article
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-blue-600">
          <Bot aria-hidden="true" className="size-4" />
        </span>
      ) : null}

      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-1 sm:max-w-[78%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm leading-6",
            isUser
              ? "bg-blue-600 text-white"
              : message.status === "failed"
                ? "border border-red-600/30 bg-red-600/5 text-slate-900"
                : "border border-slate-200 bg-white text-slate-900",
          )}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <Streamdown
              className="max-w-none text-sm leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              controls={false}
              mode="static"
              plugins={streamdownPlugins}
            >
              {message.content}
            </Streamdown>
          )}
        </div>
        <span className="text-xs text-slate-500">
          {isUser ? "你" : "AI"} / {timeLabel}
        </span>
      </div>

      {isUser ? (
        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
      ) : null}
    </article>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export { AiChatPanel };
