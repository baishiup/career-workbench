"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Tabs } from "@heroui/react";
import {
  acceptResumePatch,
  applyResumePatch,
  coerceRichText,
  createDefaultResumeStyleConfig,
  createResumeStyleFromTemplate,
  createResumeChangeLogFromPatchDecision,
  rejectResumePatch,
  type ResumeChangeLogEntry,
  type CustomModule,
  type EducationItem,
  type JobPreferences,
  type PersonalInfo,
  type ProjectItem,
  type ResumeDocument,
  type ResumeModule,
  type ResumePatch,
  type ResumeStyleConfig,
  type WorkItem,
} from "@career-workbench/domain";
import {
  FilePenLine,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";

import { saveResumeContent } from "@/lib/resumes/api";
import { generateResumePatch } from "@/lib/resumes/resume-ai-provider";
import type { ResumeFunctionRow } from "@/lib/resumes/types";
import { cn } from "@/lib/utils";
import {
  ResumeAiChatPanel,
  type ResumeAiComposerContext,
  type ResumeChatMessage,
} from "@/components/resume-ai-chat";
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
  previewSurface?: "canvas" | "flush";
  resume: ResumeFunctionRow;
};

const tabItems: EditorTabItem[] = [
  { icon: FilePenLine, label: "内容", value: "editor" },
  { icon: SlidersHorizontal, label: "样式", value: "style" },
  { icon: MessageSquareText, label: "AI 助手", value: "ai" },
];

function ResumeEditorWorkspace({
  className,
  onSaved,
  previewSurface = "canvas",
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
    initialDocument?.modules[0]?.id ?? null,
  );
  const [sectionFocusSignal, setSectionFocusSignal] = useState(0);
  const [showAiDiff, setShowAiDiff] = useState(false);
  const [chatMessages, setChatMessages] = useState<ResumeChatMessage[]>([]);
  const [patches, setPatches] = useState<ResumePatch[]>([]);
  const [changeLogs, setChangeLogs] = useState<ResumeChangeLogEntry[]>([]);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [aiComposerContext, setAiComposerContext] =
    useState<ResumeAiComposerContext | null>(null);
  const [acceptedUnsavedPatch, setAcceptedUnsavedPatch] =
    useState<ResumePatch | null>(null);
  const editorScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftDocument(initialDocument);
    setDraftStyle(initialStyle);
    setSavedDocument(initialDocument);
    setSavedStyle(initialStyle);
    setIsSaving(false);
    setSaveError(null);
    setSelectedSectionId(initialDocument?.modules[0]?.id ?? null);
    setShowAiDiff(false);
    setChatMessages([]);
    setPatches([]);
    setChangeLogs([]);
    setIsAiRunning(false);
    setAiError(null);
    setAiConversationId(null);
    setAiComposerContext(null);
    setAcceptedUnsavedPatch(null);
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
      setAcceptedUnsavedPatch(null);
      onSaved?.(savedRow);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "简历保存失败。");
    } finally {
      setIsSaving(false);
    }
  }

  function handleRestoreUnsavedChanges() {
    if (!isDirty || isSaving) {
      return;
    }

    setDraftDocument(savedDocument);
    setDraftStyle(savedStyle);
    setSaveError(null);
    setSelectedSectionId(savedDocument?.modules[0]?.id ?? null);
    setAiConversationId(null);
    setAiComposerContext(null);
    setAcceptedUnsavedPatch(null);
  }

  useEffect(() => {
    if (!draftDocument) {
      setSelectedSectionId(null);
      return;
    }

    const hasSelectedSection = draftDocument.modules.some(
      (module) => module.id === selectedSectionId,
    );

    if (!hasSelectedSection) {
      setSelectedSectionId(draftDocument.modules[0]?.id ?? null);
    }
  }, [draftDocument, selectedSectionId]);

  function handleEditWithAi(sectionId: string) {
    const module = draftDocument?.modules.find((item) => item.id === sectionId);

    setSelectedSectionId(sectionId);
    setAiComposerContext(
      module
        ? {
            label: getResumeModuleContextLabel(module),
            moduleId: module.id,
          }
        : null,
    );
    setSectionFocusSignal((current) => current + 1);
    setActiveTab("ai");
  }

  function handleSectionSelect(sectionId: string) {
    setActiveTab("editor");
    setSelectedSectionId(sectionId);
    setSectionFocusSignal((current) => current + 1);
  }

  const pendingPatch = useMemo(
    () => patches.find((patch) => patch.status === "pending") ?? null,
    [patches],
  );
  const previewPatch = pendingPatch ?? acceptedUnsavedPatch;

  async function handleSendAiPrompt(prompt: string) {
    if (!draftDocument || pendingPatch || isAiRunning) {
      return;
    }

    const composerContext = aiComposerContext;
    const userMessage: ResumeChatMessage = {
      createdAt: new Date().toISOString(),
      id: createClientId("chat-user"),
      parts: [
        ...(composerContext
          ? [
              {
                context: composerContext,
                type: "resume-module-context" as const,
              },
            ]
          : []),
        { text: prompt, type: "text" },
      ],
      role: "user",
      status: "sent",
    };

    setChatMessages((current) => [...current, userMessage]);
    setAiComposerContext(null);
    setIsAiRunning(true);
    setAiError(null);

    try {
      const result = await generateResumePatch({
        conversationId: aiConversationId,
        document: draftDocument,
        prompt,
        resumeId: resume.id,
        selectedModuleId: composerContext?.moduleId ?? selectedSectionId,
      });
      const patch = result.patch;
      const assistantMessage: ResumeChatMessage = {
        createdAt: new Date().toISOString(),
        id: createClientId("chat-assistant"),
        parts: [
          { text: result.message, type: "text" },
          ...(patch ? [{ patch, type: "resume-patch" as const }] : []),
        ],
        role: "assistant",
        status: "sent",
      };

      setAiConversationId(result.conversationId);
      if (patch) {
        setPatches((current) => [...current, patch]);
        setChangeLogs((current) => [
          createResumeChangeLogFromPatchDecision({
            action: "suggested",
            patch,
            resumeId: resume.id,
          }),
          ...current,
        ]);
        setShowAiDiff(true);
      }
      setChatMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI 修改建议生成失败。";

      setAiError(message);
      setChatMessages((current) => [
        ...current,
        {
          createdAt: new Date().toISOString(),
          id: createClientId("chat-error"),
          parts: [{ text: message, type: "text" }],
          role: "assistant",
          status: "failed",
        },
      ]);
    } finally {
      setIsAiRunning(false);
    }
  }

  function handleAcceptPatch(patch: ResumePatch) {
    if (!draftDocument) {
      return;
    }

    const result = applyResumePatch(draftDocument, patch);

    if (!result.ok) {
      setAiError(result.reason);
      return;
    }

    const accepted = acceptResumePatch(patch);

    setDraftDocument(result.document);
    setAcceptedUnsavedPatch(accepted);
    setPatches((current) =>
      current.map((item) => (item.id === patch.id ? accepted : item)),
    );
    setChatMessages((current) => replacePatchInMessages(current, accepted));
    setChangeLogs((current) => [
      createResumeChangeLogFromPatchDecision({
        action: "accepted",
        patch: accepted,
        resumeId: resume.id,
      }),
      ...current,
    ]);
    setAiError(null);
  }

  function handleRejectPatch(patch: ResumePatch) {
    const rejected = rejectResumePatch(patch);

    setPatches((current) =>
      current.map((item) => (item.id === patch.id ? rejected : item)),
    );
    setChatMessages((current) => replacePatchInMessages(current, rejected));
    setChangeLogs((current) => [
      createResumeChangeLogFromPatchDecision({
        action: "rejected",
        patch: rejected,
        resumeId: resume.id,
      }),
      ...current,
    ]);
    setAiError(null);
  }

  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(620px,1fr)_minmax(440px,520px)]",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <ResumeCanvasPreview
          document={draftDocument}
          onDiffModeChange={setShowAiDiff}
          onEditWithAi={handleEditWithAi}
          onSectionSelect={handleSectionSelect}
          patch={previewPatch}
          showDiff={showAiDiff}
          surface={previewSurface}
          style={draftStyle}
        />
      </div>

      <aside className="flex min-h-0 flex-col overflow-hidden bg-white">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3 py-2.5">
          <Tabs
            className="min-w-0 flex-1"
            onSelectionChange={(key) => setActiveTab(String(key) as EditorTab)}
            selectedKey={activeTab}
          >
            <Tabs.ListContainer className="w-full">
              <Tabs.List
                aria-label="简历编辑工具"
                className="flex w-full gap-1 rounded-[10px] bg-slate-100 p-[3px]"
              >
                {tabItems.map((item) => (
                  <Tabs.Tab
                    className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold leading-5 text-slate-500 hover:text-slate-900 data-[selected=true]:text-blue-600"
                    id={item.value}
                    key={item.value}
                  >
                    <item.icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    <Tabs.Indicator className="rounded-lg bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12)]" />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              className="h-8 w-[76px] justify-center rounded-lg"
              isDisabled={!draftDocument || !isDirty || isSaving}
              onPress={handleRestoreUnsavedChanges}
              size="sm"
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              还原
            </Button>
            <Button
              className="h-8 w-[84px] justify-center rounded-lg"
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
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            ref={editorScrollRef}
            className={cn(
              "h-full overflow-y-auto p-4",
              activeTab !== "editor" && "hidden",
            )}
          >
            {draftDocument ? (
              <>
                {pendingPatch ? (
                  <Alert className="mb-3" status="warning">
                    <Alert.Content>
                      <Alert.Title>内容暂时只读</Alert.Title>
                      <Alert.Description>
                        当前有 AI
                        修改建议待处理。请先采纳或拒绝，再继续手动编辑简历内容。
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}
                <div
                  className={cn(
                    pendingPatch &&
                      "pointer-events-none select-text opacity-70",
                  )}
                >
                  <ResumeFormEditor
                    document={draftDocument}
                    onDocumentChange={setDraftDocument}
                    sectionFocusSignal={sectionFocusSignal}
                    onSectionFocus={handleSectionSelect}
                    selectedSectionId={selectedSectionId}
                    scrollContainerRef={editorScrollRef}
                  />
                </div>
              </>
            ) : (
              <InvalidDocumentAlert />
            )}
          </div>

          <div
            className={cn(
              "h-full overflow-y-auto p-4",
              activeTab !== "style" && "hidden",
            )}
          >
            <ResumeStyleEditor
              onStyleChange={setDraftStyle}
              style={draftStyle}
            />
          </div>

          <div
            className={cn(
              "h-full overflow-hidden p-4",
              activeTab !== "ai" && "hidden",
            )}
          >
            {draftDocument ? (
              <ResumeAiChatPanel
                changeLogs={changeLogs}
                composerContext={aiComposerContext}
                error={aiError}
                isRunning={isAiRunning}
                messages={chatMessages}
                onAcceptPatch={handleAcceptPatch}
                onClearComposerContext={() => setAiComposerContext(null)}
                onRejectPatch={handleRejectPatch}
                onSendPrompt={(prompt) => void handleSendAiPrompt(prompt)}
                pendingPatch={pendingPatch}
              />
            ) : (
              <InvalidDocumentAlert />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function createClientId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getResumeModuleContextLabel(module: ResumeModule) {
  switch (module.kind) {
    case "personal":
      return ["个人信息", module.personal.fullName, module.personal.headline]
        .filter(Boolean)
        .join(" · ");
    case "skills":
      return "技能";
    case "work": {
      const first = module.items[0];
      return ["工作经历", first?.company, first?.title]
        .filter(Boolean)
        .join(" · ");
    }
    case "projects": {
      const first = module.items[0];
      return ["项目经历", first?.name, first?.role].filter(Boolean).join(" · ");
    }
    case "education": {
      const first = module.items[0];
      return ["教育背景", first?.school, first?.degree]
        .filter(Boolean)
        .join(" · ");
    }
    case "preferences":
      return "求职方向";
    case "custom":
      return ["自定义模块", module.module.name].filter(Boolean).join(" · ");
    default:
      return "简历模块";
  }
}

function replacePatchInMessages(
  messages: ResumeChatMessage[],
  patch: ResumePatch,
): ResumeChatMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      part.type === "resume-patch" && part.patch.id === patch.id
        ? { patch, type: "resume-patch" as const }
        : part,
    ),
  }));
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

const moduleKinds = new Set<ResumeModule["kind"]>([
  "personal",
  "preferences",
  "education",
  "work",
  "projects",
  "skills",
  "custom",
]);

function normalizeResumeDocument(value: unknown): ResumeDocument | null {
  const record = asRecord(value);

  if (!record || typeof record.title !== "string") {
    return null;
  }

  let modules: ResumeModule[];

  if (Array.isArray(record.modules)) {
    modules = record.modules
      .map((module, index) => normalizeResumeModule(module, index))
      .filter((module): module is ResumeModule => Boolean(module));
  } else if (Array.isArray(record.sections)) {
    // 旧版 section/block 文档：内容保真迁移到模块（无法重建的结构化条目降级为自定义模块）。
    modules = migrateLegacySections(record.sections);
  } else {
    return null;
  }

  if (modules.length === 0) {
    return null;
  }

  const base = cloneValue(record);
  delete (base as Record<string, unknown>).sections;

  return {
    ...base,
    modules,
    title: record.title,
  } as ResumeDocument;
}

/** 把旧版 section/block 文档迁移成模块，尽量保留内容。 */
function migrateLegacySections(sections: unknown[]): ResumeModule[] {
  return sections
    .map((section, index): ResumeModule | null => {
      const record = asRecord(section);

      if (!record) {
        return null;
      }

      const id = getString(record.id, `module-${index + 1}`);
      const visible =
        typeof record.visible === "boolean" ? record.visible : true;
      const blocks = toArray(record.blocks);

      if (record.kind === "personal") {
        return {
          id,
          kind: "personal",
          personal: legacyPersonal(blocks),
          visible,
        };
      }

      if (record.kind === "skills") {
        return { id, kind: "skills", skills: legacySkills(blocks), visible };
      }

      return {
        id,
        kind: "custom",
        module: {
          content: legacyBlocksToRichText(blocks),
          id: `${id}-content`,
          name: getString(record.title, "模块"),
        },
        visible,
      };
    })
    .filter((module): module is ResumeModule => Boolean(module));
}

function legacyPersonal(blocks: unknown[]): PersonalInfo {
  const personal: PersonalInfo = {
    avatarUrl: "",
    city: "",
    customFields: [],
    email: "",
    fullName: "",
    github: "",
    headline: "",
    linkedin: "",
    phone: "",
    portfolio: "",
  };

  for (const block of blocks) {
    const record = rec(block);

    if (record.kind === "text" || record.kind === "paragraph") {
      const text = getStringValue(record.text);

      if (!personal.fullName) {
        personal.fullName = text;
      } else if (!personal.headline) {
        personal.headline = text;
      }
      continue;
    }

    if (record.kind === "linkList") {
      for (const link of toArray(record.links)) {
        const linkRecord = rec(link);
        const label = getStringValue(linkRecord.label);
        const url = getStringValue(linkRecord.url);
        const lowered = label.toLowerCase();

        if (/邮箱|email/.test(lowered)) {
          personal.email = url;
        } else if (/电话|phone/.test(lowered)) {
          personal.phone = url;
        } else if (lowered.includes("linkedin")) {
          personal.linkedin = url;
        } else if (lowered.includes("github")) {
          personal.github = url;
        } else if (/portfolio|作品/.test(lowered)) {
          personal.portfolio = url;
        } else if (url) {
          personal.customFields.push({
            id: `custom-${personal.customFields.length + 1}`,
            label: label || "Link",
            value: url,
          });
        }
      }
    }
  }

  return personal;
}

function legacySkills(blocks: unknown[]): string[] {
  const skills: string[] = [];

  for (const block of blocks) {
    const record = rec(block);

    if (record.kind === "tagList") {
      skills.push(...toStringArray(record.tags));
    }
  }

  return skills;
}

function legacyBlocksToRichText(blocks: unknown[]) {
  const ops: { attributes?: Record<string, unknown>; insert: string }[] = [];

  for (const block of blocks) {
    const record = rec(block);

    if (record.kind === "text" || record.kind === "paragraph") {
      const text = getStringValue(record.text);
      if (text) {
        ops.push({ insert: `${text}\n` });
      }
    } else if (record.kind === "bulletList") {
      for (const item of toArray(record.items)) {
        const text = getStringValue(rec(item).text);
        if (text) {
          ops.push({ insert: text });
          ops.push({ attributes: { list: "bullet" }, insert: "\n" });
        }
      }
    } else if (record.kind === "tagList") {
      const tags = toStringArray(record.tags);
      if (tags.length > 0) {
        ops.push({ insert: `${tags.join(" · ")}\n` });
      }
    } else if (record.kind === "dateRange") {
      const end = record.current ? "至今" : getStringValue(record.endDate);
      const range = [getStringValue(record.startDate), end]
        .filter(Boolean)
        .join(" - ");
      if (range) {
        ops.push({ insert: `${range}\n` });
      }
    } else if (record.kind === "linkList") {
      for (const link of toArray(record.links)) {
        const linkRecord = rec(link);
        const label = getStringValue(linkRecord.label);
        const url = getStringValue(linkRecord.url);
        if (url) {
          ops.push({ insert: `${label ? `${label}: ` : ""}${url}\n` });
        }
      }
    }
  }

  if (ops.length === 0) {
    ops.push({ insert: "\n" });
  }

  return coerceRichText({ ops });
}

function normalizeResumeModule(
  value: unknown,
  index: number,
): ResumeModule | null {
  const record = asRecord(value);

  if (
    !record ||
    typeof record.kind !== "string" ||
    !moduleKinds.has(record.kind as ResumeModule["kind"])
  ) {
    return null;
  }

  const id = getString(record.id, `module-${index + 1}`);
  const visible = typeof record.visible === "boolean" ? record.visible : true;

  switch (record.kind as ResumeModule["kind"]) {
    case "personal":
      return {
        id,
        kind: "personal",
        personal: normalizePersonal(record.personal),
        visible,
      };
    case "preferences":
      return {
        id,
        kind: "preferences",
        preferences: normalizePreferences(record.preferences),
        visible,
      };
    case "education":
      return {
        id,
        items: toArray(record.items).map(normalizeEducation),
        kind: "education",
        visible,
      };
    case "work":
      return {
        id,
        items: toArray(record.items).map(normalizeWork),
        kind: "work",
        visible,
      };
    case "projects":
      return {
        id,
        items: toArray(record.items).map(normalizeProject),
        kind: "projects",
        visible,
      };
    case "skills":
      return {
        id,
        kind: "skills",
        skills: toStringArray(record.skills),
        visible,
      };
    case "custom":
      return {
        id,
        kind: "custom",
        module: normalizeCustom(record.module, id),
        visible,
      };
    default:
      return null;
  }
}

function normalizePersonal(value: unknown): PersonalInfo {
  const record = asRecord(value) ?? {};

  return {
    avatarUrl: getStringValue(record.avatarUrl),
    city: getStringValue(record.city),
    customFields: toCustomFields(record.customFields),
    email: getStringValue(record.email),
    fullName: getStringValue(record.fullName),
    github: getStringValue(record.github),
    headline: getStringValue(record.headline),
    linkedin: getStringValue(record.linkedin),
    phone: getStringValue(record.phone),
    portfolio: getStringValue(record.portfolio),
  };
}

function normalizePreferences(value: unknown): JobPreferences {
  const record = asRecord(value) ?? {};

  return {
    customFields: toCustomFields(record.customFields),
    jobFunction: getStringValue(record.jobFunction),
    jobTypes: toStringArray(record.jobTypes),
    openToRemote:
      typeof record.openToRemote === "boolean" ? record.openToRemote : true,
    salaryExpectation: getStringValue(record.salaryExpectation),
    targetCity: getStringValue(record.targetCity),
  };
}

function normalizeEducation(value: unknown, index: number): EducationItem {
  const record = asRecord(value) ?? {};

  return {
    current: getBool(record.current),
    degree: getStringValue(record.degree),
    description: coerceRichText(record.description),
    endDate: getStringValue(record.endDate),
    id: getString(record.id, `edu-${index + 1}`),
    major: getStringValue(record.major),
    school: getStringValue(record.school),
    startDate: getStringValue(record.startDate),
  };
}

function normalizeWork(value: unknown, index: number): WorkItem {
  const record = asRecord(value) ?? {};

  return {
    company: getStringValue(record.company),
    current: getBool(record.current),
    description: coerceRichText(record.description),
    endDate: getStringValue(record.endDate),
    id: getString(record.id, `work-${index + 1}`),
    skills: toStringArray(record.skills),
    startDate: getStringValue(record.startDate),
    title: getStringValue(record.title),
  };
}

function normalizeProject(value: unknown, index: number): ProjectItem {
  const record = asRecord(value) ?? {};

  return {
    current: getBool(record.current),
    description: coerceRichText(record.description),
    endDate: getStringValue(record.endDate),
    id: getString(record.id, `project-${index + 1}`),
    name: getStringValue(record.name),
    role: getStringValue(record.role),
    skills: toStringArray(record.skills),
    startDate: getStringValue(record.startDate),
  };
}

function normalizeCustom(value: unknown, fallbackId: string): CustomModule {
  const record = asRecord(value) ?? {};

  return {
    content: coerceRichText(record.content),
    id: getString(record.id, `${fallbackId}-content`),
    name: getStringValue(record.name),
  };
}

function toCustomFields(value: unknown) {
  return toArray(value).map((field, index) => {
    const record = asRecord(field) ?? {};

    return {
      id: getString(record.id, `custom-field-${index + 1}`),
      label: getStringValue(record.label),
      value: getStringValue(record.value),
    };
  });
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: unknown): string[] {
  return toArray(value).filter(
    (item): item is string => typeof item === "string",
  );
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getBool(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function normalizeResumeStyle(value: unknown): ResumeStyleConfig {
  const defaults = createDefaultResumeStyleConfig();
  const record = asRecord(value);
  return createResumeStyleFromTemplate(
    getString(record?.templateId, defaults.templateId),
  );
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function rec(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

export { ResumeEditorWorkspace };
