"use client";

import { useMemo, useState } from "react";
import { Button } from "antd";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Filter,
  Globe2,
  GraduationCap,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import Link from "@/components/router-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { panelClassName } from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/lib/workbench-store";

import { jobs, type JobRecord } from "@/features/jobs/mock-data";

const remoteFilters = ["远程", "混合办公", "现场办公"] as const;
const importStatusFilters = ["已解析", "待人工确认", "解析失败可重试"] as const;
const skillFilters = ["React", "TypeScript", "Design System", "AI UX"] as const;

type FilterValue =
  | (typeof remoteFilters)[number]
  | (typeof importStatusFilters)[number]
  | (typeof skillFilters)[number];

// User-facing Jobs MVP: all filtering is local and mock-backed so the page stays
// demoable before Supabase/Dify are wired in.
export function JobsListPage() {
  const selectedJobId = useWorkbenchStore((state) => state.selectedJobId);
  const setSelectedJobId = useWorkbenchStore((state) => state.setSelectedJobId);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  const filteredJobs = useMemo(
    () => filterJobs(jobs, query, activeFilters),
    [activeFilters, query],
  );
  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? jobs[0];

  const toggleFilter = (filter: FilterValue) => {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  };

  const clearFilters = () => {
    setQuery("");
    setActiveFilters([]);
  };

  return (
    <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
      <div className="flex min-w-0 flex-col gap-4">
        <div className={cn(panelClassName, "flex flex-col gap-4 p-3")}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">职位</h1>
                <Badge variant="secondary" className="bg-accent text-primary">
                  Mock 数据
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                浏览管理员导入的 JD，先用 demo 匹配报告验证定向简历流程。
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/45 px-3 xl:w-80 xl:flex-none">
                <Search
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <input
                  aria-label="按职位、公司或技能搜索"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="按职位、公司或技能搜索"
                  value={query}
                />
              </label>
              <Button
                className="bg-accent text-primary hover:bg-accent/80"
                htmlType="button"
              >
                <Zap data-icon="inline-start" />
                加速匹配
              </Button>
            </div>
          </div>

          <FilterGroup
            activeFilters={activeFilters}
            filters={remoteFilters}
            label="远程"
            onToggle={toggleFilter}
          />
          <FilterGroup
            activeFilters={activeFilters}
            filters={importStatusFilters}
            label="导入状态"
            onToggle={toggleFilter}
          />
          <FilterGroup
            activeFilters={activeFilters}
            filters={skillFilters}
            label="技能"
            onToggle={toggleFilter}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Filter aria-hidden="true" className="size-4" />
              <span>
                当前显示 {filteredJobs.length} / {jobs.length} 个职位
              </span>
            </div>
            <Button
              disabled={!query && activeFilters.length === 0}
              htmlType="button"
              onClick={clearFilters}
              type="text"
            >
              <RotateCcw data-icon="inline-start" />
              清空筛选
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                isSelected={job.id === selectedJob.id}
                job={job}
                key={job.id}
                onSelect={() => setSelectedJobId(job.id)}
              />
            ))
          ) : (
            <Card className={panelClassName}>
              <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
                <Search
                  aria-hidden="true"
                  className="size-8 text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-medium">没有匹配的职位</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    调整关键词或筛选条件后再试。
                  </p>
                </div>
                <Button htmlType="button" onClick={clearFilters}>
                  <RotateCcw data-icon="inline-start" />
                  重置列表
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle>优先处理职位</CardTitle>
            <CardDescription>
              {selectedJob.company} · {selectedJob.remoteStatus}
            </CardDescription>
            <CardAction>
              <Badge className="bg-accent text-primary">
                {selectedJob.match.score}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-primary p-4 text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
              <p className="text-sm text-primary-foreground/75">匹配强度</p>
              <p className="mt-2 text-4xl font-semibold">
                {selectedJob.match.score}%
              </p>
              <p className="mt-1 text-sm font-medium">
                {selectedJob.match.label}
              </p>
              <Progress className="mt-4" value={selectedJob.match.score} />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <StatusLine icon={ShieldCheck} text="已生成 mock 匹配报告" />
              <StatusLine
                icon={BadgeCheck}
                text={`导入状态：${selectedJob.importStatus}`}
              />
            </div>
            <Link
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
              href={`/jobs/${selectedJob.id}`}
            >
              查看详情
            </Link>
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle>AI 下一步</CardTitle>
            <CardDescription>当前为 mock provider 输出。</CardDescription>
          </CardHeader>
          <CardContent>
            <Message from="assistant">
              <MessageContent>
                <MessageResponse>
                  {`优先处理 ${selectedJob.company} 的 **${selectedJob.title}**。${selectedJob.match.aiNote}`}
                </MessageResponse>
              </MessageContent>
            </Message>
          </CardContent>
        </Card>

        <Card className={panelClassName}>
          <CardHeader>
            <CardTitle>Demo 边界</CardTitle>
            <CardDescription>本轮只验证用户侧浏览与详情。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <StatusLine icon={CheckCircle2} text="不开放普通用户上传职位" />
            <StatusLine icon={CheckCircle2} text="不调用真实 Dify workflow" />
            <StatusLine icon={CheckCircle2} text="不做自动投递或爬取" />
          </CardContent>
        </Card>
      </aside>
    </section>
  );
}

function FilterGroup({
  activeFilters,
  filters,
  label,
  onToggle,
}: {
  activeFilters: FilterValue[];
  filters: readonly FilterValue[];
  label: string;
  onToggle: (filter: FilterValue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter);

        return (
          <Button
            aria-pressed={isActive}
            className={cn(
              isActive
                ? "border-primary/30 bg-accent text-primary"
                : "bg-muted/70 text-secondary-foreground",
            )}
            htmlType="button"
            key={filter}
            onClick={() => onToggle(filter)}
          >
            {filter}
          </Button>
        );
      })}
    </div>
  );
}

function JobCard({
  isSelected,
  job,
  onSelect,
}: {
  isSelected: boolean;
  job: JobRecord;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        panelClassName,
        "transition hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        isSelected
          ? "border-primary/35 shadow-[0_8px_24px_rgba(29,78,216,0.09)]"
          : "",
      )}
      size="sm"
    >
      <CardContent className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_124px]">
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white",
              job.logoClassName,
            )}
          >
            {job.logoText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{job.postedAt}</Badge>
              <Badge variant="outline">{job.sourcePlatform}</Badge>
              <ImportStatusBadge status={job.importStatus} />
            </div>
            <h2 className="mt-2 text-lg font-semibold leading-6">
              {job.title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {job.company} / {job.companyStage}
            </p>
            <div className="mt-3 grid gap-1.5 text-[13px] leading-4 text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
              <InfoPill icon={MapPin} label={job.location} />
              <InfoPill icon={Globe2} label={job.remoteStatus} />
              <InfoPill icon={BriefcaseBusiness} label={job.jobType} />
              <InfoPill icon={GraduationCap} label={job.seniority} />
              <InfoPill icon={CalendarDays} label={job.yearsRequired} />
              <InfoPill icon={Building2} label={job.salaryRange} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...job.requiredSkills, ...job.preferredSkills.slice(0, 2)].map(
                (skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ),
              )}
            </div>
            <p className="mt-3 text-xs leading-4 text-muted-foreground">
              {job.applicantSignal}
            </p>
            <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
              {job.match.aiNote}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button htmlType="button" onClick={onSelect}>
                <Sparkles data-icon="inline-start" />
                设为当前目标
              </Button>
              <Link
                className={cn(buttonVariants({ variant: "outline" }))}
                href={`/jobs/${job.id}`}
              >
                查看详情
              </Link>
            </div>
          </div>
        </div>
        <div className="flex min-h-28 flex-col items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground">
          <p className="text-2xl font-semibold">{job.match.score}%</p>
          <p className="mt-1 text-center text-xs font-semibold">
            {job.match.label}
          </p>
          <Separator className="my-3 bg-primary-foreground/15" />
          <p className="text-center text-xs text-primary-foreground/70">
            AI 证据匹配
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoPill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <span className="truncate">{label}</span>
    </div>
  );
}

function StatusLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-success" />
      <span className="min-w-0">{text}</span>
    </div>
  );
}

function ImportStatusBadge({ status }: { status: JobRecord["importStatus"] }) {
  if (status === "已解析") {
    return <Badge className="bg-success text-success-foreground">{status}</Badge>;
  }

  if (status === "待人工确认") {
    return (
      <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    );
  }

  return <Badge variant="destructive">{status}</Badge>;
}

function filterJobs(
  sourceJobs: JobRecord[],
  query: string,
  filters: FilterValue[],
) {
  const normalizedQuery = query.trim().toLowerCase();

  return sourceJobs.filter((job) => {
    const skills = [...job.requiredSkills, ...job.preferredSkills];
    const queryTarget = [
      job.company,
      job.title,
      job.companyStage,
      job.location,
      job.summary,
      ...skills,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery =
      !normalizedQuery || queryTarget.includes(normalizedQuery);
    const matchesFilters = filters.every(
      (filter) =>
        job.remoteStatus === filter ||
        job.importStatus === filter ||
        skills.includes(filter),
    );

    return matchesQuery && matchesFilters;
  });
}
