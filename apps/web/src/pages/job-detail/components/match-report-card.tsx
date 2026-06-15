/**
 * 职位详情页的「匹配分析」卡片。
 *
 * 状态机：加载中 → 无报告（运行分析）/ 已有报告（未过期直接展示，
 * 过期提示重新分析）/ 失败（保留错误并可重试）。匹配度数字在页面顶部
 * 面板展示，这里聚焦命中证据、能力缺口和风险表达等叙事。
 */

import { Button, Card, Chip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";

import type { UseMatchReportResult } from "../use-match-report";

type MatchReportCardProps = {
  matchReport: UseMatchReportResult;
  /** 是否具备运行分析的条件（有可计分的 Profile）。 */
  canRun: boolean;
  onRun: () => void;
};

export function MatchReportCard({
  matchReport,
  canRun,
  onRun,
}: MatchReportCardProps) {
  const { report, isStale, isLoading, isRunning, loadError, runError } =
    matchReport;

  return (
    <Card className={panelClassName}>
      <Card.Header>
        <Card.Title>匹配分析</Card.Title>
        <Card.Description>{describeReport()}</Card.Description>
        {report?.status === "succeeded" && report.updatedAt ? (
          <div className="ml-auto">
            <Chip color="accent" size="sm" variant="soft">
              {formatTimestamp(report.updatedAt)}
            </Chip>
          </div>
        ) : null}
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {renderBody()}
      </Card.Content>
    </Card>
  );

  function describeReport() {
    if (isLoading) {
      return "正在读取已有分析…";
    }

    if (isRunning) {
      return "AI 正在分析…";
    }

    if (report?.status === "succeeded") {
      return report.externalRunId
        ? `Dify · ${report.externalRunId}`
        : "AI 叙事分析";
    }

    if (report?.status === "failed") {
      return "上次分析失败";
    }

    return "尚未运行 AI 分析";
  }

  function renderBody() {
    if (isLoading || isRunning) {
      return (
        <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {isRunning ? "AI 正在生成叙事分析，通常需要十几秒…" : "正在加载…"}
        </div>
      );
    }

    if (loadError) {
      return (
        <RetryBlock
          description={loadError}
          label="重新加载"
          onPress={() => void matchReport.reload()}
        />
      );
    }

    if (!report || report.status === "pending") {
      return (
        <EmptyState
          canRun={canRun}
          description={
            report?.status === "pending"
              ? "上次分析未完成，可以重新运行。"
              : "运行 AI 分析后，这里会展示命中证据、能力缺口和风险表达，匹配度数字显示在上方面板。"
          }
          onRun={onRun}
          runError={runError}
        />
      );
    }

    if (report.status === "failed" || !report.narrative) {
      return (
        <RetryBlock
          description={
            runError ?? report.errorMessage ?? "分析结果不可用，可以重试。"
          }
          isDisabled={!canRun}
          label="重试分析"
          onPress={onRun}
        />
      );
    }

    return (
      <>
        {isStale ? (
          <div className={cn(softPanelClassName, "flex flex-col gap-2 p-3")}>
            <p className="text-sm font-medium text-amber-700">
              Profile 或职位已更新
            </p>
            <p className="text-sm leading-5 text-slate-500">
              以下是更新前生成的分析，建议重新分析以反映最新内容。
            </p>
            <Button
              className="w-fit"
              isDisabled={!canRun}
              onPress={onRun}
              size="sm"
              type="button"
              variant="primary"
            >
              <RefreshCw data-icon="inline-start" />
              重新分析
            </Button>
          </div>
        ) : null}
        {runError ? <p className="text-sm text-red-600">{runError}</p> : null}
        <p className="text-sm leading-6 text-slate-500">
          {report.narrative.aiNote}
        </p>
        <div className="h-px bg-border" />
        <NarrativeSection
          icon={BadgeCheck}
          items={report.narrative.evidence}
          title="命中证据"
          tone="success"
        />
        <NarrativeSection
          icon={ShieldAlert}
          items={report.narrative.gaps}
          title="能力缺口"
          tone="warning"
        />
        <NarrativeSection
          icon={ShieldAlert}
          items={report.narrative.risks}
          title="风险表达"
          tone="muted"
        />
      </>
    );
  }
}

function EmptyState({
  canRun,
  description,
  onRun,
  runError,
}: {
  canRun: boolean;
  description: string;
  onRun: () => void;
  runError: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-6 text-slate-500">{description}</p>
      {runError ? <p className="text-sm text-red-600">{runError}</p> : null}
      {canRun ? (
        <Button fullWidth onPress={onRun} type="button" variant="primary">
          <PlayCircle data-icon="inline-start" />
          运行分析
        </Button>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles aria-hidden="true" className="size-4" />
          完善 Profile 的技能或工作经历后即可运行分析。
        </p>
      )}
    </div>
  );
}

function RetryBlock({
  description,
  isDisabled,
  label,
  onPress,
}: {
  description: string;
  isDisabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-6 text-red-600">{description}</p>
      <Button
        className="w-fit"
        isDisabled={isDisabled}
        onPress={onPress}
        size="sm"
        type="button"
        variant="outline"
      >
        <RefreshCw data-icon="inline-start" />
        {label}
      </Button>
    </div>
  );
}

function NarrativeSection({
  icon: Icon,
  items,
  title,
  tone,
}: {
  icon: LucideIcon;
  items: string[];
  title: string;
  tone: "success" | "warning" | "muted";
}) {
  if (items.length === 0) {
    return null;
  }

  const iconClassName =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : "text-slate-500";

  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className={cn("size-4", iconClassName)} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <ul className="mt-2 space-y-2 text-sm leading-5 text-slate-500">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 size-1 shrink-0 rounded-full bg-border" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTimestamp(value: string) {
  const time = Date.parse(value);

  if (!Number.isFinite(time)) {
    return value;
  }

  const date = new Date(time);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
