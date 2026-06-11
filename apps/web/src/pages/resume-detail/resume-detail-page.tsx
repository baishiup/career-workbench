"use client";

import { useEffect, useState } from "react";
import { Alert } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import Link from "@/components/router-link";
import { getResume } from "@/lib/resumes/api";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { isSupabaseConfigured } from "@/lib/supabase";

import { ResumeEditorWorkspace } from "./components/resume-editor-workspace";

export function ResumeDetailPage({ resumeId }: { resumeId: string }) {
  const [resume, setResume] = useState<ResumeFunctionRow | null>(null);
  // 保存后单独同步标题，避免整份 resume 替换导致编辑器 draft 被重置。
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setLoadError("Supabase 环境变量未配置，无法读取简历详情。");
      return;
    }

    let didCancel = false;

    async function loadResume() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextResume = await getResume(resumeId);

        if (!didCancel) {
          setResume(nextResume);
        }
      } catch (error) {
        if (!didCancel) {
          setLoadError(
            error instanceof Error ? error.message : "简历详情读取失败。",
          );
        }
      } finally {
        if (!didCancel) {
          setIsLoading(false);
        }
      }
    }

    void loadResume();

    return () => {
      didCancel = true;
    };
  }, [resumeId]);

  return (
    <section className="mx-auto flex h-[calc(100dvh-56px)] w-full max-w-[1440px] flex-col gap-3 px-4 py-4 lg:px-6">
      <div className="flex shrink-0 flex-col gap-2">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          href="/resumes"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          返回简历列表
        </Link>

        {resume ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {savedTitle ?? resume.title}
            </h1>
            <p className="text-sm text-slate-500">
              修改后点击右侧「保存」写入 Supabase。
            </p>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm font-medium text-slate-500">
          正在读取简历详情...
        </p>
      ) : null}

      {loadError ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>简历详情不可用</Alert.Title>
            <Alert.Description>{loadError}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {resume ? (
        <ResumeEditorWorkspace
          key={resume.id}
          onSaved={(savedRow) => setSavedTitle(savedRow.title)}
          resume={resume}
        />
      ) : null}
    </section>
  );
}
