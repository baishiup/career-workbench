"use client";

import { useMemo, useState } from "react";
import { Button } from "antd";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Crown,
  ExternalLink,
  Filter,
  Laptop,
  MapPin,
  MoreHorizontal,
  Pin,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Link from "@/components/router-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { panelClassName } from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/lib/workbench-store";

import { jobs, type JobRecord } from "@/features/jobs/mock-data";

const remoteFilters = ["远程", "混合办公", "现场办公"] as const;
const jobTypeFilters = ["全职", "合同", "兼职"] as const;
const seniorityFilters = ["Senior", "Staff / Lead"] as const;
const importStatusFilters = ["已解析", "待人工确认", "解析失败可重试"] as const;
const skillFilters = ["React", "TypeScript", "Design System", "AI UX"] as const;

type FilterValue =
  | (typeof remoteFilters)[number]
  | (typeof jobTypeFilters)[number]
  | (typeof seniorityFilters)[number]
  | (typeof importStatusFilters)[number]
  | (typeof skillFilters)[number];

type FilterPanel = "location" | "type" | "level" | "status" | "more" | null;

// User-facing Jobs MVP: filtering stays local and mock-backed while the page
// matches the dense workbench layout from the selected reference.
export function JobsListPage() {
  const selectedJobId = useWorkbenchStore((state) => state.selectedJobId);
  const setSelectedJobId = useWorkbenchStore((state) => state.setSelectedJobId);
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);
  const [openPanel, setOpenPanel] = useState<FilterPanel>(null);

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
    setOpenPanel(null);
  };

  return (
    <section className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 px-4 py-4 lg:px-5">
      <FilterBar
        activeFilters={activeFilters}
        clearFilters={clearFilters}
        filteredCount={filteredJobs.length}
        jobsCount={jobs.length}
        openPanel={openPanel}
        query={query}
        setOpenPanel={setOpenPanel}
        setQuery={setQuery}
        toggleFilter={toggleFilter}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <JobsTable
          filteredJobs={filteredJobs}
          onClear={clearFilters}
          onSelect={setSelectedJobId}
          selectedJob={selectedJob}
        />
        <PriorityPanel job={selectedJob} />
      </div>
    </section>
  );
}

function FilterBar({
  activeFilters,
  clearFilters,
  filteredCount,
  jobsCount,
  openPanel,
  query,
  setOpenPanel,
  setQuery,
  toggleFilter,
}: {
  activeFilters: FilterValue[];
  clearFilters: () => void;
  filteredCount: number;
  jobsCount: number;
  openPanel: FilterPanel;
  query: string;
  setOpenPanel: (panel: FilterPanel) => void;
  setQuery: (query: string) => void;
  toggleFilter: (filter: FilterValue) => void;
}) {
  const hasActiveFilter = activeFilters.length > 0 || query.length > 0;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label
          className={cn(
            panelClassName,
            "flex h-11 min-w-[280px] flex-1 items-center gap-3 px-4 sm:max-w-[420px]",
          )}
        >
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <input
            aria-label="搜索职位、公司或关键词"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索职位、公司或关键词"
            value={query}
          />
          <span className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">
            Cmd K
          </span>
        </label>

        <ToolbarButton
          icon={Filter}
          isActive={openPanel === "more" || activeFilters.length > 0}
          label={activeFilters.length ? `筛选 ${activeFilters.length}` : "筛选"}
          onClick={() => setOpenPanel(openPanel === "more" ? null : "more")}
        />
        <ToolbarButton
          isActive={openPanel === "location" || hasAny(activeFilters, remoteFilters)}
          label={selectedLabel(activeFilters, remoteFilters, "地点")}
          onClick={() =>
            setOpenPanel(openPanel === "location" ? null : "location")
          }
        />
        <ToolbarButton
          isActive={openPanel === "type" || hasAny(activeFilters, jobTypeFilters)}
          label={selectedLabel(activeFilters, jobTypeFilters, "工作类型")}
          onClick={() => setOpenPanel(openPanel === "type" ? null : "type")}
        />
        <ToolbarButton
          isActive={
            openPanel === "level" || hasAny(activeFilters, seniorityFilters)
          }
          label={selectedLabel(activeFilters, seniorityFilters, "经验 level")}
          onClick={() => setOpenPanel(openPanel === "level" ? null : "level")}
        />
        <ToolbarButton
          isActive={
            openPanel === "status" || hasAny(activeFilters, importStatusFilters)
          }
          label={selectedLabel(activeFilters, importStatusFilters, "状态")}
          onClick={() => setOpenPanel(openPanel === "status" ? null : "status")}
        />
        <ToolbarButton
          icon={MoreHorizontal}
          isActive={openPanel === "more" || hasAny(activeFilters, skillFilters)}
          label={selectedLabel(activeFilters, skillFilters, "更多")}
          onClick={() => setOpenPanel(openPanel === "more" ? null : "more")}
        />
        <Button
          className="h-11 px-3 text-primary"
          disabled={!hasActiveFilter}
          htmlType="button"
          onClick={clearFilters}
          type="text"
        >
          重置
        </Button>
      </div>

      {openPanel ? (
        <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {filterPanelLabel(openPanel)}
          </span>
          {filterPanelOptions(openPanel).map((filter) => (
            <Button
              aria-pressed={activeFilters.includes(filter)}
              className={cn(
                "h-8 rounded-lg px-3",
                activeFilters.includes(filter)
                  ? "border-primary/30 bg-accent text-primary"
                  : "bg-muted/70 text-secondary-foreground hover:border-primary/20",
              )}
              htmlType="button"
              key={filter}
              onClick={() => toggleFilter(filter)}
            >
              {filter}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            当前显示 {filteredCount} / {jobsCount}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  isActive,
  label,
  onClick,
}: {
  icon?: LucideIcon;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(
        "h-11 rounded-lg border-border bg-card px-3 text-[15px] text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        isActive ? "border-primary/30 bg-accent text-primary" : "",
      )}
      htmlType="button"
      onClick={onClick}
    >
      {Icon ? <Icon data-icon="inline-start" /> : null}
      <span className="max-w-32 truncate">{label}</span>
      <ChevronDown data-icon="inline-end" />
    </Button>
  );
}

function JobsTable({
  filteredJobs,
  onClear,
  onSelect,
  selectedJob,
}: {
  filteredJobs: JobRecord[];
  onClear: () => void;
  onSelect: (jobId: string) => void;
  selectedJob: JobRecord;
}) {
  return (
    <div className={cn(panelClassName, "min-w-0 overflow-hidden")}>
      <div className="grid min-h-11 grid-cols-[minmax(220px,1.1fr)_minmax(260px,1fr)_104px] items-center border-b border-border bg-muted/35 px-5 text-sm font-medium text-muted-foreground max-lg:hidden">
        <span>职位信息</span>
        <span>关键信息</span>
        <span className="text-right">匹配度</span>
      </div>

      <div className="flex min-w-0 flex-col">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobTableRow
              isSelected={job.id === selectedJob.id}
              job={job}
              key={job.id}
              onSelect={() => onSelect(job.id)}
            />
          ))
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <Search aria-hidden="true" className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">没有匹配的职位</p>
              <p className="mt-1 text-sm text-muted-foreground">
                调整关键词或筛选条件后再试。
              </p>
            </div>
            <Button htmlType="button" onClick={onClear}>
              <RotateCcw data-icon="inline-start" />
              重置列表
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function JobTableRow({
  isSelected,
  job,
  onSelect,
}: {
  isSelected: boolean;
  job: JobRecord;
  onSelect: () => void;
}) {
  const visibleSkills = job.requiredSkills.slice(0, 3);

  return (
    <button
      className={cn(
        "grid min-w-0 grid-cols-1 gap-3 border-b border-border px-5 py-4 text-left transition last:border-b-0 hover:bg-accent/30 lg:grid-cols-[minmax(220px,1.1fr)_minmax(260px,1fr)_104px] lg:items-center",
        isSelected ? "bg-accent/45 shadow-[inset_3px_0_0_hsl(var(--primary))]" : "",
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
            job.logoClassName,
          )}
        >
          {job.logoText}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold leading-6 text-foreground">
              {job.title}
            </h2>
            {job.match.score >= 95 ? (
              <Badge className="border-primary/20 bg-accent text-primary">
                <CheckCircle2 aria-hidden="true" className="mr-1 size-3" />
                优先
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[15px] text-muted-foreground">
            {job.company} · {compactStage(job.companyStage)}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] leading-5 text-muted-foreground">
          <InfoPill icon={remoteIcon(job.remoteStatus)} label={job.remoteStatus} />
          <span className="hidden text-muted-foreground/60 sm:inline">·</span>
          <InfoPill icon={BriefcaseBusiness} label={job.jobType} />
          <span className="hidden text-muted-foreground/60 sm:inline">·</span>
          <span className="truncate">{compactLocation(job)}</span>
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <Badge
              className="border-primary/10 bg-accent text-primary"
              key={skill}
              variant="outline"
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-base font-semibold",
            matchPillClassName(job.match.score),
          )}
        >
          {job.match.score}%
        </span>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground"
        />
      </div>
    </button>
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

function PriorityPanel({ job }: { job: JobRecord }) {
  return (
    <aside className={cn(panelClassName, "min-w-0 overflow-hidden xl:sticky xl:top-4 xl:h-fit")}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-lg font-semibold text-foreground">
            优先处理职位
          </h2>
          <Crown aria-hidden="true" className="size-5 shrink-0 text-warning" />
        </div>
        <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
          <Pin aria-hidden="true" className="size-5" />
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold leading-7 text-foreground">
              {job.title}
            </h3>
            <p className="mt-1.5 truncate text-[15px] text-muted-foreground">
              {job.company} · {compactStage(job.companyStage)} · {job.remoteStatus}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-4xl font-semibold leading-none text-primary">
              {job.match.score}%
            </p>
            <p className="mt-1 text-sm text-muted-foreground">匹配度</p>
          </div>
        </div>

        <Progress className="mt-5 h-2" value={job.match.score} />
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>综合匹配度</span>
          <span>{job.match.score} / 100</span>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <SectionTitle icon={SlidersHorizontal} label="AI 评估摘要" />
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            {job.match.aiNote}
          </p>
        </div>

        <EvidenceList
          iconClassName="text-success"
          items={job.match.evidence}
          title="关键证据"
        />
        <EvidenceList
          iconClassName="text-warning"
          items={job.match.gaps}
          title="潜在差距"
        />

        <div className="mt-5 grid gap-2 rounded-lg border border-border bg-muted/35 p-3 text-sm text-muted-foreground">
          <MetaLine label="导入状态" value={job.importStatus} />
          <MetaLine label="发布时间" value={job.postedAt} />
          <MetaLine label="薪资范围" value={job.salaryRange} />
        </div>

        <Link
          className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
          href={`/jobs/${job.id}`}
        >
          查看详情
        </Link>
      </div>
    </aside>
  );
}

function EvidenceList({
  iconClassName,
  items,
  title,
}: {
  iconClassName: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="mt-5">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <div className="mt-2 flex flex-col gap-2">
        {items.slice(0, 3).map((item) => (
          <div
            className="flex min-w-0 items-center gap-2 rounded-lg bg-muted/45 px-3 py-2 text-[15px] text-muted-foreground"
            key={item}
          >
            <CheckCircle2
              aria-hidden="true"
              className={cn("size-4 shrink-0", iconClassName)}
            />
            <span className="min-w-0 flex-1 truncate">{item}</span>
            <ExternalLink
              aria-hidden="true"
              className="size-4 shrink-0 text-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
      <Icon aria-hidden="true" className="size-5 text-primary" />
      <span>{label}</span>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
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
        job.jobType === filter ||
        job.seniority === filter ||
        job.importStatus === filter ||
        skills.includes(filter),
    );

    return matchesQuery && matchesFilters;
  });
}

function selectedLabel(
  activeFilters: FilterValue[],
  options: readonly FilterValue[],
  fallback: string,
) {
  const selected = activeFilters.filter((filter) => options.includes(filter));

  if (selected.length === 0) {
    return fallback;
  }

  if (selected.length === 1) {
    return selected[0];
  }

  return `${fallback} ${selected.length}`;
}

function hasAny(activeFilters: FilterValue[], options: readonly FilterValue[]) {
  return activeFilters.some((filter) => options.includes(filter));
}

function filterPanelLabel(panel: Exclude<FilterPanel, null>) {
  const labels = {
    location: "地点",
    type: "工作类型",
    level: "经验 level",
    status: "状态",
    more: "更多筛选",
  } satisfies Record<Exclude<FilterPanel, null>, string>;

  return labels[panel];
}

function filterPanelOptions(panel: Exclude<FilterPanel, null>) {
  const optionGroups = {
    location: remoteFilters,
    type: jobTypeFilters,
    level: seniorityFilters,
    status: importStatusFilters,
    more: skillFilters,
  } satisfies Record<Exclude<FilterPanel, null>, readonly FilterValue[]>;

  return optionGroups[panel];
}

function compactStage(stage: string) {
  return stage.split("·").at(-1)?.trim() ?? stage;
}

function compactLocation(job: JobRecord) {
  if (job.remoteStatus === "远程") {
    return job.location.includes("United States") ? "美洲（可全球远程）" : job.location;
  }

  if (job.remoteStatus === "混合办公") {
    return `混合办公（${job.location}）`;
  }

  return `现场办公（${job.location}）`;
}

function remoteIcon(remoteStatus: JobRecord["remoteStatus"]) {
  if (remoteStatus === "远程") {
    return Laptop;
  }

  if (remoteStatus === "混合办公") {
    return Building2;
  }

  return MapPin;
}

function matchPillClassName(score: number) {
  if (score >= 95) {
    return "bg-primary/10 text-primary";
  }

  if (score >= 85) {
    return "bg-success/10 text-success";
  }

  return "bg-muted text-muted-foreground";
}
