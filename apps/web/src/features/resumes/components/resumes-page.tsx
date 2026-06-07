"use client";

import { Button } from "antd";
import {
  FilePlus2,
  FileText,
  Globe2,
  GraduationCap,
  MoreHorizontal,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  panelClassName,
  softPanelClassName,
} from "@/components/workbench/surface-classes";
import { cn } from "@/lib/utils";
import { useWorkbenchStore, type ResumeRecord } from "@/lib/workbench-store";

const resumeIcons = {
  education: GraduationCap,
  file: FileText,
  sparkles: Sparkles,
};

const resumeActions = [
  {
    title: "上传简历",
    description: "先导入基础 PDF 或 DOCX，再进入 AI 改写流程。",
    icon: Upload,
  },
  {
    title: "生成定向简历",
    description: "基于已选经历证据，生成面向 JD 的版本。",
    icon: FilePlus2,
  },
  {
    title: "连接外部来源",
    description: "后续接入 LinkedIn、GitHub、作品集和投递记录。",
    icon: Globe2,
  },
];

// Resume library. The main grid reads from the shared local store so onboarding
// uploads appear beside seeded generated resume artifacts.
export function ResumesPage() {
  const selectedResumeId = useWorkbenchStore((state) => state.selectedResumeId);
  const setSelectedResumeId = useWorkbenchStore(
    (state) => state.setSelectedResumeId,
  );
  const resumes = useWorkbenchStore((state) => state.resumes);

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">简历</h1>
          <p className="text-sm text-muted-foreground">
            管理已上传的基础简历、AI 生成的定向简历和导出准备度。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button htmlType="button">
            <Search data-icon="inline-start" />
            搜索
          </Button>
          <Button htmlType="button" type="primary">
            <FilePlus2 data-icon="inline-start" />
            创建简历
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {resumeActions.map((action) => (
            <Card
              key={action.title}
              className={cn(softPanelClassName, "shadow-none")}
            >
              <CardContent className="flex min-h-28 items-start gap-3 p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <action.icon aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              isSelected={selectedResumeId === resume.id}
              key={resume.id}
              onSelect={() => setSelectedResumeId(resume.id)}
              resume={resume}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResumeCard({
  isSelected,
  onSelect,
  resume,
}: {
  isSelected: boolean;
  onSelect: () => void;
  resume: ResumeRecord;
}) {
  const Icon = resumeIcons[resume.iconKey];

  return (
    <Card
      className={cn(
        panelClassName,
        "min-h-80 cursor-pointer transition hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        isSelected
          ? "border-primary/35 shadow-[0_8px_24px_rgba(29,78,216,0.09)]"
          : "",
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div
          className={cn(
            "mb-2 flex size-10 items-center justify-center rounded-xl ring-1 ring-border/50",
            resume.tone,
          )}
        >
          <Icon aria-hidden="true" />
        </div>
        <CardTitle>{resume.title}</CardTitle>
        <CardDescription>{resume.type}</CardDescription>
        <CardAction>
          <Button
            aria-label="更多操作"
            htmlType="button"
            icon={<MoreHorizontal />}
            size="small"
            type="text"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{resume.source}</p>
          <p>{resume.updated}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant={
              resume.status === "可导出" || resume.status === "已解析"
                ? "default"
                : "secondary"
            }
          >
            {resume.status}
          </Badge>
          <span className="text-sm font-semibold">
            {resume.score}% 准备度
          </span>
        </div>
        <Progress value={resume.score} />
      </CardContent>
    </Card>
  );
}
