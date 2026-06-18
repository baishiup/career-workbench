"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowLeft, Loader2, Pencil, Power, RefreshCw } from "lucide-react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { getJob, setJobActive } from "@/lib/jobs/api";
import type { JobRecord } from "@/lib/jobs/types";
import { useProfileDraft } from "@/lib/profile/use-profile-draft";
import { navigateTo } from "@/lib/router";
import {
  generateTargetJobResume,
  getLatestTargetJobResume,
} from "@/lib/resumes/api";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { hasMatchableProfile } from "@career-workbench/domain";

import { ResumeEditorDrawer } from "@/pages/resume-detail/components/resume-editor-drawer";
import { JobActionPanel } from "./components/job-action-panel";
import { JobMainCard } from "./components/job-main-card";
import { useMatchReport } from "./use-match-report";

export function JobDetailPage({ jobId }: { jobId: string }) {
  const isAdmin = useAuthStore((state) => Boolean(state.profile?.isAdmin));
  const [job, setJob] = useState<JobRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [targetJobResume, setTargetJobResume] =
    useState<ResumeFunctionRow | null>(null);
  const [openedResume, setOpenedResume] = useState<ResumeFunctionRow | null>(
    null,
  );
  const [isLoadingTargetResume, setIsLoadingTargetResume] = useState(true);
  const [targetResumeError, setTargetResumeError] = useState<string | null>(
    null,
  );
  const { profile, isLoading: isProfileLoading } = useProfileDraft();

  const canMatch = useMemo(
    () => !isProfileLoading && hasMatchableProfile(profile),
    [profile, isProfileLoading],
  );

  const matchReport = useMatchReport(jobId);
  const matchScore =
    matchReport.report?.status === "succeeded" &&
    !matchReport.isStale &&
    matchReport.report.narrative
      ? matchReport.report.narrative.matchScore
      : null;
  const canGenerateResume =
    matchReport.report?.status === "succeeded" && !matchReport.isStale;

  const handleRunAnalysis = () => {
    if (canMatch && !matchReport.isRunning) {
      setGenerateError(null);
      void matchReport.runAnalysis();
    }
  };

  const handleGenerateResume = async () => {
    setGenerateError(null);

    if (!canMatch) {
      navigateTo("/profile");
      return;
    }

    if (!canGenerateResume) {
      if (!matchReport.isRunning) {
        await matchReport.runAnalysis();
      }
      return;
    }

    setIsGeneratingResume(true);

    try {
      const result = await generateTargetJobResume(jobId);
      setTargetJobResume(result.resume);
      setOpenedResume(result.resume);

      if (result.degraded) {
        setGenerateError("AI 定制失败，已用原始简历占位，请稍后重试生成。");
      }
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : "生成定制简历失败。",
      );
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const loadJob = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await getJob(jobId);
      setJob(result.job);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "读取职位详情失败。",
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  useEffect(() => {
    let didCancel = false;

    async function loadTargetJobResume() {
      setIsLoadingTargetResume(true);
      setTargetResumeError(null);
      setTargetJobResume(null);
      setOpenedResume(null);

      try {
        const resume = await getLatestTargetJobResume(jobId);

        if (!didCancel) {
          setTargetJobResume(resume);
        }
      } catch (error) {
        if (!didCancel) {
          setTargetResumeError(
            error instanceof Error ? error.message : "读取职位定制简历失败。",
          );
        }
      } finally {
        if (!didCancel) {
          setIsLoadingTargetResume(false);
        }
      }
    }

    void loadTargetJobResume();

    return () => {
      didCancel = true;
    };
  }, [jobId]);

  if (isLoading) {
    return (
      <DetailShell>
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          正在加载职位详情…
        </div>
      </DetailShell>
    );
  }

  if (loadError) {
    return (
      <DetailShell>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位详情加载失败
        </h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        <Button
          className="mt-4 w-fit"
          onPress={() => void loadJob()}
          size="sm"
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          重试
        </Button>
      </DetailShell>
    );
  }

  if (!job) {
    return (
      <DetailShell>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          职位不存在
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          该职位可能已被停用或删除。
        </p>
      </DetailShell>
    );
  }

  const handleToggleActive = async () => {
    setIsToggling(true);
    setToggleError(null);

    try {
      const updated = await setJobActive(job.id, !job.isActive);
      setJob(updated);
    } catch (error) {
      setToggleError(
        error instanceof Error ? error.message : "切换职位状态失败。",
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900"
            href="/jobs"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回职位列表
          </Link>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Button
                onPress={() => navigateTo(`/jobs/${job.id}/edit`)}
                size="sm"
                type="button"
                variant="outline"
              >
                <Pencil className="size-4" />
                编辑职位
              </Button>
              <Button
                isDisabled={isToggling}
                onPress={() => void handleToggleActive()}
                size="sm"
                type="button"
                variant={job.isActive ? "danger-soft" : "secondary"}
              >
                {isToggling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Power className="size-4" />
                )}
                {job.isActive ? "停用职位" : "启用职位"}
              </Button>
            </div>
          ) : null}
        </div>

        {toggleError ? (
          <p className="text-sm text-red-600">{toggleError}</p>
        ) : null}

        <div className="flex flex-col items-start gap-3 xl:flex-row">
          <main className="min-w-0 flex-1">
            <JobMainCard job={job} />
          </main>

          <aside className="w-full shrink-0 xl:sticky xl:top-[68px] xl:w-[400px]">
            <JobActionPanel
              canGenerateResume={canGenerateResume}
              canRunAnalysis={canMatch}
              generateError={generateError}
              isGeneratingResume={isGeneratingResume}
              isLoadingProfile={isProfileLoading}
              isLoadingTargetResume={isLoadingTargetResume}
              job={job}
              matchReport={matchReport}
              matchScore={matchScore}
              onGenerateResume={() => void handleGenerateResume()}
              onOpenProfile={() => navigateTo("/profile")}
              onOpenResume={() => {
                if (targetJobResume) {
                  setOpenedResume(targetJobResume);
                }
              }}
              onRunAnalysis={handleRunAnalysis}
              targetResume={targetJobResume}
              targetResumeError={targetResumeError}
            />
          </aside>
        </div>
      </section>

      <ResumeEditorDrawer
        onClose={() => setOpenedResume(null)}
        open={Boolean(openedResume)}
        resume={openedResume}
      />
    </>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        href="/jobs"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回职位列表
      </Link>
      {children}
    </section>
  );
}
