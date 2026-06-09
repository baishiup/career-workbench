"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { Button, ProgressBar } from "@heroui/react";
import { ArrowRight, Check, FileText, Loader2, Upload } from "lucide-react";

import { OnboardingAside } from "@/features/onboarding/components/onboarding-aside";
import { emptyProfile, jobTypeOptions } from "@/features/profile/data";
import { completeOnboardingWithResume } from "@/features/resumes/api";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/lib/workbench-store";
import type { JobPreferences, ProfileDraft } from "@career-workbench/resume";

const defaultPreferences: JobPreferences = {
  jobFunction: "",
  jobTypes: ["全职"],
  location: "",
  openToRemote: true,
  workAuthorization: [],
};

export function OnboardingFlow() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addUploadedResume = useWorkbenchStore(
    (state) => state.addUploadedResume,
  );
  const completeOnboarding = useWorkbenchStore(
    (state) => state.completeOnboarding,
  );
  const completeProfileOnboarding = useAuthStore(
    (state) => state.completeProfileOnboarding,
  );
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [step, setStep] = useState<1 | 2>(1);
  const [preferences, setPreferences] =
    useState<JobPreferences>(defaultPreferences);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
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

  async function finishOnboarding(fileName?: string) {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);
    setCompletionError(null);
    const nextProfile = buildOnboardingProfile(preferences);
    completeOnboarding();

    if (fileName) {
      addUploadedResume(fileName, preferences.jobFunction);
    }

    const isComplete = await completeProfileOnboarding(nextProfile);

    if (!isComplete) {
      setCompletionError(
        "保存 onboarding 状态失败，请确认 Supabase profiles 表和 RLS 已配置。",
      );
      setIsCompleting(false);
      setIsParsing(false);
      return;
    }

    navigateTo("/jobs", { replace: true });
  }

  function finishWithoutResume() {
    void finishOnboarding();
  }

  async function confirmResumeUpload() {
    if (!resumeFile || isParsing) {
      return;
    }

    setIsParsing(true);
    setCompletionError(null);

    try {
      const result = await completeOnboardingWithResume(
        resumeFile,
        preferences,
      );
      completeOnboarding();
      addUploadedResume(result.file.name, preferences.jobFunction);
      await refreshUser();
      navigateTo("/jobs", { replace: true });
    } catch (error) {
      console.error("[complete-onboarding-with-resume error]", error);
      setCompletionError(getErrorMessage(error));
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-card text-foreground lg:grid-cols-[minmax(360px,1fr)_minmax(520px,1fr)]">
      <OnboardingAside
        title={
          step === 1
            ? "先告诉我你想找什么岗位。"
            : "最后一步，添加简历来提升匹配质量。"
        }
      />

      <section className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
        <div className="w-full max-w-[620px]">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                第 {step} / 2 步
              </p>
              <ProgressBar
                className="mt-2 w-48"
                size="sm"
                value={step === 1 ? 50 : 100}
              />
            </div>
            <Button
              isDisabled={isCompleting}
              onPress={finishWithoutResume}
              type="button"
              variant="outline"
            >
              {isCompleting ? "保存中..." : "跳过设置"}
            </Button>
          </div>

          {completionError ? (
            <p className="mb-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {completionError}
            </p>
          ) : null}

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
              isCompleting={isCompleting}
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

function buildOnboardingProfile(preferences: JobPreferences): ProfileDraft {
  return {
    ...emptyProfile,
    preferences,
    personal: {
      ...emptyProfile.personal,
      headline: preferences.jobFunction,
    },
  };
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
        <Button isDisabled={!canContinue} type="submit" variant="primary">
          下一步
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </form>
  );
}

function ResumeStep({
  fileInputRef,
  isCompleting,
  isParsing,
  onBack,
  onConfirm,
  onFileChange,
  onSkip,
  resumeFile,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isCompleting: boolean;
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
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onFileChange}
        ref={fileInputRef}
        type="file"
      />
      <div className="mt-7 w-full max-w-sm">
        <Button
          fullWidth
          onPress={() => fileInputRef.current?.click()}
          type="button"
          variant="outline"
        >
          <Upload data-icon="inline-start" />
          {resumeFile ? resumeFile.name : "上传简历"}
        </Button>
      </div>
      <p className="mt-5 text-sm font-medium text-muted-foreground">
        支持 PDF 格式，文件大小不超过 15MB。
      </p>
      <p className="mt-5 max-w-sm rounded-lg bg-success/10 px-4 py-3 text-xs font-medium leading-5 text-muted-foreground">
        当前调试模式只会调用简历解析接口，结果输出到浏览器控制台。
      </p>

      {isParsing ? (
        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary">
          <Loader2 className="size-4 animate-spin" />
          正在识别简历信息...
        </div>
      ) : null}

      <div className="mt-auto flex w-full items-center justify-between gap-3 pt-10">
        <Button onPress={onBack} type="button" variant="outline">
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Button onPress={onSkip} type="button" variant="tertiary">
            跳过
          </Button>
          <Button
            isDisabled={!resumeFile || isParsing || isCompleting}
            onPress={onConfirm}
            type="button"
            variant="primary"
          >
            {isParsing || isCompleting ? "处理中..." : "解析简历"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "简历解析失败，请查看控制台。";
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
      onPress={onClick}
      type="button"
      variant={checked ? "secondary" : "tertiary"}
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
