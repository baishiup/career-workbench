"use client";

import { Chip } from "@heroui/react";
import { AlertCircle, CheckCircle2, RadioTower, Workflow } from "lucide-react";

import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import type { AiRunEventDemo, MockResumeChatRun } from "@/features/ai-chat/types";
import { cn } from "@/lib/utils";

function AiTraceDebugPanel({ run }: { run: MockResumeChatRun | null }) {
  return (
    <section className={cn(panelClassName, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Trace 调试</h2>
          <p className="text-sm text-slate-500">
            开发调试模式展示完整 AiRun。
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-blue-600">
          <Workflow aria-hidden="true" className="size-5" />
        </span>
      </div>

      {!run ? (
        <div className={cn(softPanelClassName, "mt-4 p-3 text-sm text-slate-500")}>
          发送消息后，这里会显示 runId、provider、workflowKey 和事件序列。
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-2 text-sm">
            <MetaRow label="runId" value={run.runId} />
            <MetaRow label="taskType" value={run.taskType} />
            <MetaRow label="status" value={run.status} />
            <MetaRow label="orchestrator" value={run.orchestrator} />
            <MetaRow label="provider" value={run.provider} />
            <MetaRow label="workflowKey" value={run.workflowKey} />
            <MetaRow label="promptVersion" value={run.promptVersion} />
            {run.externalRef?.conversationId ? (
              <MetaRow
                label="conversationId"
                value={run.externalRef.conversationId}
              />
            ) : null}
            {run.externalRef?.workflowRunId ? (
              <MetaRow
                label="workflowRunId"
                value={run.externalRef.workflowRunId}
              />
            ) : null}
          </div>

          {run.errorSummary ? (
            <div className="rounded-lg border border-red-600/25 bg-red-600/5 p-3 text-sm leading-6 text-red-600">
              {run.errorSummary}
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">事件时间线</p>
              <Chip color="default" size="sm" variant="soft">
                {run.events.length}
              </Chip>
            </div>
            <div className="flex flex-col gap-2">
              {run.events.map((event) => (
                <TraceEventRow event={event} key={event.eventId} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TraceEventRow({ event }: { event: AiRunEventDemo }) {
  const isFailed = event.eventType === "run.failed";
  const isCompleted = event.eventType === "run.completed";

  return (
    <article className={cn(softPanelClassName, "bg-white p-3")}>
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
            isFailed
              ? "bg-red-600/10 text-red-600"
              : isCompleted
                ? "bg-emerald-600/10 text-emerald-600"
                : "bg-sky-100 text-blue-600",
          )}
        >
          {isFailed ? (
            <AlertCircle aria-hidden="true" className="size-4" />
          ) : isCompleted ? (
            <CheckCircle2 aria-hidden="true" className="size-4" />
          ) : (
            <RadioTower aria-hidden="true" className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{event.title}</p>
            <Chip color="default" size="sm" variant="soft">
              #{event.sequence}
            </Chip>
          </div>
          <p className="mt-1 text-xs font-medium text-blue-600">
            {event.eventType}
            {event.stepKey ? ` / ${event.stepKey}` : ""}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {event.summary}
          </p>
        </div>
      </div>
    </article>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 rounded-lg border border-slate-200 bg-slate-100/35 px-3 py-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="min-w-0 break-words font-mono text-xs text-slate-900">
        {value}
      </span>
    </div>
  );
}

export { AiTraceDebugPanel };
