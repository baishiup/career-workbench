"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import type {
  ResumeBlock,
  ResumeDocument,
  ResumePageSize,
  ResumeSection,
  ResumeStyleConfig,
} from "@career-workbench/domain";
import { WandSparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type ResumeCanvasPreviewProps = {
  document: ResumeDocument | null;
  onEditWithAi: (sectionId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  selectedSectionId: string | null;
  style: ResumeStyleConfig;
};

const pageSizes: Record<ResumePageSize, { height: number; width: number }> = {
  a4: { height: 1123, width: 794 },
  letter: { height: 1056, width: 816 },
};

function ResumeCanvasPreview({
  document,
  onEditWithAi,
  onSectionSelect,
  selectedSectionId,
  style,
}: ResumeCanvasPreviewProps) {
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const pageSize = pageSizes[style.pageSize] ?? pageSizes.a4;

  if (!document) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm font-medium text-slate-500">
        这份简历缺少可编辑正文。
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-xl bg-slate-200/70 px-4 py-6">
      <article
        className="relative mx-auto max-w-full border border-slate-300 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.16)]"
        style={{
          background: style.colors.background,
          color: style.colors.text,
          fontFamily: style.typography.fontFamily,
          fontSize: style.typography.baseFontSize,
          lineHeight: style.typography.lineHeight,
          minHeight: pageSize.height,
          paddingBottom: style.spacing.pageMargin.bottom,
          paddingLeft: style.spacing.pageMargin.left,
          paddingRight: style.spacing.pageMargin.right,
          paddingTop: style.spacing.pageMargin.top,
          width: pageSize.width,
        }}
      >
        <header
          className="mb-4 border-b pb-3"
          style={{ borderColor: style.colors.border }}
        >
          <h2
            className="font-semibold"
            style={{
              color: style.colors.text,
              fontSize: style.typography.headingFontSize + 3,
            }}
          >
            {document.title}
          </h2>
          {document.target?.title || document.target?.company ? (
            <p className="mt-1" style={{ color: style.colors.mutedText }}>
              {[document.target.title, document.target.company]
                .filter(Boolean)
                .join(" / ")}
            </p>
          ) : null}
        </header>

        <div
          className="flex flex-col"
          style={{ gap: style.spacing.sectionSpacing }}
        >
          {document.sections
            .filter((section) => section.visible)
            .map((section) => (
              <PreviewSection
                hoveredSectionId={hoveredSectionId}
                key={section.id}
                onEditWithAi={onEditWithAi}
                onSectionSelect={onSectionSelect}
                section={section}
                selectedSectionId={selectedSectionId}
                setHoveredSectionId={setHoveredSectionId}
                style={style}
              />
            ))}
        </div>
      </article>
    </div>
  );
}

function PreviewSection({
  hoveredSectionId,
  onEditWithAi,
  onSectionSelect,
  section,
  selectedSectionId,
  setHoveredSectionId,
  style,
}: {
  hoveredSectionId: string | null;
  onEditWithAi: (sectionId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  section: ResumeSection;
  selectedSectionId: string | null;
  setHoveredSectionId: (sectionId: string | null) => void;
  style: ResumeStyleConfig;
}) {
  const isActive = selectedSectionId === section.id;
  const isHovered = hoveredSectionId === section.id;

  return (
    <section
      className={cn(
        "group relative -mx-2 rounded-lg border px-2 py-2 transition",
        isActive || isHovered
          ? "border-blue-400/70 bg-blue-50/55"
          : "border-transparent",
      )}
      onClick={() => onSectionSelect(section.id)}
      onMouseEnter={() => setHoveredSectionId(section.id)}
      onMouseLeave={() => setHoveredSectionId(null)}
    >
      <div className="pointer-events-none absolute -right-2 -top-3 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
        <Button
          onPress={() => onEditWithAi(section.id)}
          size="sm"
          type="button"
          variant="primary"
        >
          <WandSparkles className="size-3.5" />
          Edit with AI
        </Button>
      </div>

      {section.kind !== "personal" ? (
        <h3
          className="mb-2 border-b pb-1 font-semibold uppercase tracking-[0.08em]"
          style={{
            borderColor: style.colors.border,
            color: style.colors.accent,
            fontSize: Math.max(10, style.typography.baseFontSize - 1),
          }}
        >
          {section.title}
        </h3>
      ) : null}

      <div
        className="flex flex-col"
        style={{ gap: style.spacing.blockSpacing }}
      >
        {section.blocks.map((block) => (
          <PreviewBlock block={block} key={block.id} style={style} />
        ))}
      </div>
    </section>
  );
}

function PreviewBlock({
  block,
  style,
}: {
  block: ResumeBlock;
  style: ResumeStyleConfig;
}) {
  if (block.kind === "text" || block.kind === "paragraph") {
    return (
      <p
        className={cn(
          block.kind === "text" ? "font-medium" : "whitespace-pre-wrap",
        )}
        style={{
          color:
            block.kind === "text" ? style.colors.text : style.colors.mutedText,
        }}
      >
        {block.label ? (
          <span
            className="mr-1 font-semibold"
            style={{ color: style.colors.text }}
          >
            {block.label}:
          </span>
        ) : null}
        {block.text}
      </p>
    );
  }

  if (block.kind === "bulletList") {
    return (
      <ul className="list-disc pl-5" style={{ color: style.colors.text }}>
        {block.items.map((item) => (
          <li key={item.id} style={{ marginBottom: style.spacing.itemSpacing }}>
            {item.text}
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "tagList") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {block.tags.map((tag) => (
          <span
            className="rounded border px-2 py-0.5 font-medium"
            key={tag}
            style={{
              borderColor: style.colors.border,
              color: style.colors.accent,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (block.kind === "dateRange") {
    return (
      <p style={{ color: style.colors.mutedText }}>
        {block.label ? `${block.label}: ` : ""}
        {block.startDate} - {block.current ? "Present" : block.endDate}
      </p>
    );
  }

  if (block.kind === "linkList") {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {block.links.map((link) => (
          <span key={link.id} style={{ color: style.colors.accent }}>
            {link.label}: {link.url}
          </span>
        ))}
      </div>
    );
  }

  return null;
}

export { ResumeCanvasPreview };
