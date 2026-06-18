"use client";

import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { Button } from "@heroui/react";
import { X } from "lucide-react";

import { ResumeAiMessage } from "./resume-ai-message";
import type { ResumeAiComposerContext } from "./resume-ai-types";

type ResumeAiThreadProps = {
  composerContext: ResumeAiComposerContext | null;
  onClearComposerContext: () => void;
  suggestions: readonly { label: string; prompt: string }[];
};

function ResumeAiThread({
  composerContext,
  onClearComposerContext,
  suggestions,
}: ResumeAiThreadProps) {
  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-1 flex-col">
      <ThreadPrimitive.Viewport
        autoScroll
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        <ThreadPrimitive.Empty>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs leading-5 text-slate-500">
            输入你希望 AI 修改的方向。AI 会生成可审阅
            patch，采纳前不会改简历数据。
          </div>
        </ThreadPrimitive.Empty>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <ThreadPrimitive.Suggestion
              key={suggestion.prompt}
              className=" cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              prompt={suggestion.prompt}
              send
              type="button"
            >
              {suggestion.label}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>

        <ThreadPrimitive.Messages>
          {({ message }) => <ResumeAiMessage role={message.role} />}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto bg-white pt-3">
          <ComposerPrimitive.Root className="relative rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            {composerContext ? (
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
                  <span className="min-w-0 truncate">
                    {composerContext.label}
                  </span>
                  <Button
                    aria-label="移除模块上下文"
                    className="size-5 min-w-0 rounded-md text-blue-700 hover:bg-blue-100"
                    isIconOnly
                    onPress={onClearComposerContext}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            ) : null}
            <ComposerPrimitive.Input
              className="min-h-[112px] w-full resize-none rounded-xl bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="例如：移除与该职位无关的技能，或者强化最近一段经历的结果表达"
              submitMode="enter"
            />
          </ComposerPrimitive.Root>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

export { ResumeAiThread };
