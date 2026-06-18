import { Link as HeroLink } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  Grid2X2,
  Target,
  UserRound,
} from "lucide-react";

import { panelClassName } from "@/components/workbench/surface-classes";
import {
  getJobLogo,
  jobTypeLabels,
  remoteStatusLabels,
} from "@/lib/jobs/labels";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";

function JobMainCard({ job }: { job: JobRecord }) {
  const logo = getJobLogo(job.company);

  return (
    <article className={cn(panelClassName, "overflow-hidden rounded-[14px]")}>
      <header className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {job.logoUrl ? (
            <img
              alt={`${job.company} logo`}
              className="size-[52px] shrink-0 rounded-xl object-cover"
              src={job.logoUrl}
            />
          ) : (
            <div
              className={cn(
                "flex size-[52px] shrink-0 items-center justify-center rounded-xl text-[17px] font-extrabold text-white",
                logo.className,
              )}
            >
              {logo.text}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {job.sourcePlatform ? (
                <MetaBadge>{job.sourcePlatform}</MetaBadge>
              ) : null}
              {job.postedAt ? (
                <MetaBadge muted>发布于 {job.postedAt}</MetaBadge>
              ) : null}
              {!job.isActive ? <MetaBadge muted>已停用</MetaBadge> : null}
            </div>
            <h1 className="text-xl font-bold leading-[1.3] tracking-tight text-slate-900">
              {job.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {[job.company, job.companyInfo].filter(Boolean).join(" · ")}
            </p>
          </div>

          {job.sourceUrl ? (
            <HeroLink
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 no-underline shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
              href={job.sourceUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" className="size-3.5" />
              原始链接
            </HeroLink>
          ) : null}
        </div>
      </header>

      <CardSection>
        <SectionTitle icon={Grid2X2}>职位概览</SectionTitle>
        <JobFactGrid job={job} />
        {job.summary ? (
          <div className="mt-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
            <p className="text-[13px] leading-6 text-emerald-800">
              {job.summary}
            </p>
          </div>
        ) : null}
      </CardSection>

      <CardSection>
        <SectionTitle icon={FileText}>职责与要求</SectionTitle>
        <div className="grid gap-5 lg:grid-cols-2">
          <TextListBlock items={job.responsibilities} title="职责描述" />
          <TextListBlock items={job.requirements} title="任职要求" />
        </div>
      </CardSection>

      <CardSection>
        <SectionTitle icon={Target}>技能标签</SectionTitle>
        <div className="flex flex-col gap-3">
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
        </div>
      </CardSection>
    </article>
  );
}

function CardSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-100 px-5 py-[18px] sm:px-6">
      {children}
    </section>
  );
}

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <p className="mb-3.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.06em] text-slate-400">
      <Icon aria-hidden="true" className="size-[13px] text-blue-600" />
      {children}
    </p>
  );
}

function JobFactGrid({ job }: { job: JobRecord }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <JobFactItem icon={UserRound} label="地点" value={job.location} />
      <JobFactItem
        icon={Globe2}
        label="远程"
        value={remoteStatusLabels[job.remoteStatus]}
      />
      <JobFactItem
        icon={CalendarDays}
        label="类型"
        value={jobTypeLabels[job.jobType]}
      />
      <JobFactItem icon={Clock3} label="年限" value={job.yearsRequired} />
      <JobFactItem
        icon={BriefcaseBusiness}
        label="薪资"
        value={job.salaryRange ?? "未公开"}
      />
      <JobFactItem
        icon={ExternalLink}
        label="来源"
        value={job.sourcePlatform ?? "未提供"}
      />
    </div>
  );
}

function JobFactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-[13px] shrink-0 text-blue-600"
      />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[13px] font-medium text-slate-900">
          {value || "未提供"}
        </p>
      </div>
    </div>
  );
}

function TextListBlock({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold text-slate-600">{title}</p>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li
              className="flex gap-2.5 text-[13px] leading-6 text-slate-600"
              key={item}
            >
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-slate-500">暂无内容。</p>
      )}
    </div>
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
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              className={cn(
                "max-w-full break-words rounded-[7px] px-2.5 py-1 text-xs font-semibold leading-4",
                tone === "required"
                  ? "bg-blue-100 text-blue-700"
                  : "border border-slate-200 bg-slate-50 text-slate-600",
              )}
              key={item}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-[13px] text-slate-500">暂无标签。</span>
        )}
      </div>
    </div>
  );
}

function MetaBadge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-md bg-slate-50 px-2 py-0.5 text-xs font-semibold",
        muted ? "text-slate-400" : "text-slate-600",
      )}
    >
      {children}
    </span>
  );
}

export { JobMainCard };
