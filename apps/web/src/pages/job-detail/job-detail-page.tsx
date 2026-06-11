"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, ProgressBar } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  PlayCircle,
  Power,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import Link from "@/components/router-link";
import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";
import { cn } from "@/lib/utils";

import { getJob, setJobActive } from "@/lib/jobs/api";
import {
  getJobLogo,
  importMethodLabels,
  jobTypeLabels,
  remoteStatusLabels,
} from "@/lib/jobs/labels";
import type { JobRecord } from "@/lib/jobs/types";
import { useProfileDraft } from "@/lib/profile/use-profile-draft";
import {
  computeRuleMatch,
  hasMatchableProfile,
  type RuleMatchResult,
} from "@career-workbench/domain";

import { MatchReportCard } from "./components/match-report-card";
import { useMatchReport } from "./use-match-report";

export function JobDetailPage({ jobId }: { jobId: string }) {
  const isAdmin = useAuthStore((state) => Boolean(state.profile?.isAdmin));
  const [job, setJob] = useState<JobRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const { profile, isLoading: isProfileLoading } = useProfileDraft();

  const ruleMatch = useMemo(() => {
    if (!job || isProfileLoading || !hasMatchableProfile(profile)) {
      return null;
    }

    return computeRuleMatch(profile, job);
  }, [job, profile, isProfileLoading]);

  const matchReport = useMatchReport(jobId);

  const handleRunAnalysis = () => {
    if (ruleMatch && !matchReport.isRunning) {
      void matchReport.runAnalysis(ruleMatch);
    }
  };

  const loadJob = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getJob(jobId);
      setJob(result.job);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "读取职位详情失败。");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  if (isLoading) {
    return (
      <DetailShell>
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          正在加载职位详情…
        </div>
      </DetailShell>
    );
  }

  if (loadError) {
    return (
      <DetailShell>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位详情加载失败
        </h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <Button
          className="mt-4 w-fit"
          onPress={() => void loadJob()}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          重试
        </Button>
      </DetailShell>
    );
  }

  if (!job) {
    return (
      <DetailShell>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位不存在
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          该职位可能已被停用或删除。
        </p>
      </DetailShell>
    );
  }

  const logo = getJobLogo(job.company);

  const handleToggleActive = async () => {
    setIsToggling(true);
    setToggleError(null);

    try {
      const updated = await setJobActive(job.id, !job.isActive);
      setJob(updated);
    } catch (error) {
      setToggleError(
        error instanceof Error ? error.message : "切换职位状态失败。",
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-5 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/jobs"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          返回职位列表
        </Link>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button
              onPress={() => navigateTo(`/jobs/${job.id}/edit`)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Pencil className="size-4" />
              编辑职位
            </Button>
            <Button
              isDisabled={isToggling}
              onPress={() => void handleToggleActive()}
              size="sm"
              type="button"
              variant={job.isActive ? "danger-soft" : "secondary"}
            >
              {isToggling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              {job.isActive ? "停用职位" : "启用职位"}
            </Button>
          </div>
        ) : null}
      </div>

      {toggleError ? (
        <p className="text-sm text-red-600">{toggleError}</p>
      ) : null}

      <div
        className={cn(
          panelClassName,
          "grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_260px]",
        )}
      >
        <div className="flex min-w-0 gap-4">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white",
              logo.className,
            )}
          >
            {logo.text}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {job.sourcePlatform ? (
                <Chip size="sm" variant="soft">{job.sourcePlatform}</Chip>
              ) : null}
              {!job.isActive ? (
                <Chip color="default" size="sm" variant="soft">
                  已停用
                </Chip>
              ) : null}
              {job.postedAt ? (
                <Chip color="default" size="sm" variant="secondary">
                  发布于 {job.postedAt}
                </Chip>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
              {job.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {job.company}
              {job.companyStage ? ` / ${job.companyStage}` : null}
            </p>
            {job.summary ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                {job.summary}
              </p>
            ) : null}
          </div>
        </div>

        <MatchScorePanel
          isProfileLoading={isProfileLoading}
          isRunningAnalysis={matchReport.isRunning}
          match={ruleMatch}
          onRunAnalysis={handleRunAnalysis}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="flex min-w-0 flex-col gap-4">
          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>职位概览</Card.Title>
              <Card.Description>
                管理员导入后的结构化 JD 字段。
              </Card.Description>
              {job.sourceUrl ? (
                <div className="ml-auto">
                  <a
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
                    href={job.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink data-icon="inline-start" />
                    原始链接
                  </a>
                </div>
              ) : null}
            </Card.Header>
            <Card.Content className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Fact icon={MapPin} label="地点" value={job.location ?? "未提供"} />
              <Fact
                icon={Globe2}
                label="远程状态"
                value={remoteStatusLabels[job.remoteStatus]}
              />
              <Fact
                icon={BriefcaseBusiness}
                label="岗位类型"
                value={jobTypeLabels[job.jobType]}
              />
              <Fact
                icon={GraduationCap}
                label="级别"
                value={job.seniority ?? "未提供"}
              />
              <Fact
                icon={CalendarDays}
                label="年限要求"
                value={job.yearsRequired ?? "未提供"}
              />
              <Fact
                icon={Building2}
                label="薪资范围"
                value={job.salaryRange ?? "未公开"}
              />
            </Card.Content>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <TextListCard
              icon={Target}
              items={job.responsibilities}
              title="职责描述"
            />
            <TextListCard
              icon={FileText}
              items={job.requirements}
              title="任职要求"
            />
          </div>

          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>技能标签</Card.Title>
              <Card.Description>
                必备技能和加分技能会进入后续匹配分析输入。
              </Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-4 md:grid-cols-2">
              <SkillGroup
                items={job.requiredSkills}
                title="必备技能"
                tone="required"
              />
              <SkillGroup
                items={job.preferredSkills}
                title="加分技能"
                tone="preferred"
              />
            </Card.Content>
          </Card>
        </main>

        <aside className="flex min-w-0 flex-col gap-4">
          <MatchReportCard
            canRun={Boolean(ruleMatch)}
            matchReport={matchReport}
            onRun={handleRunAnalysis}
          />

          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>生成状态</Card.Title>
              <Card.Description>演示入口，不调用真实 AI。</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              <div className={cn(softPanelClassName, "p-3")}>
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      target job resume draft
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      当前仅展示占位状态。后续任务接入 resume_generate
                      后，该动作会基于匹配报告生成定制简历。
                    </p>
                  </div>
                </div>
              </div>
              <Button fullWidth type="button" variant="primary">
                <Sparkles data-icon="inline-start" />
                生成 target job 简历
              </Button>
            </Card.Content>
          </Card>

          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>导入元数据</Card.Title>
              {job.importedBy ? (
                <Card.Description>{job.importedBy}</Card.Description>
              ) : null}
            </Card.Header>
            <Card.Content className="grid gap-2 text-sm">
              <MetaRow
                label="导入方式"
                value={importMethodLabels[job.importMethod]}
              />
            </Card.Content>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        href="/jobs"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回职位列表
      </Link>
      {children}
    </section>
  );
}

function MatchScorePanel({
  isProfileLoading,
  isRunningAnalysis,
  match,
  onRunAnalysis,
}: {
  isProfileLoading: boolean;
  isRunningAnalysis: boolean;
  match: RuleMatchResult | null;
  onRunAnalysis: () => void;
}) {
  if (isProfileLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white">
        <div>
          <p className="text-sm text-white/75">规则匹配分</p>
          <p className="mt-2 text-4xl font-semibold">—</p>
          <p className="mt-1 text-sm font-medium text-white/75">
            正在加载 Profile…
          </p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-slate-900 p-4 text-white">
        <div>
          <p className="text-sm text-white/75">规则匹配分</p>
          <p className="mt-2 text-4xl font-semibold">—</p>
          <p className="mt-1 text-sm font-medium text-white/75">
            完善 Profile 的技能或工作经历后，这里会实时计算匹配分。
          </p>
        </div>
        <Button onPress={() => navigateTo("/profile")} type="button" variant="secondary">
          去完善 Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-blue-600 p-4 text-white">
      <div>
        <p className="text-sm text-white/75">规则匹配分</p>
        <p className="mt-2 text-4xl font-semibold">{match.score}%</p>
        <p className="mt-1 text-sm font-medium">{match.label}</p>
      </div>
      <ProgressBar color="success" size="sm" value={match.score} />
      {match.breakdown.missingRequiredSkills.length > 0 ? (
        <p className="text-xs leading-5 text-white/75">
          缺少必备技能：{match.breakdown.missingRequiredSkills.join("、")}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button
          isDisabled={isRunningAnalysis}
          onPress={onRunAnalysis}
          type="button"
          variant="secondary"
        >
          {isRunningAnalysis ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PlayCircle data-icon="inline-start" />
          )}
          {isRunningAnalysis ? "分析中…" : "运行分析"}
        </Button>
        <Button type="button" variant="primary">
          <Sparkles data-icon="inline-start" />
          生成简历
        </Button>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className={cn(softPanelClassName, "flex min-w-0 gap-3 p-3")}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TextListCard({
  icon: Icon,
  items,
  title,
}: {
  icon: LucideIcon;
  items: string[];
  title: string;
}) {
  return (
    <Card className={panelClassName}>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <Icon aria-hidden="true" className="size-4 text-blue-600" />
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {items.length > 0 ? (
          <ul className="space-y-3 text-sm leading-6 text-slate-500">
            {items.map((item) => (
              <li className="flex gap-2" key={item}>
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">暂无内容。</p>
        )}
      </Card.Content>
    </Card>
  );
}

function SkillGroup({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "required" | "preferred";
}) {
  return (
    <div className={cn(softPanelClassName, "p-3")}>
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Chip
              color={tone === "required" ? "accent" : "default"}
              key={item}
              size="sm"
              variant={tone === "required" ? "primary" : "secondary"}
            >
              {item}
            </Chip>
          ))
        ) : (
          <span className="text-sm text-slate-500">暂无标签。</span>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

