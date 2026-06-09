"use client";

import { Chip } from "@heroui/react";
import type { ResumeChangeLog } from "@career-workbench/resume";
import { CheckCircle2, Clock3, FileClock, XCircle } from "lucide-react";

import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";

function ChangeLogTimeline({ logs }: { logs: ResumeChangeLog[] }) {
  return (
    <section className={cn(panelClassName, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">修改日志</h2>
          <p className="text-sm text-slate-500">
            普通用户看到业务化时间线。
          </p>
        </div>
        <Chip color="default" size="sm" variant="soft">
          {logs.length}
        </Chip>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className={cn(softPanelClassName, "p-3 text-sm text-slate-500")}>
            还没有日志。AI 生成建议、采纳或拒绝都会写入这里。
          </div>
        ) : null}

        {logs.map((log) => (
          <article className="flex gap-3" key={log.id}>
            <span
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                log.changeType === "user_accepted_patch"
                  ? "bg-emerald-600/10 text-emerald-600"
                  : log.changeType === "user_rejected_patch"
                    ? "bg-red-600/10 text-red-600"
                    : "bg-sky-100 text-blue-600",
              )}
            >
              <LogIcon changeType={log.changeType} />
            </span>
            <div className="min-w-0 flex-1 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">
                  {changeTypeLabel(log.changeType)}
                </p>
                <Chip color="default" size="sm" variant="soft">
                  {log.actor}
                </Chip>
                {log.sectionId ? (
                  <Chip color="accent" size="sm" variant="soft">
                    {log.sectionId}
                  </Chip>
                ) : null}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {log.afterSummary ?? log.beforeSummary ?? "修改日志已记录。"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LogIcon({ changeType }: { changeType: ResumeChangeLog["changeType"] }) {
  if (changeType === "user_accepted_patch") {
    return <CheckCircle2 aria-hidden="true" className="size-4" />;
  }

  if (changeType === "user_rejected_patch") {
    return <XCircle aria-hidden="true" className="size-4" />;
  }

  if (changeType === "ai_suggested_patch") {
    return <FileClock aria-hidden="true" className="size-4" />;
  }

  return <Clock3 aria-hidden="true" className="size-4" />;
}

function changeTypeLabel(changeType: ResumeChangeLog["changeType"]) {
  const labels: Record<ResumeChangeLog["changeType"], string> = {
    ai_generated_initial: "AI 生成初版",
    ai_suggested_patch: "AI 修改建议",
    user_accepted_patch: "用户采纳建议",
    user_changed_style: "用户修改样式",
    user_exported_resume: "用户导出简历",
    user_manual_edit: "用户手动编辑",
    user_rejected_patch: "用户拒绝建议",
    user_reordered_section: "用户拖拽排序",
  };

  return labels[changeType];
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export { ChangeLogTimeline };
