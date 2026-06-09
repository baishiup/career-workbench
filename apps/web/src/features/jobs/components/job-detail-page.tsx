"use client";

import { Button, Card, Chip, ProgressBar } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  GraduationCap,
  MapPin,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";

import Link from "@/components/router-link";
import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";

import { getJobById, type JobRecord } from "@/features/jobs/mock-data";

// Detail route focuses on the user-side JD inspection and mock matching flow.
// Admin import, persistence, and real AI orchestration remain out of this pass.
export function JobDetailPage({ jobId }: { jobId: string }) {
  const job = getJobById(jobId);

  if (!job) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/jobs"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          返回职位列表
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位不存在
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          当前 mock 数据里没有这个职位。
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-5 lg:px-6">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        href="/jobs"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回职位列表
      </Link>

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
              job.logoClassName,
            )}
          >
            {job.logoText}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft">{job.sourcePlatform}</Chip>
              <ImportStatusBadge status={job.importStatus} />
              <Chip color="default" size="sm" variant="secondary">
                {job.postedAt}
              </Chip>
            </div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
              {job.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {job.company} / {job.companyStage}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              {job.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-blue-600 p-4 text-white">
          <div>
            <p className="text-sm text-white/75">Mock 匹配分</p>
            <p className="mt-2 text-4xl font-semibold">{job.match.score}%</p>
            <p className="mt-1 text-sm font-medium">{job.match.label}</p>
          </div>
          <ProgressBar color="success" size="sm" value={job.match.score} />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary">
              <PlayCircle data-icon="inline-start" />
              运行分析
            </Button>
            <Button type="button" variant="primary">
              <Sparkles data-icon="inline-start" />
              生成简历
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="flex min-w-0 flex-col gap-4">
          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>职位概览</Card.Title>
              <Card.Description>
                来自管理员导入后的结构化 JD mock 字段。
              </Card.Description>
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
            </Card.Header>
            <Card.Content className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Fact icon={MapPin} label="地点" value={job.location} />
              <Fact icon={Globe2} label="远程状态" value={job.remoteStatus} />
              <Fact icon={BriefcaseBusiness} label="岗位类型" value={job.jobType} />
              <Fact icon={GraduationCap} label="级别" value={job.seniority} />
              <Fact icon={CalendarDays} label="年限要求" value={job.yearsRequired} />
              <Fact icon={Building2} label="薪资范围" value={job.salaryRange} />
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
          <Card className={panelClassName}>
            <Card.Header>
              <Card.Title>匹配分析</Card.Title>
              <Card.Description>
                {job.match.provider} · {job.match.runId}
              </Card.Description>
              <div className="ml-auto">
                <Chip color="accent" size="sm" variant="soft">
                  {job.match.generatedAt}
                </Chip>
              </div>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <p className="text-sm leading-6 text-slate-500">
                {job.match.aiNote}
              </p>
              <div className="h-px bg-border" />
              <MatchSection
                icon={BadgeCheck}
                items={job.match.evidence}
                title="命中证据"
                tone="success"
              />
              <MatchSection
                icon={ShieldAlert}
                items={job.match.gaps}
                title="能力缺口"
                tone="warning"
              />
              <MatchSection
                icon={ShieldAlert}
                items={job.match.risks}
                title="风险表达"
                tone="muted"
              />
            </Card.Content>
          </Card>

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
                      当前仅展示 mock 状态。后续接 Dify 后，该动作应写入
                      ResumeVersion、AiRun 和 Dify 外部运行引用。
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
              <Card.Description>{job.importedBy}</Card.Description>
            </Card.Header>
            <Card.Content className="grid gap-2 text-sm">
              <MetaRow label="导入方式" value={importMethodLabel(job.importMethod)} />
              <MetaRow label="导入状态" value={job.importStatus} />
              <MetaRow label="申请信号" value={job.applicantSignal} />
            </Card.Content>
          </Card>
        </aside>
      </div>
    </section>
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
        <ul className="space-y-3 text-sm leading-6 text-slate-500">
          {items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
        {items.map((item) => (
          <Chip
            color={tone === "required" ? "accent" : "default"}
            key={item}
            size="sm"
            variant={tone === "required" ? "primary" : "secondary"}
          >
            {item}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function MatchSection({
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ImportStatusBadge({ status }: { status: JobRecord["importStatus"] }) {
  if (status === "已解析") {
    return (
      <Chip color="success" size="sm" variant="primary">
        {status}
      </Chip>
    );
  }

  if (status === "待人工确认") {
    return (
      <Chip color="warning" size="sm" variant="primary">
        {status}
      </Chip>
    );
  }

  return (
    <Chip color="danger" size="sm" variant="soft">
      {status}
    </Chip>
  );
}

function importMethodLabel(method: JobRecord["importMethod"]) {
  const labels: Record<JobRecord["importMethod"], string> = {
    job_url: "职位链接",
    manual_text: "手动粘贴 JD",
    screenshot: "截图导入",
  };

  return labels[method];
}
