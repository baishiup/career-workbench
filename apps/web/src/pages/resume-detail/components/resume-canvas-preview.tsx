"use client";

import { useMemo, useState } from "react";
import { Button, Checkbox, Modal, useOverlayState } from "@heroui/react";
import type {
  EducationItem,
  PersonalInfo,
  ProjectItem,
  ResumeDocument,
  ResumeModule,
  ResumePatch,
  ResumePatchDiff,
  ResumePatchFieldDiff,
  ResumeStyleConfig,
  WorkItem,
} from "@career-workbench/domain";
import {
  deriveResumePatchDiff,
  richTextToPlainText,
} from "@career-workbench/domain";
import {
  Code2,
  Globe,
  Link2,
  type LucideIcon,
  Mail,
  MapPin,
  Phone,
  WandSparkles,
} from "lucide-react";

import { RichTextView } from "@/components/rich-text/rich-text-view";
import { cn } from "@/lib/utils";

type ResumeCanvasPreviewProps = {
  document: ResumeDocument | null;
  onDiffModeChange?: (showDiff: boolean) => void;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  patch?: ResumePatch | null;
  showDiff?: boolean;
  surface?: "canvas" | "flush";
  style: ResumeStyleConfig;
};

type PreviewSurface = "page" | "panel";

const a4PageSize = { height: 1123, width: 794 };

const moduleTitles: Record<ResumeModule["kind"], string> = {
  custom: "自定义",
  education: "教育背景",
  personal: "个人信息",
  preferences: "求职方向",
  projects: "项目经历",
  skills: "技能",
  work: "工作经历",
};

function ResumeCanvasPreview({
  document,
  onDiffModeChange,
  onEditWithAi,
  onSectionSelect,
  patch = null,
  showDiff = false,
  surface = "canvas",
  style,
}: ResumeCanvasPreviewProps) {
  const [compareDiff, setCompareDiff] = useState<ResumePatchFieldDiff | null>(
    null,
  );
  const patchDiffs = useMemo(
    () => (patch ? deriveResumePatchDiff(patch) : []),
    [patch],
  );

  if (!document) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm font-medium text-slate-500">
        这份简历缺少可编辑正文。
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col items-center overflow-auto px-8 py-5",
        surface === "canvas" ? "rounded-xl bg-[#eef1f6]" : "bg-[#eef1f6]",
      )}
    >
      {patch ? (
        <div className="mb-3 flex w-full max-w-[794px] items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">
              {patch.status === "pending"
                ? "AI 建议预览"
                : "AI 已修改，尚未保存"}
            </p>
            <p className="truncate text-[11px] text-slate-500">{patch.title}</p>
          </div>
          <Checkbox isSelected={showDiff} onChange={onDiffModeChange}>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>显示 Diff</Checkbox.Content>
          </Checkbox>
        </div>
      ) : null}

      <article
        className={cn(
          "relative mx-auto max-w-full shrink-0 overflow-visible bg-white",
          surface === "canvas" &&
            "rounded-[3px] border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_50px_rgba(15,23,42,0.13)]",
        )}
        style={{
          background: style.colors.background,
          color: style.colors.text,
          fontFamily: style.typography.fontFamily,
          fontSize: style.typography.baseFontSize,
          lineHeight: style.typography.lineHeight,
          minHeight: a4PageSize.height,
          width: a4PageSize.width,
        }}
      >
        <TemplateLayout
          document={document}
          onCompare={setCompareDiff}
          onEditWithAi={onEditWithAi}
          onSectionSelect={onSectionSelect}
          patch={patch}
          patchDiffs={patchDiffs}
          showDiff={showDiff}
          style={style}
        />
      </article>

      {compareDiff ? (
        <CompareOverlay
          diff={compareDiff}
          onClose={() => setCompareDiff(null)}
        />
      ) : null}
    </div>
  );
}

function TemplateLayout({
  document,
  onCompare,
  onEditWithAi,
  onSectionSelect,
  patch,
  patchDiffs,
  showDiff,
  style,
}: {
  document: ResumeDocument;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  patch: ResumePatch | null;
  patchDiffs: ResumePatchDiff[];
  showDiff: boolean;
  style: ResumeStyleConfig;
}) {
  const modules = applyPatchPreviewModules(document.modules, patch).filter(
    (module) => module.visible,
  );

  if (style.layout.kind === "sidebar-left") {
    const layout = style.layout;
    const sidebarModules = modules.filter((module) =>
      layout.sidebarModuleKinds.includes(module.kind),
    );
    const mainModules = modules.filter(
      (module) => !layout.sidebarModuleKinds.includes(module.kind),
    );

    return (
      <div
        className="grid min-h-[1123px]"
        style={{
          gridTemplateColumns: `${layout.sidebarWidth}px 1fr`,
        }}
      >
        <aside
          className="flex flex-col"
          style={{
            background: style.colors.panelBackground,
            color: style.colors.panelText,
            gap: style.spacing.sectionSpacing,
            padding: `${style.spacing.pageMargin.top}px 24px ${style.spacing.pageMargin.bottom}px`,
          }}
        >
          <ModuleList
            modules={sidebarModules}
            onCompare={onCompare}
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
            patchDiffs={patchDiffs}
            showDiff={showDiff}
            style={style}
            surface="panel"
          />
        </aside>
        <main
          className="flex flex-col"
          style={{
            gap: style.spacing.sectionSpacing,
            padding: `${style.spacing.pageMargin.top}px ${style.spacing.pageMargin.right}px ${style.spacing.pageMargin.bottom}px ${style.spacing.pageMargin.left}px`,
          }}
        >
          <ModuleList
            modules={mainModules}
            onCompare={onCompare}
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
            patchDiffs={patchDiffs}
            showDiff={showDiff}
            style={style}
            surface="page"
          />
        </main>
      </div>
    );
  }

  if (style.layout.kind === "header-band") {
    const layout = style.layout;
    const headerModules = modules.filter((module) =>
      layout.headerModuleKinds.includes(module.kind),
    );
    const bodyModules = modules.filter(
      (module) => !layout.headerModuleKinds.includes(module.kind),
    );

    return (
      <div className="min-h-[1123px]">
        <header
          className="flex flex-col"
          style={{
            background: style.colors.panelBackground,
            color: style.colors.panelText,
            gap: style.spacing.blockSpacing,
            padding: `${style.spacing.pageMargin.top}px ${style.spacing.pageMargin.right}px 26px ${style.spacing.pageMargin.left}px`,
          }}
        >
          <ModuleList
            modules={headerModules}
            onCompare={onCompare}
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
            patchDiffs={patchDiffs}
            showDiff={showDiff}
            style={style}
            surface="panel"
          />
        </header>
        <main
          className="flex flex-col"
          style={{
            gap: style.spacing.sectionSpacing,
            padding: `28px ${style.spacing.pageMargin.right}px ${style.spacing.pageMargin.bottom}px ${style.spacing.pageMargin.left}px`,
          }}
        >
          <ModuleList
            modules={bodyModules}
            onCompare={onCompare}
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
            patchDiffs={patchDiffs}
            showDiff={showDiff}
            style={style}
            surface="page"
          />
        </main>
      </div>
    );
  }

  return (
    <main
      className="flex min-h-[1123px] flex-col"
      style={{
        gap: style.spacing.sectionSpacing,
        padding: `${style.spacing.pageMargin.top}px ${style.spacing.pageMargin.right}px ${style.spacing.pageMargin.bottom}px ${style.spacing.pageMargin.left}px`,
      }}
    >
      <ModuleList
        modules={modules}
        onCompare={onCompare}
        onEditWithAi={onEditWithAi}
        onSectionSelect={onSectionSelect}
        patchDiffs={patchDiffs}
        showDiff={showDiff}
        style={style}
        surface="page"
      />
    </main>
  );
}

function ModuleList({
  modules,
  onCompare,
  onEditWithAi,
  onSectionSelect,
  patchDiffs,
  showDiff,
  style,
  surface,
}: {
  modules: ResumeModule[];
  onCompare: (diff: ResumePatchFieldDiff) => void;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  patchDiffs: ResumePatchDiff[];
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  return (
    <>
      {modules.map((module) => (
        <PreviewModule
          key={module.id}
          module={module}
          onCompare={onCompare}
          onEditWithAi={onEditWithAi}
          onSectionSelect={onSectionSelect}
          patchDiff={patchDiffs.find((diff) => diff.moduleId === module.id)}
          showDiff={showDiff}
          style={style}
          surface={surface}
        />
      ))}
    </>
  );
}

function PreviewModule({
  module,
  onCompare,
  onEditWithAi,
  onSectionSelect,
  patchDiff,
  showDiff,
  style,
  surface,
}: {
  module: ResumeModule;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  patchDiff?: ResumePatchDiff;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const title =
    module.kind === "custom"
      ? module.module.name || moduleTitles.custom
      : moduleTitles[module.kind];

  return (
    <section
      className={cn(
        "group relative -mx-2 rounded-lg border border-transparent px-2 py-2 transition-colors",
        surface === "page" ? "hover:border-blue-300" : "hover:border-white/35",
      )}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("[data-ai-edit-button]")
        ) {
          return;
        }

        onSectionSelect(module.id);
      }}
    >
      <div
        data-ai-edit-button
        className="pointer-events-none absolute -right-2 -top-3 z-10 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100"
      >
        <Button
          onClick={(event) => event.stopPropagation()}
          onPress={() => onEditWithAi(module.id)}
          size="sm"
          type="button"
          variant="primary"
        >
          <WandSparkles className="size-3.5" />用 AI 编辑
        </Button>
      </div>

      {module.kind !== "personal" ? (
        <SectionHeading style={style} surface={surface} title={title} />
      ) : null}

      <ModuleBody
        module={module}
        onCompare={onCompare}
        patchDiff={patchDiff}
        showDiff={showDiff}
        style={style}
        surface={surface}
      />
    </section>
  );
}

function SectionHeading({
  style,
  surface,
  title,
}: {
  style: ResumeStyleConfig;
  surface: PreviewSurface;
  title: string;
}) {
  const colors = getSurfaceColors(style, surface);

  if (style.sectionStyle === "left-bar") {
    return (
      <h3
        className="mb-2 flex items-center gap-2 font-semibold"
        style={{
          color: colors.heading,
          fontSize: Math.max(10, style.typography.baseFontSize),
        }}
      >
        <span
          className="h-4 w-1 rounded-full"
          style={{ background: colors.accent }}
        />
        {title}
      </h3>
    );
  }

  if (style.sectionStyle === "pill") {
    return (
      <h3
        className="mb-2 inline-flex rounded-full px-2.5 py-1 font-semibold"
        style={{
          background: colors.subtleBackground,
          color: colors.heading,
          fontSize: Math.max(10, style.typography.baseFontSize - 0.5),
        }}
      >
        {title}
      </h3>
    );
  }

  if (style.sectionStyle === "minimal") {
    return (
      <h3
        className="mb-2 font-semibold"
        style={{
          color: colors.heading,
          fontSize: Math.max(10, style.typography.baseFontSize),
        }}
      >
        {title}
      </h3>
    );
  }

  return (
    <h3
      className="mb-2 border-b pb-1 font-semibold uppercase tracking-[0.08em]"
      style={{
        borderColor: colors.border,
        color: colors.heading,
        fontSize: Math.max(10, style.typography.baseFontSize - 1),
      }}
    >
      {title}
    </h3>
  );
}

function ModuleBody({
  module,
  onCompare,
  patchDiff,
  showDiff,
  style,
  surface,
}: {
  module: ResumeModule;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  patchDiff?: ResumePatchDiff;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  switch (module.kind) {
    case "personal":
      return (
        <PersonalBody
          diffs={patchDiff?.fieldDiffs ?? []}
          onCompare={onCompare}
          personal={module.personal}
          showDiff={showDiff}
          style={style}
          surface={surface}
        />
      );
    case "preferences":
      return (
        <p style={{ color: getSurfaceColors(style, surface).mutedText }}>
          {[
            module.preferences.jobFunction,
            module.preferences.targetCity,
            module.preferences.salaryExpectation,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      );
    case "skills":
      return (
        <SkillList
          diffs={patchDiff?.fieldDiffs ?? []}
          onCompare={onCompare}
          pathPrefix="skills"
          showDiff={showDiff}
          style={style}
          surface={surface}
          tags={module.skills}
        />
      );
    case "work":
      return (
        <div
          className="flex flex-col"
          style={{ gap: style.spacing.blockSpacing }}
        >
          {module.items.map((item, index) => (
            <WorkBody
              diffs={patchDiff?.fieldDiffs ?? []}
              index={index}
              item={item}
              key={item.id}
              onCompare={onCompare}
              showDiff={showDiff}
              style={style}
              surface={surface}
            />
          ))}
        </div>
      );
    case "projects":
      return (
        <div
          className="flex flex-col"
          style={{ gap: style.spacing.blockSpacing }}
        >
          {module.items.map((item, index) => (
            <ProjectBody
              diffs={patchDiff?.fieldDiffs ?? []}
              index={index}
              item={item}
              key={item.id}
              onCompare={onCompare}
              showDiff={showDiff}
              style={style}
              surface={surface}
            />
          ))}
        </div>
      );
    case "education":
      return (
        <div
          className="flex flex-col"
          style={{ gap: style.spacing.blockSpacing }}
        >
          {module.items.map((item, index) => (
            <EducationBody
              diffs={patchDiff?.fieldDiffs ?? []}
              index={index}
              item={item}
              key={item.id}
              onCompare={onCompare}
              showDiff={showDiff}
              style={style}
              surface={surface}
            />
          ))}
        </div>
      );
    case "custom":
      return (
        <RichTextPatchView
          diffs={patchDiff?.fieldDiffs ?? []}
          onCompare={onCompare}
          pathPrefix="custom.content"
          showDiff={showDiff}
          value={module.module.content}
        />
      );
    default:
      return null;
  }
}

function PersonalBody({
  diffs,
  onCompare,
  personal,
  showDiff,
  style,
  surface,
}: {
  diffs: ResumePatchFieldDiff[];
  onCompare: (diff: ResumePatchFieldDiff) => void;
  personal: PersonalInfo;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const avatarUrl = personal.avatarUrl?.trim() ?? "";
  const isSidebarPanel =
    surface === "panel" && style.layout.kind === "sidebar-left";
  const contacts = [
    personal.email
      ? { icon: Mail, label: personal.email, path: "personal.email" }
      : null,
    personal.phone
      ? { icon: Phone, label: personal.phone, path: "personal.phone" }
      : null,
    personal.city
      ? { icon: MapPin, label: personal.city, path: "personal.city" }
      : null,
    personal.github
      ? { icon: Code2, label: personal.github, path: "personal.github" }
      : null,
    personal.linkedin
      ? { icon: Link2, label: personal.linkedin, path: "personal.linkedin" }
      : null,
    personal.portfolio
      ? { icon: Globe, label: personal.portfolio, path: "personal.portfolio" }
      : null,
    ...(personal.customFields ?? []).map((field) =>
      field.value
        ? {
            icon: Globe,
            label: field.value,
            path: `personal.customFields.${field.id}`,
          }
        : null,
    ),
  ].filter((item): item is { icon: LucideIcon; label: string; path: string } =>
    Boolean(item),
  );

  return (
    <div
      className={cn("flex gap-3", isSidebarPanel ? "flex-col" : "items-start")}
    >
      {avatarUrl ? (
        <img
          alt={personal.fullName ? `${personal.fullName} 头像` : "头像"}
          className={cn(
            "shrink-0 rounded-lg object-cover",
            isSidebarPanel ? "size-20" : "size-16",
          )}
          src={avatarUrl}
        />
      ) : null}
      <div className="flex min-w-0 flex-col gap-1.5">
        {personal.fullName ? (
          <p
            className={cn(
              "font-semibold",
              surface === "panel" ? "text-[20px]" : "text-lg",
            )}
            style={{ color: colors.text }}
          >
            <ChangedText
              diff={findDiff(diffs, "personal.fullName")}
              onCompare={onCompare}
              showDiff={showDiff}
              value={personal.fullName}
            />
          </p>
        ) : null}
        {personal.headline ? (
          <p style={{ color: colors.mutedText }}>
            <ChangedText
              diff={findDiff(diffs, "personal.headline")}
              onCompare={onCompare}
              showDiff={showDiff}
              value={personal.headline}
            />
          </p>
        ) : null}
        {contacts.length > 0 ? (
          <ContactList
            contacts={contacts}
            diffs={diffs}
            onCompare={onCompare}
            showDiff={showDiff}
            style={style}
            surface={surface}
          />
        ) : null}
      </div>
    </div>
  );
}

function ContactList({
  contacts,
  diffs,
  onCompare,
  showDiff,
  style,
  surface,
}: {
  contacts: { icon: LucideIcon; label: string; path: string }[];
  diffs: ResumePatchFieldDiff[];
  onCompare: (diff: ResumePatchFieldDiff) => void;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const showIcons = style.contactStyle !== "plain";

  return (
    <div
      className={cn(
        "flex gap-x-3 gap-y-1",
        style.contactStyle === "sidebar" ? "flex-col" : "flex-wrap",
      )}
      style={{ color: colors.mutedText }}
    >
      {contacts.map((contact) => (
        <span className="flex min-w-0 items-center gap-1.5" key={contact.label}>
          {showIcons ? <contact.icon className="size-3.5 shrink-0" /> : null}
          <span className="min-w-0 break-all">
            <ChangedText
              diff={findDiff(diffs, contact.path)}
              onCompare={onCompare}
              showDiff={showDiff}
              value={contact.label}
            />
          </span>
        </span>
      ))}
    </div>
  );
}

function WorkBody({
  diffs,
  index,
  item,
  onCompare,
  showDiff,
  style,
  surface,
}: {
  diffs: ResumePatchFieldDiff[];
  index: number;
  item: WorkItem;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const path = `work[${index}]`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          <ChangedText
            diff={findDiff(diffs, `${path}.company`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.company}
          />
          {item.company && item.title ? " · " : null}
          <ChangedText
            diff={findDiff(diffs, `${path}.title`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.title}
          />
        </span>
        <DateRangeLabel
          diffs={diffs}
          item={item}
          onCompare={onCompare}
          pathPrefix={path}
          showDiff={showDiff}
          style={style}
          surface={surface}
        />
      </div>
      <RichTextPatchView
        diffs={diffs}
        onCompare={onCompare}
        pathPrefix={`${path}.description`}
        showDiff={showDiff}
        value={item.description}
      />
      <SkillList
        diffs={diffs}
        onCompare={onCompare}
        pathPrefix={`${path}.skills`}
        showDiff={showDiff}
        style={style}
        surface={surface}
        tags={item.skills}
      />
    </div>
  );
}

function ProjectBody({
  diffs,
  index,
  item,
  onCompare,
  showDiff,
  style,
  surface,
}: {
  diffs: ResumePatchFieldDiff[];
  index: number;
  item: ProjectItem;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const path = `projects[${index}]`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          <ChangedText
            diff={findDiff(diffs, `${path}.name`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.name}
          />
          {item.name && item.role ? " · " : null}
          <ChangedText
            diff={findDiff(diffs, `${path}.role`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.role}
          />
        </span>
        <DateRangeLabel
          diffs={diffs}
          item={item}
          onCompare={onCompare}
          pathPrefix={path}
          showDiff={showDiff}
          style={style}
          surface={surface}
        />
      </div>
      <RichTextPatchView
        diffs={diffs}
        onCompare={onCompare}
        pathPrefix={`${path}.description`}
        showDiff={showDiff}
        value={item.description}
      />
      <SkillList
        diffs={diffs}
        onCompare={onCompare}
        pathPrefix={`${path}.skills`}
        showDiff={showDiff}
        style={style}
        surface={surface}
        tags={item.skills}
      />
    </div>
  );
}

function EducationBody({
  diffs,
  index,
  item,
  onCompare,
  showDiff,
  style,
  surface,
}: {
  diffs: ResumePatchFieldDiff[];
  index: number;
  item: EducationItem;
  onCompare: (diff: ResumePatchFieldDiff) => void;
  showDiff: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const path = `education[${index}]`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          <ChangedText
            diff={findDiff(diffs, `${path}.school`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.school}
          />
          {[item.degree, item.major].filter(Boolean).length > 0 ? " · " : null}
          <ChangedText
            diff={findDiff(diffs, `${path}.degree`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.degree}
          />
          {item.degree && item.major ? " · " : null}
          <ChangedText
            diff={findDiff(diffs, `${path}.major`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.major}
          />
        </span>
        <DateRangeLabel
          diffs={diffs}
          item={item}
          onCompare={onCompare}
          pathPrefix={path}
          showDiff={showDiff}
          style={style}
          surface={surface}
        />
      </div>
      <RichTextPatchView
        diffs={diffs}
        onCompare={onCompare}
        pathPrefix={`${path}.description`}
        showDiff={showDiff}
        value={item.description}
      />
    </div>
  );
}

function DateRangeLabel({
  diffs = [],
  item,
  onCompare,
  pathPrefix,
  showDiff = false,
  style,
  surface,
}: {
  diffs?: ResumePatchFieldDiff[];
  item: { startDate: string; endDate: string; current: boolean };
  onCompare?: (diff: ResumePatchFieldDiff) => void;
  pathPrefix?: string;
  showDiff?: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const end = item.current ? "至今" : item.endDate;

  if (!item.startDate && !end) {
    return null;
  }

  return (
    <span
      className="shrink-0"
      style={{ color: getSurfaceColors(style, surface).mutedText }}
    >
      {pathPrefix && onCompare ? (
        <>
          <ChangedText
            diff={findDiff(diffs, `${pathPrefix}.startDate`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={item.startDate}
          />
          {item.startDate && end ? " - " : null}
          <ChangedText
            diff={findDiff(diffs, `${pathPrefix}.endDate`)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={end}
          />
        </>
      ) : (
        [item.startDate, end].filter(Boolean).join(" - ")
      )}
    </span>
  );
}

function SkillList({
  diffs = [],
  onCompare,
  pathPrefix = "skills",
  showDiff = false,
  style,
  surface,
  tags,
}: {
  diffs?: ResumePatchFieldDiff[];
  onCompare?: (diff: ResumePatchFieldDiff) => void;
  pathPrefix?: string;
  showDiff?: boolean;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
  tags: string[];
}) {
  const cleaned = tags.filter(Boolean);
  const colors = getSurfaceColors(style, surface);
  const skillDiffs = diffs.filter((diff) =>
    diff.path.startsWith(`${pathPrefix}.`),
  );
  const removed = skillDiffs.filter((diff) => diff.kind === "removed");

  if (cleaned.length === 0 && removed.length === 0) {
    return null;
  }

  if (style.skillStyle === "inline") {
    return (
      <p className="mt-1" style={{ color: colors.mutedText }}>
        {showDiff && removed.length > 0 ? (
          <>
            {removed.map((diff) => (
              <DiffToken diff={diff} key={diff.path} onCompare={onCompare} />
            ))}
          </>
        ) : null}
        {cleaned.map((tag, index) => (
          <span key={`${tag}-${index}`}>
            {index > 0 ? " / " : null}
            <ChangedText
              diff={findSkillDiff(skillDiffs, tag)}
              onCompare={onCompare}
              showDiff={showDiff}
              value={tag}
            />
          </span>
        ))}
      </p>
    );
  }

  if (style.skillStyle === "sidebar-list") {
    return (
      <ul className="mt-1 flex flex-col gap-1.5">
        {showDiff
          ? removed.map((diff) => (
              <li className="flex gap-1.5" key={diff.path}>
                <DiffToken diff={diff} onCompare={onCompare} />
              </li>
            ))
          : null}
        {cleaned.map((tag, index) => (
          <li className="flex gap-1.5" key={`${tag}-${index}`}>
            <span style={{ color: colors.accent }}>-</span>
            <span>
              <ChangedText
                diff={findSkillDiff(skillDiffs, tag)}
                onCompare={onCompare}
                showDiff={showDiff}
                value={tag}
              />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {showDiff
        ? removed.map((diff) => (
            <DiffToken diff={diff} key={diff.path} onCompare={onCompare} />
          ))
        : null}
      {cleaned.map((tag, index) => (
        <span
          className="rounded border px-2 py-0.5 font-medium"
          key={`${tag}-${index}`}
          style={{
            borderColor: colors.border,
            color: colors.heading,
          }}
        >
          <ChangedText
            diff={findSkillDiff(skillDiffs, tag)}
            onCompare={onCompare}
            showDiff={showDiff}
            value={tag}
          />
        </span>
      ))}
    </div>
  );
}

function getSurfaceColors(style: ResumeStyleConfig, surface: PreviewSurface) {
  if (surface === "panel") {
    return {
      accent: style.colors.accent,
      border: "rgba(255,255,255,0.26)",
      heading: style.colors.panelText,
      mutedText: style.colors.panelMutedText,
      subtleBackground: "rgba(255,255,255,0.12)",
      text: style.colors.panelText,
    };
  }

  return {
    accent: style.colors.accent,
    border: style.colors.border,
    heading: style.colors.accent,
    mutedText: style.colors.mutedText,
    subtleBackground: style.colors.subtleBackground,
    text: style.colors.text,
  };
}

function ChangedText({
  diff,
  onCompare,
  showDiff,
  value,
}: {
  diff?: ResumePatchFieldDiff;
  onCompare?: (diff: ResumePatchFieldDiff) => void;
  showDiff: boolean;
  value: string;
}) {
  if (!diff) {
    return <>{value}</>;
  }

  if (showDiff) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {diff.before ? (
          <button
            className="rounded bg-red-50 px-1 text-left text-red-700 line-through"
            onClick={(event) => {
              event.stopPropagation();
              onCompare?.(diff);
            }}
            type="button"
          >
            - {diff.before}
          </button>
        ) : null}
        {diff.after ? (
          <button
            className="rounded bg-emerald-50 px-1 text-left text-emerald-700"
            onClick={(event) => {
              event.stopPropagation();
              onCompare?.(diff);
            }}
            type="button"
          >
            + {diff.after}
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <span className="group/diff relative inline-block rounded bg-emerald-100 px-1 text-emerald-950">
      {value}
      <button
        className="pointer-events-none absolute -right-1 -top-6 z-20 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover/diff:pointer-events-auto group-hover/diff:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onCompare?.(diff);
        }}
        type="button"
      >
        Compare to original
      </button>
    </span>
  );
}

function RichTextPatchView({
  diffs,
  onCompare,
  pathPrefix,
  showDiff,
  value,
}: {
  diffs: ResumePatchFieldDiff[];
  onCompare: (diff: ResumePatchFieldDiff) => void;
  pathPrefix: string;
  showDiff: boolean;
  value: Parameters<typeof richTextToPlainText>[0];
}) {
  const lineDiffs = diffs.filter((diff) =>
    diff.path.startsWith(`${pathPrefix}.line`),
  );

  if (lineDiffs.length === 0) {
    return <RichTextView value={value} />;
  }

  if (showDiff) {
    return (
      <div className="mt-1 space-y-1">
        {lineDiffs.map((diff) => (
          <div className="space-y-1" key={diff.path}>
            {diff.before ? (
              <button
                className="block w-full rounded bg-red-50 px-2 py-0.5 text-left text-red-700 line-through"
                onClick={(event) => {
                  event.stopPropagation();
                  onCompare(diff);
                }}
                type="button"
              >
                - {diff.before}
              </button>
            ) : null}
            {diff.after ? (
              <button
                className="block w-full rounded bg-emerald-50 px-2 py-0.5 text-left text-emerald-800"
                onClick={(event) => {
                  event.stopPropagation();
                  onCompare(diff);
                }}
                type="button"
              >
                + {diff.after}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  const diffByLine = new Map(
    lineDiffs.map((diff) => [diff.after, diff] as const),
  );
  const lines = richTextToPlainText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="mt-1 space-y-1">
      {lines.map((line, index) => {
        const diff = diffByLine.get(line);

        return diff ? (
          <button
            className="group/diff relative block w-full rounded bg-emerald-100 px-2 py-0.5 text-left text-emerald-950"
            key={`${line}-${index}`}
            onClick={(event) => {
              event.stopPropagation();
              onCompare(diff);
            }}
            type="button"
          >
            {line}
            <span className="pointer-events-none absolute -right-1 -top-6 z-20 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover/diff:opacity-100">
              Compare to original
            </span>
          </button>
        ) : (
          <p key={`${line}-${index}`}>{line}</p>
        );
      })}
    </div>
  );
}

function DiffToken({
  diff,
  onCompare,
}: {
  diff: ResumePatchFieldDiff;
  onCompare?: (diff: ResumePatchFieldDiff) => void;
}) {
  const value = diff.kind === "removed" ? diff.before : diff.after;

  return (
    <button
      className={cn(
        "rounded border px-2 py-0.5 font-medium",
        diff.kind === "removed"
          ? "border-red-200 bg-red-50 text-red-700 line-through"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
      onClick={(event) => {
        event.stopPropagation();
        onCompare?.(diff);
      }}
      type="button"
    >
      {diff.kind === "removed" ? "- " : "+ "}
      {value}
    </button>
  );
}

function CompareOverlay({
  diff,
  onClose,
}: {
  diff: ResumePatchFieldDiff;
  onClose: () => void;
}) {
  const modalState = useOverlayState({
    isOpen: true,
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        onClose();
      }
    },
  });

  return (
    <Modal state={modalState}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-0 shadow-2xl">
            <Modal.Header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <Modal.Heading className="text-base font-semibold text-slate-900">
                  Compare to original
                </Modal.Heading>
                <p className="mt-1 text-xs text-slate-500">{diff.label}</p>
              </div>
              <Modal.CloseTrigger
                aria-label="关闭对比弹窗"
                className="rounded-lg"
              />
            </Modal.Header>
            <Modal.Body className="px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-red-500">
                    修改前
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-red-900">
                    {diff.before || "空"}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-emerald-600">
                    修改后
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-emerald-950">
                    {diff.after || "空"}
                  </p>
                </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function applyPatchPreviewModules(
  modules: ResumeModule[],
  patch: ResumePatch | null,
) {
  if (!patch) {
    return modules;
  }

  const changesById = new Map(
    patch.changes.map((change) => [change.moduleId, change.data] as const),
  );

  return modules.map((module) => changesById.get(module.id) ?? module);
}

function findDiff(diffs: ResumePatchFieldDiff[], path: string) {
  return diffs.find((diff) => diff.path === path);
}

function findSkillDiff(diffs: ResumePatchFieldDiff[], tag: string) {
  return diffs.find((diff) => diff.after === tag || diff.before === tag);
}

export { ResumeCanvasPreview };
