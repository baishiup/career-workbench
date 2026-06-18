import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { panelClassName } from "@/components/workbench/surface-classes";
import type { JobRecord } from "@/lib/jobs/types";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { cn } from "@/lib/utils";

import type { UseMatchReportResult } from "../use-match-report";

function JobActionPanel({
  canGenerateResume,
  canRunAnalysis,
  generateError,
  isGeneratingResume,
  isLoadingProfile,
  isLoadingTargetResume,
  job,
  matchReport,
  matchScore,
  onGenerateResume,
  onOpenProfile,
  onOpenResume,
  onRunAnalysis,
  targetResume,
  targetResumeError,
}: {
  canGenerateResume: boolean;
  canRunAnalysis: boolean;
  generateError: string | null;
  isGeneratingResume: boolean;
  isLoadingProfile: boolean;
  isLoadingTargetResume: boolean;
  job: JobRecord;
  matchReport: UseMatchReportResult;
  matchScore: number | null;
  onGenerateResume: () => void;
  onOpenProfile: () => void;
  onOpenResume: () => void;
  onRunAnalysis: () => void;
  targetResume: ResumeFunctionRow | null;
  targetResumeError: string | null;
}) {
  const hasTargetResume = Boolean(targetResume);
  const [isGeneratedAnalysisOpen, setIsGeneratedAnalysisOpen] = useState(false);

  return (
    <div className={cn(panelClassName, "overflow-hidden rounded-[14px]")}>
      <ActionPanelAnimationStyles />
      {hasTargetResume ? (
        <>
          <CollapsedAnalysis
            isExpanded={isGeneratedAnalysisOpen}
            matchReport={matchReport}
            matchScore={matchScore}
            onToggleExpanded={() =>
              setIsGeneratedAnalysisOpen((isOpen) => !isOpen)
            }
          />
          {isGeneratedAnalysisOpen ? (
            <CollapsedAnalysisDetails
              canRunAnalysis={canRunAnalysis}
              matchReport={matchReport}
              onRunAnalysis={onRunAnalysis}
            />
          ) : null}
          <GeneratedResumeSection
            canGenerateResume={canGenerateResume}
            generateError={generateError}
            isGeneratingResume={isGeneratingResume}
            job={job}
            onGenerateResume={onGenerateResume}
            onOpenResume={onOpenResume}
            targetResume={targetResume}
            targetResumeError={targetResumeError}
          />
        </>
      ) : hasUsableAnalysis(matchReport) ? (
        <>
          <AnalysisSummary
            canRunAnalysis={canRunAnalysis}
            matchReport={matchReport}
            matchScore={matchScore}
            onRunAnalysis={onRunAnalysis}
          />
          <ResumeCtaSection
            canGenerateResume={canGenerateResume}
            generateError={generateError}
            isGeneratingResume={isGeneratingResume}
            isLoadingTargetResume={isLoadingTargetResume}
            matchReport={matchReport}
            onGenerateResume={onGenerateResume}
            targetResumeError={targetResumeError}
          />
        </>
      ) : (
        <EmptyAnalysisSection
          canRunAnalysis={canRunAnalysis}
          isLoadingProfile={isLoadingProfile}
          matchReport={matchReport}
          onOpenProfile={onOpenProfile}
          onRunAnalysis={onRunAnalysis}
        />
      )}
    </div>
  );
}

function EmptyAnalysisSection({
  canRunAnalysis,
  isLoadingProfile,
  matchReport,
  onOpenProfile,
  onRunAnalysis,
}: {
  canRunAnalysis: boolean;
  isLoadingProfile: boolean;
  matchReport: UseMatchReportResult;
  onOpenProfile: () => void;
  onRunAnalysis: () => void;
}) {
  const [isLocalStarting, setIsLocalStarting] = useState(false);
  const startTimerRef = useRef<number | null>(null);
  const hasFailedReport = matchReport.report?.status === "failed";
  const isRunningAnalysis = matchReport.isRunning || isLocalStarting;
  const isBusy = matchReport.isLoading || isRunningAnalysis;

  useEffect(() => {
    return () => {
      if (startTimerRef.current !== null) {
        window.clearTimeout(startTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (matchReport.isRunning && startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
      return;
    }

    if (!matchReport.isRunning && isLocalStarting) {
      startTimerRef.current = window.setTimeout(() => {
        setIsLocalStarting(false);
        startTimerRef.current = null;
      }, 1400);
    }
  }, [isLocalStarting, matchReport.isRunning]);

  const handleRunAnalysis = () => {
    if (canRunAnalysis) {
      setIsLocalStarting(true);
    }

    onRunAnalysis();
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1e1b4b_100%)] px-5 pb-6 pt-7 text-center",
        isRunningAnalysis
          ? "cw-job-analysis-running ring-1 ring-indigo-300/25"
          : "",
      )}
    >
      <div className="pointer-events-none absolute left-1/2 top-[-40px] size-[260px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.25)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-[-20px] right-[-20px] size-[140px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18)_0%,transparent_70%)]" />
      {isRunningAnalysis ? (
        <>
          <div className="cw-job-scan-beam pointer-events-none absolute inset-y-0 left-[-45%] w-[55%]" />
          <div className="pointer-events-none absolute inset-x-5 top-4 h-px bg-[linear-gradient(90deg,transparent,rgba(129,140,248,0.65),transparent)]" />
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="cw-job-float-dot left-[18%] top-[20%] size-[5px] bg-indigo-400" />
        <span className="cw-job-float-dot left-[72%] top-[30%] size-1 bg-blue-400 [animation-delay:0.8s] [animation-duration:2.6s]" />
        <span className="cw-job-float-dot left-[40%] top-[65%] size-[3px] bg-indigo-300 [animation-delay:1.4s] [animation-duration:3.8s]" />
        <span className="cw-job-float-dot left-[82%] top-[55%] size-1 bg-indigo-400 [animation-delay:0.3s] [animation-duration:2.9s]" />
        <span className="cw-job-float-dot left-[10%] top-[60%] size-[3px] bg-blue-400 [animation-delay:1.9s] [animation-duration:3.4s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <EmptyScoreOrbit
          hasFailedReport={hasFailedReport}
          isBusy={isBusy}
          isRunningAnalysis={isRunningAnalysis}
        />

        <p className="mt-1 text-base font-extrabold tracking-normal text-white">
          {getEmptyAnalysisTitle({ isLoadingProfile, matchReport })}
        </p>
        <p className="mt-1.5 max-w-[310px] text-[13px] leading-6 text-white/55">
          {getEmptyAnalysisDescription({ canRunAnalysis, matchReport })}
        </p>

        {isRunningAnalysis ? <RunningAnalysisSteps /> : null}

        <div className="my-4 flex w-full flex-col gap-1.5">
          <SkeletonHint
            isRunning={isRunningAnalysis}
            tone="evidence"
            width="68%"
          />
          <SkeletonHint
            isRunning={isRunningAnalysis}
            tone="evidence"
            width="82%"
          />
          <SkeletonHint isRunning={isRunningAnalysis} tone="gap" width="55%" />
          <SkeletonHint isRunning={isRunningAnalysis} tone="risk" width="73%" />
        </div>

        {matchReport.loadError || matchReport.runError ? (
          <p className="mb-3 max-w-[310px] rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[13px] leading-5 text-rose-100">
            {matchReport.runError ?? matchReport.loadError}
          </p>
        ) : null}

        <PanelButton
          className="cw-job-run-analysis border-0 bg-[linear-gradient(135deg,#6366f1,#2563eb)] py-3 text-white shadow-[0_4px_18px_rgba(37,99,235,0.45)] hover:bg-[linear-gradient(135deg,#6366f1,#2563eb)]"
          disabled={
            isLoadingProfile || matchReport.isLoading || isRunningAnalysis
          }
          icon={isRunningAnalysis || matchReport.isLoading ? Loader2 : Play}
          isLoading={isRunningAnalysis || matchReport.isLoading}
          label={
            isRunningAnalysis
              ? "分析中…"
              : canRunAnalysis
                ? getRunAnalysisLabel(matchReport)
                : "去完善资料"
          }
          onClick={canRunAnalysis ? handleRunAnalysis : onOpenProfile}
          tone="primary"
        />
        <p className="mt-2.5 text-[11px] text-white/30">
          {isRunningAnalysis
            ? "正在生成匹配度、证据、缺口和风险提示"
            : canRunAnalysis
              ? "约 30 秒 · 生成证据与风险提示"
              : "完善资料后解锁"}
        </p>
      </div>
    </section>
  );
}

function AnalysisSummary({
  canRunAnalysis,
  matchReport,
  matchScore,
  onRunAnalysis,
}: {
  canRunAnalysis: boolean;
  matchReport: UseMatchReportResult;
  matchScore: number | null;
  onRunAnalysis: () => void;
}) {
  const report = matchReport.report;
  const narrative = report?.narrative;

  if (!narrative) {
    return null;
  }

  return (
    <section className="px-[18px] py-[18px]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <PanelHeading icon={Sparkles}>AI 匹配分析</PanelHeading>
          <MatchBadge score={matchScore} />
        </div>
        <GhostPanelButton
          disabled={!canRunAnalysis || matchReport.isRunning}
          icon={matchReport.isRunning ? Loader2 : RefreshCw}
          isLoading={matchReport.isRunning}
          label="重新分析"
          onClick={onRunAnalysis}
        />
      </div>

      {matchReport.isStale ? (
        <InlineNotice tone="warning">
          资料或职位已更新，建议重新分析后再生成简历。
        </InlineNotice>
      ) : null}

      <div className="mb-3.5 flex items-center gap-3.5 border-b border-slate-100 pb-3.5">
        <ScoreRing score={matchScore} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[13px] font-semibold text-slate-900">
            {getMatchTitle(matchScore)}
          </p>
          <p className="text-xs leading-5 text-slate-600">{narrative.aiNote}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {formatDateTime(report?.updatedAt ?? null)} · AI 分析
          </p>
        </div>
      </div>

      {matchReport.runError ? (
        <p className="mb-2 text-[13px] leading-5 text-red-600">
          {matchReport.runError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <NarrativeBlock
          icon={Check}
          items={narrative.evidence}
          title="命中证据"
          tone="evidence"
        />
        <NarrativeBlock
          icon={AlertTriangle}
          items={narrative.gaps}
          title="能力缺口"
          tone="gap"
        />
        <NarrativeBlock
          icon={AlertTriangle}
          items={narrative.risks}
          title="风险提示"
          tone="risk"
        />
      </div>
    </section>
  );
}

function CollapsedAnalysis({
  isExpanded,
  matchReport,
  matchScore,
  onToggleExpanded,
}: {
  isExpanded: boolean;
  matchReport: UseMatchReportResult;
  matchScore: number | null;
  onToggleExpanded: () => void;
}) {
  const narrative = matchReport.report?.narrative;
  const ToggleIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <section className="border-b border-slate-100 px-[18px] py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ScoreRing score={matchScore} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-bold text-slate-900">
                AI 匹配分析
              </span>
              <MatchBadge score={matchScore} />
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {formatDateTime(matchReport.report?.updatedAt ?? null) ||
                "报告已生成"}{" "}
              · 命中证据 {narrative?.evidence.length ?? 0} · 缺口{" "}
              {narrative?.gaps.length ?? 0} · 风险{" "}
              {narrative?.risks.length ?? 0}
            </p>
          </div>
        </div>
        <GhostPanelButton
          icon={ToggleIcon}
          label={isExpanded ? "收起" : "展开"}
          onClick={onToggleExpanded}
        />
      </div>
    </section>
  );
}

function CollapsedAnalysisDetails({
  canRunAnalysis,
  matchReport,
  onRunAnalysis,
}: {
  canRunAnalysis: boolean;
  matchReport: UseMatchReportResult;
  onRunAnalysis: () => void;
}) {
  const narrative = matchReport.report?.narrative;

  if (!narrative) {
    return null;
  }

  return (
    <section className="border-b border-slate-100 px-[18px] py-3.5">
      {matchReport.isStale ? (
        <InlineNotice tone="warning">
          资料或职位已更新，建议重新分析后再生成简历。
        </InlineNotice>
      ) : null}
      {matchReport.runError ? (
        <InlineNotice tone="danger">{matchReport.runError}</InlineNotice>
      ) : null}
      <div className="flex flex-col gap-2">
        <NarrativeBlock
          icon={Check}
          items={narrative.evidence}
          title="命中证据"
          tone="evidence"
        />
        <NarrativeBlock
          icon={AlertTriangle}
          items={narrative.gaps}
          title="能力缺口"
          tone="gap"
        />
        <NarrativeBlock
          icon={AlertTriangle}
          items={narrative.risks}
          title="风险提示"
          tone="risk"
        />
      </div>
      <GhostPanelButton
        className="mt-3 w-full"
        disabled={!canRunAnalysis || matchReport.isRunning}
        icon={matchReport.isRunning ? Loader2 : RefreshCw}
        isLoading={matchReport.isRunning}
        label="重新分析"
        onClick={onRunAnalysis}
      />
    </section>
  );
}

function ResumeCtaSection({
  canGenerateResume,
  generateError,
  isGeneratingResume,
  isLoadingTargetResume,
  matchReport,
  onGenerateResume,
  targetResumeError,
}: {
  canGenerateResume: boolean;
  generateError: string | null;
  isGeneratingResume: boolean;
  isLoadingTargetResume: boolean;
  matchReport: UseMatchReportResult;
  onGenerateResume: () => void;
  targetResumeError: string | null;
}) {
  const isBusy =
    isGeneratingResume || matchReport.isLoading || matchReport.isRunning;

  return (
    <section className="border-t border-slate-100 px-[18px] py-4">
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-blue-600 text-white">
          <FileText aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900">生成定制简历</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">
            基于匹配报告，把最相关的经历组织成针对该职位的简历草稿。建议可溯源，你保留编辑权。
          </p>
        </div>
      </div>

      {targetResumeError ? (
        <InlineNotice tone="danger">{targetResumeError}</InlineNotice>
      ) : null}
      {generateError ? (
        <InlineNotice tone="danger">{generateError}</InlineNotice>
      ) : null}
      {isLoadingTargetResume ? (
        <InlineNotice tone="neutral">正在检查是否已有定制简历…</InlineNotice>
      ) : null}

      <PanelButton
        disabled={!canGenerateResume || isBusy}
        icon={isGeneratingResume || isBusy ? Loader2 : Sparkles}
        isLoading={isGeneratingResume || isBusy}
        label={getGenerationActionLabel({
          canGenerateResume,
          hasTargetJobResume: false,
          isGeneratingResume,
          isLoadingReport: matchReport.isLoading,
          isRunningAnalysis: matchReport.isRunning,
          reportStatus: matchReport.report?.status ?? null,
          reportStale: matchReport.isStale,
        })}
        onClick={onGenerateResume}
        tone="primary"
      />
      <p className="mt-2 text-center text-[11px] text-slate-400">
        AI 叙事分析 · 建议可追溯
      </p>
    </section>
  );
}

function GeneratedResumeSection({
  canGenerateResume,
  generateError,
  isGeneratingResume,
  job,
  onGenerateResume,
  onOpenResume,
  targetResume,
  targetResumeError,
}: {
  canGenerateResume: boolean;
  generateError: string | null;
  isGeneratingResume: boolean;
  job: JobRecord;
  onGenerateResume: () => void;
  onOpenResume: () => void;
  targetResume: ResumeFunctionRow | null;
  targetResumeError: string | null;
}) {
  return (
    <section className="px-[18px] py-[18px]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <PanelHeading icon={FileText}>定制简历</PanelHeading>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
          已生成
        </span>
      </div>

      <TargetResumePreview job={job} targetResume={targetResume} />

      {targetResumeError ? (
        <InlineNotice tone="danger">{targetResumeError}</InlineNotice>
      ) : null}
      {generateError ? (
        <InlineNotice tone="danger">{generateError}</InlineNotice>
      ) : null}

      <PanelButton
        icon={Eye}
        label="查看并编辑简历"
        onClick={onOpenResume}
        tone="primary"
      />
      <PanelButton
        className="mt-2"
        disabled={!canGenerateResume || isGeneratingResume}
        icon={isGeneratingResume ? Loader2 : RefreshCw}
        isLoading={isGeneratingResume}
        label={isGeneratingResume ? "重新生成中…" : "重新生成"}
        onClick={onGenerateResume}
        tone="outline"
      />
      <p className="mt-2 text-center text-[11px] text-slate-400">
        AI 叙事分析 · 建议可追溯
      </p>
    </section>
  );
}

function TargetResumePreview({
  job,
  targetResume,
}: {
  job: JobRecord;
  targetResume: ResumeFunctionRow | null;
}) {
  return (
    <div className="mb-3.5 rounded-[10px] border border-slate-200 bg-slate-50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-slate-900">
            {targetResume?.title || `${job.company} · ${job.title}`}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {formatDateTime(targetResume?.updated_at ?? null)
              ? `最近更新 ${formatDateTime(targetResume?.updated_at ?? null)}`
              : "已关联当前职位"}
          </p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600">
          <FileText aria-hidden="true" className="size-4" />
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {["基于匹配报告生成", "证据已关联", "可编辑"].map((label) => (
          <span
            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
            key={label}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function NarrativeBlock({
  icon: Icon,
  items,
  title,
  tone,
}: {
  icon: LucideIcon;
  items: string[];
  title: string;
  tone: "evidence" | "gap" | "risk";
}) {
  if (items.length === 0) {
    return null;
  }

  const toneClassName = {
    evidence: {
      box: "border-emerald-200 bg-emerald-50 text-emerald-800",
      bullet: "bg-emerald-600",
      icon: "text-emerald-600",
    },
    gap: {
      box: "border-amber-200 bg-amber-50 text-amber-800",
      bullet: "bg-amber-600",
      icon: "text-amber-700",
    },
    risk: {
      box: "border-rose-200 bg-rose-50 text-rose-800",
      bullet: "bg-rose-600",
      icon: "text-rose-700",
    },
  }[tone];

  return (
    <div className={cn("rounded-[10px] border px-3 py-2.5", toneClassName.box)}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon aria-hidden="true" className={cn("size-3", toneClassName.icon)} />
        <span className="text-[11px] font-bold uppercase tracking-[0.04em]">
          {title} · {items.length} 条
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li className="flex gap-1.5 text-xs leading-5" key={item}>
            <span
              className={cn(
                "mt-[8px] size-[3px] shrink-0 rounded-full",
                toneClassName.bullet,
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelHeading({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon aria-hidden="true" className="size-3.5 text-blue-600" />
      <span className="text-[13px] font-bold text-slate-900">{children}</span>
    </div>
  );
}

function MatchBadge({ score }: { score: number | null }) {
  return (
    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
      {getMatchLabel(score)}
    </span>
  );
}

function ScoreRing({
  score,
  size,
}: {
  score: number | null;
  size: "lg" | "sm";
}) {
  const dimension = size === "lg" ? 64 : 40;
  const radius = size === "lg" ? 30 : 20;
  const strokeWidth = size === "lg" ? 6 : 4;
  const center = dimension / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, Math.min(score ?? 0, 100));
  const dash = `${(circumference * normalized) / 100} ${circumference}`;

  return (
    <div
      className="relative shrink-0"
      style={{ height: dimension, width: dimension }}
    >
      <svg
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        width={dimension}
      >
        <circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke="#dcfce7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke="#16a34a"
          strokeDasharray={dash}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "font-extrabold text-emerald-600",
            size === "lg" ? "text-base" : "text-[11px]",
          )}
        >
          {score === null ? "—" : `${score}%`}
        </span>
      </div>
    </div>
  );
}

function PanelButton({
  className,
  disabled,
  icon: Icon,
  isLoading,
  label,
  onClick,
  tone,
}: {
  className?: string;
  disabled?: boolean;
  icon: LucideIcon;
  isLoading?: boolean;
  label: string;
  onClick: () => void;
  tone: "primary" | "outline";
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2.5 text-sm font-bold transition",
        tone === "primary"
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
        disabled ? "cursor-not-allowed opacity-55 hover:bg-blue-600" : "",
        tone === "outline" && disabled ? "hover:bg-white" : "",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-4", isLoading ? "animate-spin" : "")}
      />
      {label}
    </button>
  );
}

function GhostPanelButton({
  className,
  disabled,
  icon: Icon,
  isLoading,
  label,
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  icon: LucideIcon;
  isLoading?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3", isLoading ? "animate-spin" : "")}
      />
      {label}
    </button>
  );
}

function EmptyScoreOrbit({
  hasFailedReport,
  isBusy,
  isRunningAnalysis,
}: {
  hasFailedReport: boolean;
  isBusy: boolean;
  isRunningAnalysis: boolean;
}) {
  return (
    <div className="relative mb-4 size-[110px]">
      <div
        className={cn(
          "cw-job-pulse-ring absolute inset-[-8px] rounded-full border-2 border-indigo-400/30",
          isRunningAnalysis ? "border-blue-300/45" : "",
        )}
      />
      <div
        className={cn(
          "cw-job-pulse-ring absolute inset-[-16px] rounded-full border border-indigo-400/15 [animation-delay:0.4s]",
          isRunningAnalysis ? "border-blue-200/25" : "",
        )}
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0"
        height="110"
        viewBox="0 0 110 110"
        width="110"
      >
        <circle
          cx="55"
          cy="55"
          fill="none"
          r="46"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="7"
        />
        <circle
          className="cw-job-dash-orbit"
          cx="55"
          cy="55"
          fill="none"
          r="46"
          stroke="#6366f1"
          strokeDasharray="60 230"
          strokeLinecap="round"
          strokeWidth="7"
          transform="rotate(-90 55 55)"
        />
        <circle
          className="cw-job-dash-orbit cw-job-dash-orbit-reverse"
          cx="55"
          cy="55"
          fill="none"
          opacity="0.5"
          r="46"
          stroke="#818cf8"
          strokeDasharray="20 270"
          strokeLinecap="round"
          strokeWidth="4"
          transform="rotate(90 55 55)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {isRunningAnalysis ? (
          <div className="flex flex-col items-center">
            <Sparkles aria-hidden="true" className="size-6 text-indigo-100" />
            <span className="mt-1 flex items-center gap-1">
              <span className="cw-job-processing-dot [animation-delay:0ms]" />
              <span className="cw-job-processing-dot [animation-delay:180ms]" />
              <span className="cw-job-processing-dot [animation-delay:360ms]" />
            </span>
          </div>
        ) : isBusy ? (
          <Loader2
            aria-hidden="true"
            className="size-7 animate-spin text-white/60"
          />
        ) : hasFailedReport ? (
          <AlertTriangle
            aria-hidden="true"
            className="size-7 text-rose-200/70"
          />
        ) : (
          <span className="text-[28px] font-extrabold leading-none tracking-normal text-white/20">
            ?
          </span>
        )}
        <span className="mt-1 text-[10px] font-semibold text-white/30">
          匹配度
        </span>
      </div>
    </div>
  );
}

function SkeletonHint({
  isRunning,
  tone,
  width,
}: {
  isRunning: boolean;
  tone: "evidence" | "gap" | "risk";
  width: string;
}) {
  const dotClassName = {
    evidence: "bg-emerald-500",
    gap: "bg-amber-500",
    risk: "bg-rose-500",
  }[tone];

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
      <span
        className={cn(
          "cw-job-shimmer h-2.5 rounded",
          isRunning ? "cw-job-shimmer-active" : "",
        )}
        style={{ width }}
      />
    </div>
  );
}

function RunningAnalysisSteps() {
  const steps = ["读取资料", "解析职位", "匹配证据", "评估风险"];

  return (
    <div className="mt-3 grid w-full grid-cols-2 gap-1.5">
      {steps.map((step, index) => (
        <span
          className="cw-job-analysis-step rounded-md border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-semibold text-indigo-100/75"
          key={step}
          style={{ animationDelay: `${index * 0.45}s` }}
        >
          {step}
        </span>
      ))}
    </div>
  );
}

function ActionPanelAnimationStyles() {
  return (
    <style>
      {`
        @keyframes cw-job-dash-orbit { to { stroke-dashoffset: -226; } }
        @keyframes cw-job-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes cw-job-glow-button {
          0%, 100% { box-shadow: 0 4px 18px rgba(37,99,235,0.45); }
          50% { box-shadow: 0 6px 32px rgba(37,99,235,0.78); }
        }
        @keyframes cw-job-float-dot {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          40% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-40px) scale(1.2); }
        }
        @keyframes cw-job-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes cw-job-panel-breathe {
          0%, 100% { box-shadow: inset 0 0 0 1px rgba(129,140,248,0.08), 0 1px 2px rgba(15,23,42,0.04); }
          50% { box-shadow: inset 0 0 0 1px rgba(129,140,248,0.22), 0 18px 55px rgba(37,99,235,0.22); }
        }
        @keyframes cw-job-scan-beam {
          0% { transform: translateX(0); opacity: 0; }
          18% { opacity: 0.9; }
          70% { opacity: 0.55; }
          100% { transform: translateX(270%); opacity: 0; }
        }
        @keyframes cw-job-step-pulse {
          0%, 100% { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); color: rgba(224,231,255,0.62); }
          45% { border-color: rgba(129,140,248,0.55); background: rgba(99,102,241,0.22); color: rgba(255,255,255,0.95); }
        }
        @keyframes cw-job-processing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .cw-job-analysis-running { animation: cw-job-panel-breathe 2.6s ease-in-out infinite; }
        .cw-job-scan-beam {
          background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.12) 34%, rgba(147,197,253,0.28) 50%, rgba(99,102,241,0.12) 66%, transparent 100%);
          filter: blur(0.5px);
          animation: cw-job-scan-beam 2.4s ease-in-out infinite;
        }
        .cw-job-dash-orbit { animation: cw-job-dash-orbit 2s linear infinite; }
        .cw-job-dash-orbit-reverse {
          animation-duration: 3s;
          animation-direction: reverse;
        }
        .cw-job-pulse-ring { animation: cw-job-pulse-ring 2.4s ease-in-out infinite; }
        .cw-job-run-analysis:not(:disabled) {
          animation: cw-job-glow-button 2.2s ease-in-out infinite;
        }
        .cw-job-float-dot {
          position: absolute;
          border-radius: 999px;
          opacity: 0;
          animation: cw-job-float-dot 3.2s ease-in-out infinite;
        }
        .cw-job-shimmer {
          display: block;
          background: linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);
          background-size: 400px 100%;
          animation: cw-job-shimmer 1.8s linear infinite;
        }
        .cw-job-shimmer-active {
          background: linear-gradient(90deg,rgba(30,41,59,0.75) 18%,rgba(96,165,250,0.42) 42%,rgba(165,180,252,0.55) 52%,rgba(30,41,59,0.75) 82%);
          background-size: 420px 100%;
          animation-duration: 0.95s;
        }
        .cw-job-analysis-step { animation: cw-job-step-pulse 2.2s ease-in-out infinite; }
        .cw-job-processing-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(224,231,255,0.9);
          animation: cw-job-processing-dot 0.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cw-job-analysis-running,
          .cw-job-scan-beam,
          .cw-job-dash-orbit,
          .cw-job-pulse-ring,
          .cw-job-run-analysis,
          .cw-job-float-dot,
          .cw-job-shimmer,
          .cw-job-analysis-step,
          .cw-job-processing-dot {
            animation: none;
          }
        }
      `}
    </style>
  );
}

function InlineNotice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "danger" | "neutral" | "warning";
}) {
  return (
    <p
      className={cn(
        "mb-3 rounded-lg border px-3 py-2 text-xs leading-5",
        tone === "danger" ? "border-red-200 bg-red-50 text-red-700" : "",
        tone === "neutral" ? "border-slate-200 bg-slate-50 text-slate-500" : "",
        tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "",
      )}
    >
      {children}
    </p>
  );
}

function hasUsableAnalysis(matchReport: UseMatchReportResult) {
  return (
    matchReport.report?.status === "succeeded" &&
    !matchReport.isStale &&
    Boolean(matchReport.report.narrative)
  );
}

function getEmptyAnalysisTitle({
  isLoadingProfile,
  matchReport,
}: {
  isLoadingProfile: boolean;
  matchReport: UseMatchReportResult;
}) {
  if (isLoadingProfile) {
    return "正在读取资料";
  }

  if (matchReport.isLoading) {
    return "正在读取已有分析";
  }

  if (matchReport.isRunning) {
    return "AI 正在分析";
  }

  if (matchReport.report?.status === "failed") {
    return "上次分析失败";
  }

  if (matchReport.isStale) {
    return "分析需要刷新";
  }

  return "尚未运行匹配分析";
}

function getEmptyAnalysisDescription({
  canRunAnalysis,
  matchReport,
}: {
  canRunAnalysis: boolean;
  matchReport: UseMatchReportResult;
}) {
  if (!canRunAnalysis) {
    return "完善技能或工作经历后即可运行匹配分析。";
  }

  if (matchReport.isRunning) {
    return "AI 正在生成叙事分析，通常需要十几秒。";
  }

  if (matchReport.report?.status === "failed") {
    return (
      matchReport.report.errorMessage ?? "可以重新运行分析，刷新匹配度和叙事。"
    );
  }

  if (matchReport.isStale) {
    return "资料或职位已更新，需要重新分析后再生成定制简历。";
  }

  return "运行后 AI 会分析你的资料与这份职位描述，给出匹配度、命中证据、能力缺口和风险提示。";
}

function getRunAnalysisLabel(matchReport: UseMatchReportResult) {
  if (matchReport.isRunning) {
    return "分析中…";
  }

  if (matchReport.isLoading) {
    return "读取中…";
  }

  if (matchReport.report?.status === "failed" || matchReport.isStale) {
    return "重新运行分析";
  }

  return "运行匹配分析";
}

function getMatchLabel(score: number | null) {
  if (score === null) {
    return "待刷新";
  }

  if (score >= 85) {
    return "强匹配";
  }

  if (score >= 70) {
    return "可冲刺";
  }

  return "需补证据";
}

function getMatchTitle(score: number | null) {
  if (score === null) {
    return "匹配度待刷新";
  }

  if (score >= 90) {
    return "匹配度极高";
  }

  if (score >= 85) {
    return "匹配度较高";
  }

  if (score >= 70) {
    return "有机会冲刺";
  }

  return "需要补强证据";
}

function getGenerationActionLabel({
  canGenerateResume,
  hasTargetJobResume,
  isGeneratingResume,
  isLoadingReport,
  isRunningAnalysis,
  reportStatus,
  reportStale,
}: {
  canGenerateResume: boolean;
  hasTargetJobResume: boolean;
  isGeneratingResume: boolean;
  isLoadingReport: boolean;
  isRunningAnalysis: boolean;
  reportStatus: string | null;
  reportStale: boolean;
}) {
  if (hasTargetJobResume) {
    return "查看简历";
  }

  if (isGeneratingResume) {
    return "生成中…";
  }

  if (isLoadingReport) {
    return "检查报告…";
  }

  if (isRunningAnalysis) {
    return "分析中…";
  }

  if (canGenerateResume) {
    return "生成定制简历";
  }

  if (reportStatus === "succeeded" && reportStale) {
    return "重新分析后生成";
  }

  if (reportStatus === "failed") {
    return "重试分析";
  }

  return "先运行分析";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export { JobActionPanel };
