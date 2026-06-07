"use client";

import { Button } from "antd";
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
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/jobs"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          返回职位列表
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位不存在
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          当前 mock 数据里没有这个职位。
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-5 lg:px-6">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
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
              <Badge variant="outline">{job.sourcePlatform}</Badge>
              <ImportStatusBadge status={job.importStatus} />
              <Badge variant="secondary">{job.postedAt}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
              {job.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.company} / {job.companyStage}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {job.summary}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 text-primary-foreground">
          <div>
            <p className="text-sm text-primary-foreground/75">Mock 匹配分</p>
            <p className="mt-2 text-4xl font-semibold">{job.match.score}%</p>
            <p className="mt-1 text-sm font-medium">{job.match.label}</p>
          </div>
          <Progress value={job.match.score} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              htmlType="button"
            >
              <PlayCircle data-icon="inline-start" />
              运行分析
            </Button>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90"
              htmlType="button"
              type="primary"
            >
              <Sparkles data-icon="inline-start" />
              生成简历
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="flex min-w-0 flex-col gap-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>职位概览</CardTitle>
              <CardDescription>
                来自管理员导入后的结构化 JD mock 字段。
              </CardDescription>
              <CardAction>
                <a
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href={job.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink data-icon="inline-start" />
                  原始链接
                </a>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Fact icon={MapPin} label="地点" value={job.location} />
              <Fact icon={Globe2} label="远程状态" value={job.remoteStatus} />
              <Fact icon={BriefcaseBusiness} label="岗位类型" value={job.jobType} />
              <Fact icon={GraduationCap} label="级别" value={job.seniority} />
              <Fact icon={CalendarDays} label="年限要求" value={job.yearsRequired} />
              <Fact icon={Building2} label="薪资范围" value={job.salaryRange} />
            </CardContent>
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
            <CardHeader>
              <CardTitle>技能标签</CardTitle>
              <CardDescription>
                必备技能和加分技能会进入后续匹配分析输入。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
            </CardContent>
          </Card>
        </main>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>匹配分析</CardTitle>
              <CardDescription>
                {job.match.provider} · {job.match.runId}
              </CardDescription>
              <CardAction>
                <Badge className="bg-accent text-primary">
                  {job.match.generatedAt}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {job.match.aiNote}
              </p>
              <Separator />
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
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>生成状态</CardTitle>
              <CardDescription>演示入口，不调用真实 AI。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className={cn(softPanelClassName, "p-3")}>
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-success"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      target job resume draft
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      当前仅展示 mock 状态。后续接 Dify 后，该动作应写入
                      ResumeVersion、AiRun 和 Dify 外部运行引用。
                    </p>
                  </div>
                </div>
              </div>
              <Button className="w-full" htmlType="button" type="primary">
                <Sparkles data-icon="inline-start" />
                生成 target job 简历
              </Button>
            </CardContent>
          </Card>

          <Card className={panelClassName}>
            <CardHeader>
              <CardTitle>导入元数据</CardTitle>
              <CardDescription>{job.importedBy}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <MetaRow label="导入方式" value={importMethodLabel(job.importMethod)} />
              <MetaRow label="导入状态" value={job.importStatus} />
              <MetaRow label="申请信号" value={job.applicantSignal} />
            </CardContent>
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
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden="true" className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
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
          <Badge
            className={
              tone === "required" ? "bg-primary text-primary-foreground" : ""
            }
            key={item}
            variant={tone === "required" ? "default" : "secondary"}
          >
            {item}
          </Badge>
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
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className={cn("size-4", iconClassName)} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <ul className="mt-2 space-y-2 text-sm leading-5 text-muted-foreground">
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
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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

function importMethodLabel(method: JobRecord["importMethod"]) {
  const labels: Record<JobRecord["importMethod"], string> = {
    job_url: "职位链接",
    manual_text: "手动粘贴 JD",
    screenshot: "截图导入",
  };

  return labels[method];
}
