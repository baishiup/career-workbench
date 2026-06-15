"use client";

import {
  createResumeStyleFromTemplate,
  resumeStyleTemplates,
  type ResumeStyleConfig,
  type ResumeStyleTemplate,
} from "@career-workbench/domain";
import { Check, Columns2, FileText, PanelTop } from "lucide-react";

import { cn } from "@/lib/utils";

type ResumeStyleEditorProps = {
  onStyleChange: (style: ResumeStyleConfig) => void;
  style: ResumeStyleConfig;
};

const layoutIcons = {
  "header-band": PanelTop,
  "sidebar-left": Columns2,
  "single-column": FileText,
} as const;

function ResumeStyleEditor({ onStyleChange, style }: ResumeStyleEditorProps) {
  function applyTemplate(templateId: string) {
    onStyleChange(createResumeStyleFromTemplate(templateId));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
          简历模板
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          模板会一次性切换版式、颜色、标题和联系方式样式。
        </p>
      </div>

      <div className="grid gap-3">
        {resumeStyleTemplates.map((template) => (
          <TemplateCard
            isSelected={style.templateId === template.templateId}
            key={template.templateId}
            onSelect={() => applyTemplate(template.templateId)}
            template={template}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  isSelected,
  onSelect,
  template,
}: {
  isSelected: boolean;
  onSelect: () => void;
  template: ResumeStyleTemplate;
}) {
  const LayoutIcon = layoutIcons[template.layout.kind];

  return (
    <button
      aria-pressed={isSelected}
      className={cn(
        "group flex w-full gap-3 rounded-[10px] border bg-white p-3 text-left transition",
        isSelected
          ? "border-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
      )}
      onClick={onSelect}
      type="button"
    >
      <TemplateThumbnail template={template} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {template.name}
          </span>
          <LayoutIcon className="size-3.5 shrink-0 text-slate-400" />
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {template.description}
        </span>
      </span>

      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          isSelected
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 text-transparent",
        )}
      >
        <Check className="size-3.5" />
      </span>
    </button>
  );
}

function TemplateThumbnail({ template }: { template: ResumeStyleTemplate }) {
  return (
    <span
      className="relative block h-[118px] w-[84px] shrink-0 overflow-hidden rounded-[4px] border shadow-sm"
      style={{
        background: template.colors.background,
        borderColor: template.colors.border,
      }}
    >
      {template.layout.kind === "sidebar-left" ? (
        <span
          className="absolute inset-y-0 left-0 w-[30px]"
          style={{ background: template.colors.panelBackground }}
        />
      ) : null}
      {template.layout.kind === "header-band" ? (
        <span
          className="absolute inset-x-0 top-0 h-[30px]"
          style={{ background: template.colors.panelBackground }}
        />
      ) : null}

      <span
        className={cn(
          "absolute flex flex-col gap-1.5",
          template.layout.kind === "sidebar-left"
            ? "left-9 right-2 top-3"
            : "left-3 right-3 top-4",
          template.layout.kind === "header-band" && "top-3",
        )}
      >
        <span
          className="h-2.5 w-10 rounded-full"
          style={{
            background:
              template.layout.kind === "header-band"
                ? template.colors.panelText
                : template.colors.text,
          }}
        />
        <span
          className="h-1.5 w-14 rounded-full"
          style={{ background: template.colors.mutedText }}
        />
        <span
          className="mt-2 h-1 w-full rounded-full"
          style={{ background: template.colors.accent }}
        />
        <span className="h-1 w-10/12 rounded-full bg-slate-200" />
        <span className="h-1 w-full rounded-full bg-slate-200" />
        <span className="h-1 w-8/12 rounded-full bg-slate-200" />
        <span
          className="mt-2 h-1 w-full rounded-full"
          style={{ background: template.colors.accent }}
        />
        <span className="h-1 w-11/12 rounded-full bg-slate-200" />
        <span className="h-1 w-9/12 rounded-full bg-slate-200" />
      </span>
    </span>
  );
}

export { ResumeStyleEditor };
