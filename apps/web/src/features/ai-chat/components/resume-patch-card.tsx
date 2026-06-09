"use client";

import { Button, Chip } from "@heroui/react";
import type { ResumePatch, ResumePatchStatus } from "@career-workbench/resume";
import { CheckCircle2, FilePenLine, ShieldAlert, XCircle } from "lucide-react";

import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";

type ResumePatchCardProps = {
  onDecide: (
    patchId: string,
    status: Extract<ResumePatchStatus, "accepted" | "rejected">,
  ) => void;
  patches: ResumePatch[];
};

function ResumePatchCard({ onDecide, patches }: ResumePatchCardProps) {
  return (
    <section className={cn(panelClassName, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Pending patch
          </h2>
          <p className="text-sm text-slate-500">
            AI 只能给建议，采纳后才修改业务对象。
          </p>
        </div>
        <Chip color="default" size="sm" variant="soft">
          {patches.length}
        </Chip>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {patches.length === 0 ? (
          <div className={cn(softPanelClassName, "p-3 text-sm text-slate-500")}>
            还没有 patch。发送一条修改要求后，这里会出现待审阅建议。
          </div>
        ) : null}

        {patches.map((patch) => (
          <PatchItem key={patch.id} onDecide={onDecide} patch={patch} />
        ))}
      </div>
    </section>
  );
}

function PatchItem({
  onDecide,
  patch,
}: {
  onDecide: ResumePatchCardProps["onDecide"];
  patch: ResumePatch;
}) {
  const isPending = patch.status === "pending";

  return (
    <article className={cn(softPanelClassName, "bg-white p-3")}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-blue-600">
          <FilePenLine aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{patch.summary}</p>
            <PatchStatusChip status={patch.status} />
          </div>

          <div className="mt-3 grid gap-3">
            {patch.changes.map((change, index) => (
              <div className="grid gap-2 text-sm" key={`${patch.id}-${index}`}>
                <p className="text-xs font-medium uppercase text-slate-500">
                  {change.operation} / {getChangeTargetLabel(change)}
                </p>
                {"beforeText" in change && change.beforeText ? (
                  <TextBlock label="Before" value={change.beforeText} />
                ) : null}
                {"nextText" in change ? (
                  <TextBlock label="After" value={change.nextText} />
                ) : null}
              </div>
            ))}
          </div>

          {patch.riskNotes.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldAlert aria-hidden="true" className="size-4 text-amber-600" />
                风险提示
              </div>
              <ul className="mt-2 space-y-1 text-sm leading-5 text-slate-500">
                {patch.riskNotes.map((note) => (
                  <li className="flex gap-2" key={note}>
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              confidence: {Math.round((patch.confidence ?? 0) * 100)}%
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                isDisabled={!isPending}
                onPress={() => onDecide(patch.id, "rejected")}
                type="button"
                variant="outline"
              >
                <XCircle data-icon="inline-start" />
                拒绝
              </Button>
              <Button
                isDisabled={!isPending}
                onPress={() => onDecide(patch.id, "accepted")}
                type="button"
                variant="primary"
              >
                <CheckCircle2 data-icon="inline-start" />
                采纳
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function getChangeTargetLabel(change: ResumePatch["changes"][number]) {
  if ("target" in change) {
    return change.target.sectionId ?? "section";
  }

  if ("sectionOrder" in change) {
    return "section order";
  }

  return "style";
}

function PatchStatusChip({ status }: { status: ResumePatchStatus }) {
  const meta: Record<
    ResumePatchStatus,
    { color: "danger" | "default" | "success" | "warning"; label: string }
  > = {
    accepted: { color: "success", label: "已采纳" },
    pending: { color: "warning", label: "待审阅" },
    rejected: { color: "danger", label: "已拒绝" },
    superseded: { color: "default", label: "已替换" },
  };

  return (
    <Chip color={meta[status].color} size="sm" variant="soft">
      {meta[status].label}
    </Chip>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100/40 p-3">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm leading-6">{value}</p>
    </div>
  );
}

export { ResumePatchCard };
