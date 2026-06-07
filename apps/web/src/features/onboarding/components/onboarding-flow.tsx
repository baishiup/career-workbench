"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { Button } from "antd";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { jobTypeOptions } from "@/features/profile/data";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/lib/workbench-store";
import type { JobPreferences } from "@career-workbench/resume";

const defaultPreferences: JobPreferences = {
  jobFunction: "",
  jobTypes: ["全职"],
  location: "",
  openToRemote: true,
  workAuthorization: [],
};

// First-run setup is intentionally local-only in this MVP. The upload branch
// simulates parsing so the UI can exercise the future Supabase/Dify boundary.
export function OnboardingFlow() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addUploadedResume = useWorkbenchStore((state) => state.addUploadedResume);
  const completeOnboarding = useWorkbenchStore(
    (state) => state.completeOnboarding,
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [preferences, setPreferences] =
    useState<JobPreferences>(defaultPreferences);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  function updateJobType(jobType: string) {
    const nextJobTypes = preferences.jobTypes.includes(jobType)
      ? preferences.jobTypes.filter((item) => item !== jobType)
      : [...preferences.jobTypes, jobType];

    setPreferences({
      ...preferences,
      jobTypes: nextJobTypes.length > 0 ? nextJobTypes : [jobType],
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setResumeFile(event.target.files?.[0] ?? null);
  }

  function finishWithoutResume() {
    completeOnboarding(preferences);
    window.location.assign("/jobs");
  }

  function confirmResumeUpload() {
    if (!resumeFile || isParsing) {
      return;
    }

    setIsParsing(true);
    window.setTimeout(() => {
      completeOnboarding(preferences);
      addUploadedResume(resumeFile.name, preferences.jobFunction);
      window.location.assign("/jobs");
    }, 900);
  }

  return (
    <main className="grid min-h-screen bg-card text-foreground lg:grid-cols-[minmax(360px,1fr)_minmax(520px,1fr)]">
      <OnboardingAside step={step} />

      <section className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
        <div className="w-full max-w-[620px]">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                第 {step} / 2 步
              </p>
              <Progress className="mt-2 w-48" value={step === 1 ? 50 : 100} />
            </div>
            <Button htmlType="button" onClick={finishWithoutResume}>
              跳过设置
            </Button>
          </div>

          {step === 1 ? (
            <PreferenceStep
              onNext={() => setStep(2)}
              preferences={preferences}
              setPreferences={setPreferences}
              updateJobType={updateJobType}
            />
          ) : (
            <ResumeStep
              fileInputRef={fileInputRef}
              isParsing={isParsing}
              onBack={() => setStep(1)}
              onConfirm={confirmResumeUpload}
              onFileChange={handleFileChange}
              onSkip={finishWithoutResume}
              resumeFile={resumeFile}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function OnboardingAside({ step }: { step: 1 | 2 }) {
  return (
    <aside className="hidden min-h-screen items-center bg-[linear-gradient(135deg,#e9fff2_0%,#ecf8ff_52%,#f6fff4_100%)] px-12 lg:flex">
      <div className="max-w-xl">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full border-2 border-foreground bg-card">
            <BriefcaseBusiness className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold">Career</p>
              <span className="size-2 rounded-full bg-success" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              AI 求职工作台
            </p>
          </div>
        </div>
        <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight">
          {step === 1
            ? "先告诉我你想找什么岗位。"
            : "最后一步，添加简历来提升匹配质量。"}
        </h1>
      </div>
    </aside>
  );
}

function PreferenceStep({
  onNext,
  preferences,
  setPreferences,
  updateJobType,
}: {
  onNext: () => void;
  preferences: JobPreferences;
  setPreferences: (preferences: JobPreferences) => void;
  updateJobType: (jobType: string) => void;
}) {
  const canContinue = preferences.jobFunction.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) {
          onNext();
        }
      }}
    >
      <FieldGroup label="求职方向" required>
        <input
          className="h-11 w-full rounded-lg border border-transparent bg-muted/55 px-3 text-sm font-medium outline-none transition placeholder:text-muted-foreground/70 focus:border-ring focus:bg-card focus:ring-3 focus:ring-ring/20"
          onChange={(event) =>
            setPreferences({
              ...preferences,
              jobFunction: event.target.value,
            })
          }
          placeholder="请输入期望岗位方向"
          value={preferences.jobFunction}
        />
      </FieldGroup>

      <FieldGroup label="工作类型" required>
        <div className="grid gap-2 sm:grid-cols-2">
          {jobTypeOptions.map((jobType) => (
            <CheckOption
              checked={preferences.jobTypes.includes(jobType)}
              key={jobType}
              label={jobType}
              onClick={() => updateJobType(jobType)}
            />
          ))}
        </div>
      </FieldGroup>

      <div className="flex justify-end">
        <Button
          className="h-10 min-w-32 rounded-full"
          disabled={!canContinue}
          htmlType="submit"
          type="primary"
        >
          下一步
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </form>
  );
}

function ResumeStep({
  fileInputRef,
  isParsing,
  onBack,
  onConfirm,
  onFileChange,
  onSkip,
  resumeFile,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isParsing: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSkip: () => void;
  resumeFile: File | null;
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <div className="flex size-28 items-center justify-center rounded-full bg-muted/70">
        <FileText className="size-14" />
      </div>

      <input
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={onFileChange}
        ref={fileInputRef}
        type="file"
      />
      <Button
        className="mt-7 h-10 w-full max-w-sm rounded-full"
        htmlType="button"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload data-icon="inline-start" />
        {resumeFile ? resumeFile.name : "上传简历"}
      </Button>
      <p className="mt-5 text-sm font-medium text-muted-foreground">
        支持 PDF 或 Word 格式，文件大小不超过 10MB。
      </p>
      <p className="mt-5 max-w-sm rounded-lg bg-success/10 px-4 py-3 text-xs font-medium leading-5 text-muted-foreground">
        当前本地 MVP 只会用简历生成资料草稿、保存基础简历，并提升岗位匹配质量。
      </p>

      {isParsing ? (
        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary">
          <Loader2 className="size-4 animate-spin" />
          正在识别简历信息...
        </div>
      ) : null}

      <div className="mt-auto flex w-full items-center justify-between gap-3 pt-10">
        <Button htmlType="button" onClick={onBack}>
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Button htmlType="button" onClick={onSkip} type="text">
            跳过
          </Button>
          <Button
            className="h-10 min-w-36 rounded-full bg-success text-success-foreground hover:bg-success/90"
            disabled={!resumeFile || isParsing}
            htmlType="button"
            onClick={onConfirm}
            type="primary"
          >
            {isParsing ? "解析中..." : "开始匹配"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">
        {required ? <span className="text-destructive">*</span> : null} {label}
      </p>
      {children}
    </div>
  );
}

function CheckOption({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(
        "flex h-11 items-center gap-2 rounded-lg bg-muted/55 px-3 text-left text-sm font-semibold transition hover:bg-muted",
        checked ? "text-foreground" : "text-secondary-foreground",
      )}
      htmlType="button"
      onClick={onClick}
      type="text"
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded border border-border bg-card",
          checked ? "border-success bg-success text-success-foreground" : "",
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
      <span>{label}</span>
    </Button>
  );
}
