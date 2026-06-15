"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Table } from "@heroui/react";
import { ArrowRight, Import, Loader2, RefreshCw, Search } from "lucide-react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";
import { cn } from "@/lib/utils";

import { listJobs, type JobsDataMode } from "@/lib/jobs/api";
import {
  getJobLogo,
  jobTypeLabels,
  remoteStatusLabels,
} from "@/lib/jobs/labels";
import type { JobRecord, JobRemoteStatus } from "@/lib/jobs/types";

const remoteStatusOptions: JobRemoteStatus[] = ["remote", "hybrid", "onsite"];

type RemoteStatusFilter = JobRemoteStatus | null;

export function JobsListPage() {
  const isAdmin = useAuthStore((state) => Boolean(state.profile?.isAdmin));
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [mode, setMode] = useState<JobsDataMode>("supabase");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [remoteFilter, setRemoteFilter] = useState<RemoteStatusFilter>(null);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await listJobs();
      setJobs(result.jobs);
      setMode(result.mode);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "读取职位列表失败。",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(
    () => filterJobs(jobs, query, remoteFilter),
    [jobs, query, remoteFilter],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">职位</h1>
            {mode === "mock" ? (
              <Chip color="warning" size="sm" variant="soft">
                本地演示数据
              </Chip>
            ) : null}
          </div>
          <p className="text-sm text-slate-500">管理导入的职位。</p>
        </div>
        {isAdmin ? (
          <Button
            onPress={() => navigateTo("/jobs/new")}
            type="button"
            variant="primary"
          >
            <Import className="size-4" />
            导入职位
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-[320px]">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          />
          <Input
            aria-label="搜索职位、公司或技能"
            className="pl-9"
            fullWidth
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索职位、公司或技能"
            value={query}
          />
        </div>

        {remoteStatusOptions.map((option) => (
          <Button
            aria-pressed={remoteFilter === option}
            key={option}
            onPress={() =>
              setRemoteFilter((current) => (current === option ? null : option))
            }
            size="sm"
            type="button"
            variant={remoteFilter === option ? "secondary" : "tertiary"}
          >
            {remoteStatusLabels[option]}
          </Button>
        ))}

        <span className="ml-auto text-sm text-slate-500">
          {filteredJobs.length} / {jobs.length} 个职位
        </span>
      </div>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          正在加载职位…
        </div>
      ) : loadError ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <div>
            <p className="text-sm font-semibold">职位列表加载失败</p>
            <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          </div>
          <Button
            onPress={() => void loadJobs()}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            重试
          </Button>
        </div>
      ) : filteredJobs.length > 0 ? (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="职位列表">
              <Table.Header>
                <Table.Column isRowHeader>职位</Table.Column>
                <Table.Column>地点 / 方式</Table.Column>
                <Table.Column>类型</Table.Column>
                <Table.Column>操作</Table.Column>
              </Table.Header>
              <Table.Body items={filteredJobs}>
                {(job) => <JobRow job={job} />}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Search aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {jobs.length > 0 ? "没有匹配的职位" : "还没有职位"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length > 0
                ? "调整关键词或筛选条件后再试。"
                : "等管理员导入职位后这里会显示列表。"}
            </p>
          </div>
          {jobs.length > 0 ? (
            <Button
              onPress={() => {
                setQuery("");
                setRemoteFilter(null);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              重置筛选
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}

function JobRow({ job }: { job: JobRecord }) {
  const logo = getJobLogo(job.company);

  return (
    <Table.Row id={job.id}>
      <Table.Cell>
        <div className="flex min-w-0 items-center gap-3">
          {job.logoUrl ? (
            <img
              alt={`${job.company} logo`}
              className="size-9 shrink-0 rounded-lg object-cover"
              src={job.logoUrl}
            />
          ) : (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                logo.className,
              )}
            >
              {logo.text}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-slate-900">{job.title}</p>
              {!job.isActive ? (
                <Chip color="default" size="sm" variant="soft">
                  已停用
                </Chip>
              ) : null}
            </div>
            <p className="truncate text-sm text-slate-500">{job.company}</p>
          </div>
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="min-w-0">
          <p className="text-sm text-slate-900">
            {remoteStatusLabels[job.remoteStatus]}
          </p>
          <p className="truncate text-sm text-slate-500">
            {job.location ?? "未提供"}
          </p>
        </div>
      </Table.Cell>
      <Table.Cell>{jobTypeLabels[job.jobType]}</Table.Cell>
      <Table.Cell>
        <Link
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
          href={`/jobs/${job.id}`}
        >
          查看详情
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Table.Cell>
    </Table.Row>
  );
}

function filterJobs(
  sourceJobs: JobRecord[],
  query: string,
  remoteFilter: RemoteStatusFilter,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return sourceJobs.filter((job) => {
    if (remoteFilter && job.remoteStatus !== remoteFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      job.company,
      job.title,
      job.companyInfo,
      job.location,
      job.summary,
      ...job.requiredSkills,
      ...job.preferredSkills,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
