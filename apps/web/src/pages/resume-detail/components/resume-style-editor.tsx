"use client";

import type { ReactNode } from "react";
import {
  ColorArea,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ListBox,
  NumberField as HeroNumberField,
  parseColor,
  Select,
} from "@heroui/react";
import type {
  ResumeColorConfig,
  ResumePageMargin,
  ResumePageSize,
  ResumeSpacingConfig,
  ResumeStyleConfig,
  ResumeTypographyConfig,
} from "@career-workbench/domain";

import { cn } from "@/lib/utils";

type ResumeStyleEditorProps = {
  onStyleChange: (style: ResumeStyleConfig) => void;
  style: ResumeStyleConfig;
};

type TemplatePreset = {
  accent: string;
  baseFontSize: number;
  blockSpacing: number;
  fontFamily: string;
  headingFontSize: number;
  id: string;
  label: string;
  lineHeight: number;
  sectionSpacing: number;
};

const templatePresets: TemplatePreset[] = [
  {
    accent: "#2563EB",
    baseFontSize: 12,
    blockSpacing: 8,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    headingFontSize: 16,
    id: "base-clean-v1",
    label: "Base Clean",
    lineHeight: 1.45,
    sectionSpacing: 18,
  },
  {
    accent: "#0F766E",
    baseFontSize: 11,
    blockSpacing: 6,
    fontFamily: "Arial, Helvetica, sans-serif",
    headingFontSize: 14,
    id: "compact-focus-v1",
    label: "Compact Focus",
    lineHeight: 1.35,
    sectionSpacing: 12,
  },
];

function ResumeStyleEditor({ onStyleChange, style }: ResumeStyleEditorProps) {
  function updateStyle(patch: Partial<ResumeStyleConfig>) {
    onStyleChange({ ...style, ...patch });
  }

  function updateColors(patch: Partial<ResumeColorConfig>) {
    updateStyle({ colors: { ...style.colors, ...patch } });
  }

  function updateTypography(patch: Partial<ResumeTypographyConfig>) {
    updateStyle({ typography: { ...style.typography, ...patch } });
  }

  function updateSpacing(patch: Partial<ResumeSpacingConfig>) {
    updateStyle({ spacing: { ...style.spacing, ...patch } });
  }

  function updatePageMargin(patch: Partial<ResumePageMargin>) {
    updateSpacing({
      pageMargin: {
        ...style.spacing.pageMargin,
        ...patch,
      },
    });
  }

  function applyTemplate(templateId: string) {
    const preset = templatePresets.find(
      (template) => template.id === templateId,
    );

    if (!preset) {
      updateStyle({ templateId });
      return;
    }

    onStyleChange({
      ...style,
      templateId: preset.id,
      colors: {
        ...style.colors,
        accent: preset.accent,
      },
      spacing: {
        ...style.spacing,
        blockSpacing: preset.blockSpacing,
        sectionSpacing: preset.sectionSpacing,
      },
      typography: {
        ...style.typography,
        baseFontSize: preset.baseFontSize,
        fontFamily: preset.fontFamily,
        headingFontSize: preset.headingFontSize,
        lineHeight: preset.lineHeight,
      },
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel title="模板">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectField
            label="模板"
            onChange={applyTemplate}
            options={templatePresets.reduce<Record<string, string>>(
              (options, preset) => ({ ...options, [preset.id]: preset.label }),
              {},
            )}
            value={style.templateId}
          />
          <SelectField
            label="页面尺寸"
            onChange={(pageSize) =>
              updateStyle({ pageSize: pageSize as ResumePageSize })
            }
            options={{ a4: "A4", letter: "Letter" }}
            value={style.pageSize}
          />
        </div>
      </Panel>

      <Panel title="字体">
        <div className="grid grid-cols-2 gap-2.5">
          <SelectField
            className="col-span-2"
            label="字体"
            onChange={(fontFamily) => updateTypography({ fontFamily })}
            options={{
              "Arial, Helvetica, sans-serif": "Arial",
              "Georgia, serif": "Georgia",
              "Inter, ui-sans-serif, system-ui, sans-serif": "Inter/System",
              "Times New Roman, Times, serif": "Times",
            }}
            value={style.typography.fontFamily}
          />
          <NumberField
            label="正文字号"
            max={18}
            min={9}
            onChange={(baseFontSize) => updateTypography({ baseFontSize })}
            step={1}
            value={style.typography.baseFontSize}
          />
          <NumberField
            label="标题字号"
            max={24}
            min={11}
            onChange={(headingFontSize) =>
              updateTypography({ headingFontSize })
            }
            step={1}
            value={style.typography.headingFontSize}
          />
          <NumberField
            label="行高"
            max={1.9}
            min={1.1}
            onChange={(lineHeight) => updateTypography({ lineHeight })}
            step={0.05}
            value={style.typography.lineHeight}
          />
        </div>
      </Panel>

      <Panel title="颜色">
        <div className="grid grid-cols-2 gap-2.5">
          <ColorField
            label="正文"
            onChange={(text) => updateColors({ text })}
            value={style.colors.text}
          />
          <ColorField
            label="弱化文本"
            onChange={(mutedText) => updateColors({ mutedText })}
            value={style.colors.mutedText}
          />
          <ColorField
            label="强调色"
            onChange={(accent) => updateColors({ accent })}
            value={style.colors.accent}
          />
          <ColorField
            label="边框"
            onChange={(border) => updateColors({ border })}
            value={style.colors.border}
          />
          <ColorField
            label="页面背景"
            onChange={(background) => updateColors({ background })}
            value={style.colors.background}
          />
        </div>
      </Panel>

      <Panel title="间距">
        <div className="flex flex-col gap-2.5">
          <NumberField
            label="Section 间距"
            layout="inline"
            max={40}
            min={4}
            onChange={(sectionSpacing) => updateSpacing({ sectionSpacing })}
            step={1}
            value={style.spacing.sectionSpacing}
          />
          <NumberField
            label="Block 间距"
            layout="inline"
            max={24}
            min={2}
            onChange={(blockSpacing) => updateSpacing({ blockSpacing })}
            step={1}
            value={style.spacing.blockSpacing}
          />
          <NumberField
            label="列表项间距"
            layout="inline"
            max={18}
            min={0}
            onChange={(itemSpacing) => updateSpacing({ itemSpacing })}
            step={1}
            value={style.spacing.itemSpacing}
          />
        </div>
      </Panel>

      <Panel title="页边距">
        <div className="flex flex-col gap-2.5">
          <NumberField
            label="上"
            layout="inline"
            max={90}
            min={16}
            onChange={(top) => updatePageMargin({ top })}
            step={1}
            value={style.spacing.pageMargin.top}
          />
          <NumberField
            label="右"
            layout="inline"
            max={90}
            min={16}
            onChange={(right) => updatePageMargin({ right })}
            step={1}
            value={style.spacing.pageMargin.right}
          />
          <NumberField
            label="下"
            layout="inline"
            max={90}
            min={16}
            onChange={(bottom) => updatePageMargin({ bottom })}
            step={1}
            value={style.spacing.pageMargin.bottom}
          />
          <NumberField
            label="左"
            layout="inline"
            max={90}
            min={16}
            onChange={(left) => updatePageMargin({ left })}
            step={1}
            value={style.spacing.pageMargin.left}
          />
        </div>
      </Panel>
    </div>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SelectField<TValue extends string>({
  className,
  label,
  onChange,
  options,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: TValue) => void;
  options: Record<TValue, string>;
  value: TValue;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <Select
        className="h-8 rounded-[7px] border-slate-200 text-[12.5px]"
        aria-label={label}
        fullWidth
        onSelectionChange={(key) => {
          if (key) {
            onChange(String(key) as TValue);
          }
        }}
        selectedKey={value}
      >
        <Select.Trigger className="h-8 rounded-[7px] border-slate-200 text-[12.5px]">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.entries(options).map(([optionValue, label]) => (
              <ListBox.Item id={optionValue} key={optionValue}>
                {label as string}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </label>
  );
}

function NumberField({
  label,
  layout = "stacked",
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  layout?: "inline" | "stacked";
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  const isInline = layout === "inline";

  return (
    <label
      className={cn(
        "flex min-w-0 gap-1",
        isInline ? "items-center justify-between gap-3" : "flex-col",
      )}
    >
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <HeroNumberField
        aria-label={label}
        className={cn(isInline ? "w-[132px]" : "w-full")}
        maxValue={max}
        minValue={min}
        onChange={onChange}
        step={step}
        value={value}
      >
        <HeroNumberField.Group className="h-8 w-full">
          <HeroNumberField.DecrementButton />
          <HeroNumberField.Input className="text-center text-[12.5px] font-medium" />
          <HeroNumberField.IncrementButton />
        </HeroNumberField.Group>
      </HeroNumberField>
    </label>
  );
}

function ColorField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const color = parseColor(value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <ColorPicker
        aria-label={label}
        onChange={(nextColor) => onChange(nextColor.toString("hex"))}
        value={color}
      >
        <ColorPicker.Trigger className="flex h-8 w-full items-center gap-2 rounded-[7px] border border-slate-200 bg-white px-2.5 text-left text-[12px] text-slate-600 tabular-nums hover:bg-slate-50">
          <ColorSwatch
            className="h-[18px] w-[18px] shrink-0 rounded-[5px] border border-black/8"
            color={color}
          />
          <span className="min-w-0 truncate">{value.toUpperCase()}</span>
        </ColorPicker.Trigger>
        <ColorPicker.Popover className="w-[232px] p-3">
          <div className="flex flex-col gap-3">
            <ColorArea
              className="h-32 rounded-[8px]"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider channel="hue" colorSpace="hsb">
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
            <ColorSlider channel="alpha">
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          </div>
        </ColorPicker.Popover>
      </ColorPicker>
    </div>
  );
}

export { ResumeStyleEditor };
