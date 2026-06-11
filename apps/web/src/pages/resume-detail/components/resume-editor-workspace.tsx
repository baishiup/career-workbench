"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Tabs } from "@heroui/react";
import {
  createDefaultResumeStyleConfig,
  type ResumeBlock,
  type ResumeDocument,
  type ResumePageSize,
  type ResumeSection,
  type ResumeSectionKind,
  type ResumeStyleConfig,
} from "@career-workbench/domain";
import {
  FilePenLine,
  Loader2,
  MessageSquareText,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import {
  pillTabClassName,
  pillTabIndicatorClassName,
  pillTabListClassName,
} from "@/components/workbench/surface-classes";
import { saveResumeContent } from "@/lib/resumes/api";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { cn } from "@/lib/utils";

import { ResumeAiChatTab } from "./resume-ai-chat-tab";
import { ResumeCanvasPreview } from "./resume-canvas-preview";
import { ResumeFormEditor } from "./resume-form-editor";
import { ResumeStyleEditor } from "./resume-style-editor";

type EditorTab = "editor" | "style" | "ai";

type EditorTabItem = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: EditorTab;
};

type ResumeEditorWorkspaceProps = {
  className?: string;
  onSaved?: (resume: ResumeFunctionRow) => void;
  resume: ResumeFunctionRow;
};

const tabItems: EditorTabItem[] = [
  { icon: FilePenLine, label: "editor", value: "editor" },
  { icon: SlidersHorizontal, label: "style editor", value: "style" },
  { icon: MessageSquareText, label: "AI 对话", value: "ai" },
];

function ResumeEditorWorkspace({
  className,
  onSaved,
  resume,
}: ResumeEditorWorkspaceProps) {
  const initialDocument = useMemo(
    () => normalizeResumeDocument(resume.document_json),
    [resume.document_json],
  );
  const initialStyle = useMemo(
    () => normalizeResumeStyle(resume.style_json),
    [resume.style_json],
  );
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const [draftDocument, setDraftDocument] = useState<ResumeDocument | null>(
    initialDocument,
  );
  const [draftStyle, setDraftStyle] = useState<ResumeStyleConfig>(initialStyle);
  // 最近一次写入 Supabase 的版本，用于判断 draft 是否有未保存修改。
  const [savedDocument, setSavedDocument] = useState<ResumeDocument | null>(
    initialDocument,
  );
  const [savedStyle, setSavedStyle] = useState<ResumeStyleConfig>(initialStyle);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialDocument?.sections[0]?.id ?? null,
  );

  useEffect(() => {
    setDraftDocument(initialDocument);
    setDraftStyle(initialStyle);
    setSavedDocument(initialDocument);
    setSavedStyle(initialStyle);
    setIsSaving(false);
    setSaveError(null);
    setSelectedSectionId(initialDocument?.sections[0]?.id ?? null);
  }, [initialDocument, initialStyle, resume.id]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(draftDocument) !== JSON.stringify(savedDocument) ||
      JSON.stringify(draftStyle) !== JSON.stringify(savedStyle),
    [draftDocument, draftStyle, savedDocument, savedStyle],
  );

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, [isDirty]);

  async function handleSave() {
    if (!draftDocument || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const savedRow = await saveResumeContent(resume.id, {
        document: draftDocument,
        style: draftStyle,
      });

      setSavedDocument(draftDocument);
      setSavedStyle(draftStyle);
      onSaved?.(savedRow);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "简历保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

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
    <div
      className={cn(
        "grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 xl:grid-cols-[minmax(620px,1fr)_minmax(440px,520px)]",
        className,
      )}
    >
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
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/80 px-4 py-3">
          <Tabs
            onSelectionChange={(key) => setActiveTab(String(key) as EditorTab)}
            selectedKey={activeTab}
          >
            <Tabs.ListContainer>
              <Tabs.List
                aria-label="简历编辑工具"
                className={pillTabListClassName}
              >
                {tabItems.map((item) => (
                  <Tabs.Tab
                    className={pillTabClassName}
                    id={item.value}
                    key={item.value}
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    <span>{item.label}</span>
                    <Tabs.Indicator className={pillTabIndicatorClassName} />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium",
                isDirty ? "text-amber-600" : "text-slate-400",
              )}
            >
              {isSaving ? "保存中..." : isDirty ? "有未保存修改" : "已保存"}
            </span>
            <Button
              isDisabled={!draftDocument || !isDirty || isSaving}
              onPress={() => void handleSave()}
              size="sm"
              type="button"
              variant="primary"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              保存
            </Button>
          </div>
        </div>

        {saveError ? (
          <div className="shrink-0 px-4 pt-3">
            <Alert status="danger">
              <Alert.Content>
                <Alert.Title>简历保存失败</Alert.Title>
                <Alert.Description>{saveError}</Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        ) : null}
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

const sectionKinds = new Set<ResumeSectionKind>([
  "custom",
  "education",
  "personal",
  "projects",
  "skills",
  "summary",
  "work",
]);

function normalizeResumeDocument(value: unknown): ResumeDocument | null {
  const record = asRecord(value);

  if (
    !(
      typeof record?.title === "string" &&
      typeof record.locale === "string" &&
      Array.isArray(record.sections)
    )
  ) {
    return null;
  }

  const sections = record.sections
    .map((section, index) => normalizeResumeSection(section, index))
    .filter((section): section is ResumeSection => Boolean(section));

  if (sections.length === 0) {
    return null;
  }

  return {
    ...cloneValue(record),
    locale: record.locale,
    sections,
    title: record.title,
  } as ResumeDocument;
}

function normalizeResumeSection(
  value: unknown,
  index: number,
): ResumeSection | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const rawBlocks = Array.isArray(record.blocks) ? record.blocks : [];
  const hasUsefulContent =
    typeof record.title === "string" ||
    isSectionKind(record.kind) ||
    rawBlocks.length > 0;

  if (!hasUsefulContent) {
    return null;
  }

  const kind = isSectionKind(record.kind) ? record.kind : "custom";

  return {
    blocks: rawBlocks
      .map((block, blockIndex) =>
        normalizeResumeBlock(block, index, blockIndex),
      )
      .filter((block): block is ResumeBlock => Boolean(block)),
    id: getString(record.id, `section-${index + 1}`),
    kind,
    title: getString(record.title, sectionKindFallbackTitle(kind)),
    visible: typeof record.visible === "boolean" ? record.visible : true,
  };
}

function normalizeResumeBlock(
  value: unknown,
  sectionIndex: number,
  blockIndex: number,
): ResumeBlock | null {
  const record = asRecord(value);

  if (!record || typeof record.kind !== "string") {
    return null;
  }

  const id = getString(
    record.id,
    `section-${sectionIndex + 1}-block-${blockIndex + 1}`,
  );
  const label = getOptionalString(record.label);

  if (record.kind === "text" || record.kind === "paragraph") {
    return {
      id,
      kind: record.kind,
      label,
      text: getString(record.text, ""),
    };
  }

  if (record.kind === "bulletList") {
    const items = Array.isArray(record.items) ? record.items : [];

    return {
      id,
      items: items.map((item, index) => {
        const itemRecord = asRecord(item);

        return {
          id: getString(itemRecord?.id, `${id}-item-${index + 1}`),
          text: getString(itemRecord?.text, ""),
        };
      }),
      kind: "bulletList",
      label,
    };
  }

  if (record.kind === "tagList") {
    return {
      id,
      kind: "tagList",
      label,
      tags: Array.isArray(record.tags)
        ? record.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    };
  }

  if (record.kind === "dateRange") {
    return {
      current: typeof record.current === "boolean" ? record.current : false,
      endDate: getString(record.endDate, ""),
      id,
      kind: "dateRange",
      label,
      startDate: getString(record.startDate, ""),
    };
  }

  if (record.kind === "linkList") {
    const links = Array.isArray(record.links) ? record.links : [];

    return {
      id,
      kind: "linkList",
      label,
      links: links.map((link, index) => {
        const linkRecord = asRecord(link);

        return {
          id: getString(linkRecord?.id, `${id}-link-${index + 1}`),
          label: getString(linkRecord?.label, ""),
          url: getString(linkRecord?.url, ""),
        };
      }),
    };
  }

  return null;
}

function isSectionKind(value: unknown): value is ResumeSectionKind {
  return (
    typeof value === "string" && sectionKinds.has(value as ResumeSectionKind)
  );
}

function sectionKindFallbackTitle(kind: ResumeSectionKind) {
  return kind === "personal" ? "Personal Info" : kind;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
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
      lineHeight: getNumber(
        typography?.lineHeight,
        defaults.typography.lineHeight,
      ),
    },
    spacing: {
      ...defaults.spacing,
      blockSpacing: getNumber(
        spacing?.blockSpacing,
        defaults.spacing.blockSpacing,
      ),
      itemSpacing: getNumber(
        spacing?.itemSpacing,
        defaults.spacing.itemSpacing,
      ),
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
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getPageSize(value: unknown, fallback: ResumePageSize): ResumePageSize {
  return value === "a4" || value === "letter" ? value : fallback;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

export { ResumeEditorWorkspace };
