"use client";

import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { Button, Checkbox, Input, ProgressBar } from "@heroui/react";
import { ArrowRight, FileText, Loader2, Upload } from "lucide-react";

import { OnboardingAside } from "@/components/onboarding/onboarding-aside";
import { emptyProfile, jobTypeOptions } from "@/pages/profile/data";
import { completeOnboardingWithResume } from "@/lib/resumes/api";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";
import { useWorkbenchStore } from "@/lib/workbench-store";
import type { JobPreferences, ProfileDraft } from "@career-workbench/domain";

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
      setCompletionError("保存引导状态失败，请稍后重试或联系管理员。");
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
    <main className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-[minmax(360px,1fr)_minmax(520px,1fr)]">
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
              <p className="text-sm font-semibold text-blue-600">
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
            <p className="mb-5 rounded-lg bg-red-600/10 px-3 py-2 text-sm font-medium text-red-600">
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
        <Input
          fullWidth
          onChange={(event) =>
            setPreferences({
              ...preferences,
              jobFunction: event.target.value,
            })
          }
          placeholder="请输入期望岗位方向"
          value={preferences.jobFunction}
          variant="secondary"
        />
      </FieldGroup>

      <FieldGroup label="工作类型" required>
        <div className="grid gap-2 sm:grid-cols-2">
          {jobTypeOptions.map((jobType) => (
            <CheckOption
              checked={preferences.jobTypes.includes(jobType)}
              key={jobType}
              label={jobType}
              onChange={() => updateJobType(jobType)}
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
      <div className="flex size-28 items-center justify-center rounded-full bg-slate-100/70">
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
      <p className="mt-5 text-sm font-medium text-slate-500">
        支持 PDF 格式，文件大小不超过 15MB。
      </p>
      <p className="mt-5 max-w-sm rounded-lg bg-emerald-600/10 px-4 py-3 text-xs font-medium leading-5 text-slate-500">
        当前调试模式只会调用简历解析接口，结果输出到浏览器控制台。
      </p>

      {isParsing ? (
        <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-blue-600">
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
        {required ? <span className="text-red-600">*</span> : null} {label}
      </p>
      {children}
    </div>
  );
}

function CheckOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <Checkbox
      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-emerald-300"
      isSelected={checked}
      onChange={onChange}
    >
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>{label}</Checkbox.Content>
    </Checkbox>
  );
}
