"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import {
  deriveResumePatchDiff,
  type ResumePatch,
} from "@career-workbench/domain";
import { Check, X } from "lucide-react";

type ResumePatchCardProps = {
  onAccept: () => void;
  onReject: () => void;
  patch: ResumePatch;
};

const patchStatusLabels: Record<ResumePatch["status"], string> = {
  accepted: "已采纳",
  pending: "待处理",
  rejected: "已拒绝",
};

function ResumePatchCard({ onAccept, onReject, patch }: ResumePatchCardProps) {
  const diffs = useMemo(() => deriveResumePatchDiff(patch), [patch]);
  const changedCount = diffs.reduce(
    (sum, item) => sum + item.fieldDiffs.length,
    0,
  );
  const isPending = patch.status === "pending";

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">
            {patch.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {patch.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-blue-600">
            {changedCount} 处变更
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {patchStatusLabels[patch.status]}
          </span>
        </div>
      </div>

      <PatchMeta title="依据" values={patch.evidenceRefs} />
      <PatchMeta title="风险" values={patch.riskNotes} />

      {isPending ? (
        <div className="mt-3 flex gap-2">
          <Button
            className="rounded-lg"
            onPress={onAccept}
            size="sm"
            type="button"
            variant="primary"
          >
            <Check className="size-4" />
            采纳
          </Button>
          <Button
            className="rounded-lg"
            onPress={onReject}
            size="sm"
            type="button"
            variant="outline"
          >
            <X className="size-4" />
            拒绝
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function PatchMeta({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-400">
        {title}
      </p>
      <ul className="mt-1 space-y-1 text-xs leading-5 text-slate-600">
        {values.map((value) => (
          <li key={value}>- {value}</li>
        ))}
      </ul>
    </div>
  );
}

export { ResumePatchCard };
