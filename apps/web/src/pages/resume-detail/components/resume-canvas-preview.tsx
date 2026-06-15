"use client";

import { Button } from "@heroui/react";
import type {
  EducationItem,
  PersonalInfo,
  ProjectItem,
  ResumeDocument,
  ResumeModule,
  ResumeStyleConfig,
  WorkItem,
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
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
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
  onEditWithAi,
  onSectionSelect,
  surface = "canvas",
  style,
}: ResumeCanvasPreviewProps) {
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
        "flex h-full items-start justify-center overflow-auto px-8 py-9",
        surface === "canvas" ? "rounded-xl bg-[#eef1f6]" : "bg-[#eef1f6]",
      )}
    >
      <article
        className={cn(
          "relative mx-auto max-w-full overflow-hidden bg-white",
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
          onEditWithAi={onEditWithAi}
          onSectionSelect={onSectionSelect}
          style={style}
        />
      </article>
    </div>
  );
}

function TemplateLayout({
  document,
  onEditWithAi,
  onSectionSelect,
  style,
}: {
  document: ResumeDocument;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  style: ResumeStyleConfig;
}) {
  const modules = document.modules.filter((module) => module.visible);

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
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
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
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
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
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
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
            onEditWithAi={onEditWithAi}
            onSectionSelect={onSectionSelect}
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
        onEditWithAi={onEditWithAi}
        onSectionSelect={onSectionSelect}
        style={style}
        surface="page"
      />
    </main>
  );
}

function ModuleList({
  modules,
  onEditWithAi,
  onSectionSelect,
  style,
  surface,
}: {
  modules: ResumeModule[];
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  return (
    <>
      {modules.map((module) => (
        <PreviewModule
          key={module.id}
          module={module}
          onEditWithAi={onEditWithAi}
          onSectionSelect={onSectionSelect}
          style={style}
          surface={surface}
        />
      ))}
    </>
  );
}

function PreviewModule({
  module,
  onEditWithAi,
  onSectionSelect,
  style,
  surface,
}: {
  module: ResumeModule;
  onEditWithAi: (moduleId: string) => void;
  onSectionSelect: (moduleId: string) => void;
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
      onClick={() => onSectionSelect(module.id)}
    >
      <div className="pointer-events-none absolute -right-2 -top-3 z-10 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
        <Button
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

      <ModuleBody module={module} style={style} surface={surface} />
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
  style,
  surface,
}: {
  module: ResumeModule;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  switch (module.kind) {
    case "personal":
      return (
        <PersonalBody
          personal={module.personal}
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
      return <SkillList style={style} surface={surface} tags={module.skills} />;
    case "work":
      return (
        <div
          className="flex flex-col"
          style={{ gap: style.spacing.blockSpacing }}
        >
          {module.items.map((item) => (
            <WorkBody
              item={item}
              key={item.id}
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
          {module.items.map((item) => (
            <ProjectBody
              item={item}
              key={item.id}
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
          {module.items.map((item) => (
            <EducationBody
              item={item}
              key={item.id}
              style={style}
              surface={surface}
            />
          ))}
        </div>
      );
    case "custom":
      return <RichTextView value={module.module.content} />;
    default:
      return null;
  }
}

function PersonalBody({
  personal,
  style,
  surface,
}: {
  personal: PersonalInfo;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);
  const contacts = [
    personal.email ? { icon: Mail, label: personal.email } : null,
    personal.phone ? { icon: Phone, label: personal.phone } : null,
    personal.city ? { icon: MapPin, label: personal.city } : null,
    personal.github ? { icon: Code2, label: personal.github } : null,
    personal.linkedin ? { icon: Link2, label: personal.linkedin } : null,
    personal.portfolio ? { icon: Globe, label: personal.portfolio } : null,
    ...personal.customFields.map((field) =>
      field.value ? { icon: Globe, label: field.value } : null,
    ),
  ].filter((item): item is { icon: LucideIcon; label: string } =>
    Boolean(item),
  );

  return (
    <div className="flex flex-col gap-1.5">
      {personal.fullName ? (
        <p
          className={cn(
            "font-semibold",
            surface === "panel" ? "text-[20px]" : "text-lg",
          )}
          style={{ color: colors.text }}
        >
          {personal.fullName}
        </p>
      ) : null}
      {personal.headline ? (
        <p style={{ color: colors.mutedText }}>{personal.headline}</p>
      ) : null}
      {contacts.length > 0 ? (
        <ContactList contacts={contacts} style={style} surface={surface} />
      ) : null}
    </div>
  );
}

function ContactList({
  contacts,
  style,
  surface,
}: {
  contacts: { icon: LucideIcon; label: string }[];
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
          <span className="min-w-0 break-all">{contact.label}</span>
        </span>
      ))}
    </div>
  );
}

function WorkBody({
  item,
  style,
  surface,
}: {
  item: WorkItem;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          {[item.company, item.title].filter(Boolean).join(" · ")}
        </span>
        <DateRangeLabel item={item} style={style} surface={surface} />
      </div>
      <RichTextView value={item.description} />
      <SkillList style={style} surface={surface} tags={item.skills} />
    </div>
  );
}

function ProjectBody({
  item,
  style,
  surface,
}: {
  item: ProjectItem;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          {[item.name, item.role].filter(Boolean).join(" · ")}
        </span>
        <DateRangeLabel item={item} style={style} surface={surface} />
      </div>
      <RichTextView value={item.description} />
      <SkillList style={style} surface={surface} tags={item.skills} />
    </div>
  );
}

function EducationBody({
  item,
  style,
  surface,
}: {
  item: EducationItem;
  style: ResumeStyleConfig;
  surface: PreviewSurface;
}) {
  const colors = getSurfaceColors(style, surface);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold" style={{ color: colors.text }}>
          {[item.school, item.degree, item.major].filter(Boolean).join(" · ")}
        </span>
        <DateRangeLabel item={item} style={style} surface={surface} />
      </div>
      <RichTextView value={item.description} />
    </div>
  );
}

function DateRangeLabel({
  item,
  style,
  surface,
}: {
  item: { startDate: string; endDate: string; current: boolean };
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
      {[item.startDate, end].filter(Boolean).join(" - ")}
    </span>
  );
}

function SkillList({
  style,
  surface,
  tags,
}: {
  style: ResumeStyleConfig;
  surface: PreviewSurface;
  tags: string[];
}) {
  const cleaned = tags.filter(Boolean);
  const colors = getSurfaceColors(style, surface);

  if (cleaned.length === 0) {
    return null;
  }

  if (style.skillStyle === "inline") {
    return (
      <p className="mt-1" style={{ color: colors.mutedText }}>
        {cleaned.join(" / ")}
      </p>
    );
  }

  if (style.skillStyle === "sidebar-list") {
    return (
      <ul className="mt-1 flex flex-col gap-1.5">
        {cleaned.map((tag, index) => (
          <li className="flex gap-1.5" key={`${tag}-${index}`}>
            <span style={{ color: colors.accent }}>-</span>
            <span>{tag}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {cleaned.map((tag, index) => (
        <span
          className="rounded border px-2 py-0.5 font-medium"
          key={`${tag}-${index}`}
          style={{
            borderColor: colors.border,
            color: colors.heading,
          }}
        >
          {tag}
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

export { ResumeCanvasPreview };
