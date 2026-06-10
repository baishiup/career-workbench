"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Chip } from "@heroui/react";
import {
  createDefaultResumeStyleConfig,
  type ResumeDocument,
  type ResumePageSize,
  type ResumeStyleConfig,
} from "@career-workbench/domain";
import {
  ArrowLeft,
  FilePenLine,
  MessageSquareText,
  SlidersHorizontal,
} from "lucide-react";

import Link from "@/components/router-link";
import { PillTabs, type PillTabItem } from "@/components/workbench/pill-tabs";
import { getResume } from "@/lib/resumes/api";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { isSupabaseConfigured } from "@/lib/supabase";

import { ResumeAiChatTab } from "./components/resume-ai-chat-tab";
import { ResumeCanvasPreview } from "./components/resume-canvas-preview";
import { ResumeFormEditor } from "./components/resume-form-editor";
import { ResumeStyleEditor } from "./components/resume-style-editor";

type EditorTab = "editor" | "style" | "ai";

const tabItems: Array<PillTabItem<EditorTab>> = [
  { icon: FilePenLine, label: "editor", value: "editor" },
  { icon: SlidersHorizontal, label: "style editor", value: "style" },
  { icon: MessageSquareText, label: "AI 对话", value: "ai" },
];

export function ResumeDetailPage({ resumeId }: { resumeId: string }) {
  const [resume, setResume] = useState<ResumeFunctionRow | null>(null);
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
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight">
                {resume.title}
              </h1>
              <Chip color="default" size="sm" variant="soft">
                本地联动
              </Chip>
            </div>
            <p className="text-sm text-slate-500">
              当前修改只存在于页面内，离开后会丢弃，不写入 Supabase。
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

      {resume ? <ResumeEditorWorkspace key={resume.id} resume={resume} /> : null}
    </section>
  );
}

function ResumeEditorWorkspace({ resume }: { resume: ResumeFunctionRow }) {
  const initialDocument = useMemo(
    () =>
      isResumeDocument(resume.document_json)
        ? cloneValue(resume.document_json)
        : null,
    [resume.document_json],
  );
  const initialStyle = useMemo(
    () => normalizeResumeStyle(resume.style_json),
    [resume.style_json],
  );
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const [draftDocument, setDraftDocument] =
    useState<ResumeDocument | null>(initialDocument);
  const [draftStyle, setDraftStyle] = useState<ResumeStyleConfig>(initialStyle);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialDocument?.sections[0]?.id ?? null,
  );

  useEffect(() => {
    if (!draftDocument) {
      setSelectedSectionId(null);
      return;
    }

    const hasSelectedSection = draftDocument.sections.some(
      (section) => section.id === selectedSectionId,
    );

    if (!hasSelectedSection) {
      setSelectedSectionId(draftDocument.sections[0]?.id ?? null);
    }
  }, [draftDocument, selectedSectionId]);

  function handleEditWithAi(sectionId: string) {
    setSelectedSectionId(sectionId);
    setActiveTab("ai");
  }

  return (
    <div className="grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 xl:grid-cols-[minmax(620px,1fr)_minmax(440px,520px)]">
      <div className="min-h-0 overflow-hidden">
        <ResumeCanvasPreview
          document={draftDocument}
          onEditWithAi={handleEditWithAi}
          onSectionSelect={setSelectedSectionId}
          selectedSectionId={selectedSectionId}
          style={draftStyle}
        />
      </div>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="shrink-0 border-b border-slate-200 bg-slate-100/80 px-4 py-3">
          <PillTabs
            activeValue={activeTab}
            items={tabItems}
            onValueChange={setActiveTab}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {activeTab === "editor" ? (
            draftDocument ? (
              <ResumeFormEditor
                document={draftDocument}
                onDocumentChange={setDraftDocument}
                onSectionFocus={setSelectedSectionId}
                selectedSectionId={selectedSectionId}
              />
            ) : (
              <InvalidDocumentAlert />
            )
          ) : null}

          {activeTab === "style" ? (
            <ResumeStyleEditor
              onStyleChange={setDraftStyle}
              style={draftStyle}
            />
          ) : null}

          {activeTab === "ai" ? <ResumeAiChatTab /> : null}
        </div>
      </aside>
    </div>
  );
}

function InvalidDocumentAlert() {
  return (
    <Alert status="danger">
      <Alert.Content>
        <Alert.Title>这份简历缺少可编辑正文</Alert.Title>
        <Alert.Description>
          当前 document_json 不是有效的 ResumeDocument，无法进入 Form Editor。
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

function isResumeDocument(value: unknown): value is ResumeDocument {
  const record = asRecord(value);

  return (
    typeof record?.title === "string" &&
    typeof record.locale === "string" &&
    Array.isArray(record.sections)
  );
}

function normalizeResumeStyle(value: unknown): ResumeStyleConfig {
  const defaults = createDefaultResumeStyleConfig();
  const record = asRecord(value);
  const colors = asRecord(record?.colors);
  const typography = asRecord(record?.typography);
  const spacing = asRecord(record?.spacing);
  const pageMargin = asRecord(spacing?.pageMargin);

  return {
    ...defaults,
    templateId: getString(record?.templateId, defaults.templateId),
    pageSize: getPageSize(record?.pageSize, defaults.pageSize),
    colors: {
      ...defaults.colors,
      accent: getString(colors?.accent, defaults.colors.accent),
      background: getString(colors?.background, defaults.colors.background),
      border: getString(colors?.border, defaults.colors.border),
      mutedText: getString(colors?.mutedText, defaults.colors.mutedText),
      text: getString(colors?.text, defaults.colors.text),
    },
    typography: {
      ...defaults.typography,
      baseFontSize: getNumber(
        typography?.baseFontSize,
        defaults.typography.baseFontSize,
      ),
      fontFamily: getString(
        typography?.fontFamily,
        defaults.typography.fontFamily,
      ),
      headingFontSize: getNumber(
        typography?.headingFontSize,
        defaults.typography.headingFontSize,
      ),
      lineHeight: getNumber(typography?.lineHeight, defaults.typography.lineHeight),
    },
    spacing: {
      ...defaults.spacing,
      blockSpacing: getNumber(spacing?.blockSpacing, defaults.spacing.blockSpacing),
      itemSpacing: getNumber(spacing?.itemSpacing, defaults.spacing.itemSpacing),
      pageMargin: {
        ...defaults.spacing.pageMargin,
        bottom: getNumber(
          pageMargin?.bottom,
          defaults.spacing.pageMargin.bottom,
        ),
        left: getNumber(pageMargin?.left, defaults.spacing.pageMargin.left),
        right: getNumber(pageMargin?.right, defaults.spacing.pageMargin.right),
        top: getNumber(pageMargin?.top, defaults.spacing.pageMargin.top),
      },
      sectionSpacing: getNumber(
        spacing?.sectionSpacing,
        defaults.spacing.sectionSpacing,
      ),
    },
  };
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getPageSize(value: unknown, fallback: ResumePageSize): ResumePageSize {
  return value === "a4" || value === "letter" ? value : fallback;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}
