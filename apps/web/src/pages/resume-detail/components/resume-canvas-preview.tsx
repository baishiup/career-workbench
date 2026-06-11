"use client";

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
  surface?: "canvas" | "flush";
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
  surface = "canvas",
  style,
}: ResumeCanvasPreviewProps) {
  const pageSize = pageSizes[style.pageSize] ?? pageSizes.a4;

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
          "relative mx-auto max-w-full bg-white",
          surface === "canvas" &&
            "rounded-[3px] border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_50px_rgba(15,23,42,0.13)]",
        )}
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
        <div
          className="flex flex-col"
          style={{ gap: style.spacing.sectionSpacing }}
        >
          {document.sections
            .filter((section) => section.visible)
            .map((section) => (
              <PreviewSection
                key={section.id}
                onEditWithAi={onEditWithAi}
                onSectionSelect={onSectionSelect}
                section={section}
                style={style}
              />
            ))}
        </div>
      </article>
    </div>
  );
}

function PreviewSection({
  onEditWithAi,
  onSectionSelect,
  section,
  style,
}: {
  onEditWithAi: (sectionId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  section: ResumeSection;
  style: ResumeStyleConfig;
}) {
  return (
    <section
      className="group relative -mx-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-blue-300"
      onClick={() => onSectionSelect(section.id)}
    >
      <div className="pointer-events-none absolute -right-2 -top-3 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
        <Button
          onPress={() => onEditWithAi(section.id)}
          size="sm"
          type="button"
          variant="primary"
        >
          <WandSparkles className="size-3.5" />用 AI 编辑
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
        {block.tags.map((tag, index) => (
          <span
            className="rounded border px-2 py-0.5 font-medium"
            key={`${block.id}-tag-${index}-${tag}`}
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
