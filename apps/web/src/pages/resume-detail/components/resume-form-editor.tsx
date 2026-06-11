"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  ListBox,
  Select,
  TextArea,
} from "@heroui/react";
import type {
  ResumeBlock,
  ResumeBlockKind,
  ResumeBulletListBlock,
  ResumeDocument,
  ResumeLinkListBlock,
  ResumeSection,
  ResumeSectionKind,
  ResumeTagListBlock,
} from "@career-workbench/domain";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ResumeFormEditorProps = {
  document: ResumeDocument;
  onDocumentChange: (document: ResumeDocument) => void;
  sectionFocusSignal: number;
  onSectionFocus: (sectionId: string) => void;
  selectedSectionId: string | null;
};

const sectionKindLabels: Record<ResumeSectionKind, string> = {
  custom: "自定义",
  education: "教育背景",
  personal: "个人信息",
  projects: "项目",
  skills: "技能",
  summary: "简介",
  work: "工作经历",
};

const blockKindLabels: Record<ResumeBlockKind, string> = {
  bulletList: "要点列表",
  dateRange: "日期区间",
  linkList: "链接",
  paragraph: "段落",
  tagList: "标签",
  text: "文本",
};

const blockBarColor: Record<ResumeBlockKind, string> = {
  bulletList: "bg-violet-600",
  dateRange: "bg-teal-600",
  linkList: "bg-sky-500",
  paragraph: "bg-blue-600",
  tagList: "bg-amber-500",
  text: "bg-blue-600",
};

function ResumeFormEditor({
  document,
  onDocumentChange,
  sectionFocusSignal,
  onSectionFocus,
  selectedSectionId,
}: ResumeFormEditorProps) {
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!selectedSectionId || sectionFocusSignal <= 0) {
      return;
    }

    const sectionElement = sectionRefs.current.get(selectedSectionId);

    if (!sectionElement) {
      return;
    }

    window.requestAnimationFrame(() => {
      sectionElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [sectionFocusSignal, selectedSectionId]);

  function setSectionRef(sectionId: string, node: HTMLElement | null) {
    if (node) {
      sectionRefs.current.set(sectionId, node);
      return;
    }

    sectionRefs.current.delete(sectionId);
  }

  function updateDocument(patch: Partial<ResumeDocument>) {
    onDocumentChange({ ...document, ...patch });
  }

  function updateSection(sectionId: string, patch: Partial<ResumeSection>) {
    onDocumentChange({
      ...document,
      sections: document.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });
  }

  function replaceSection(nextSection: ResumeSection) {
    onDocumentChange({
      ...document,
      sections: document.sections.map((section) =>
        section.id === nextSection.id ? nextSection : section,
      ),
    });
  }

  function moveSection(from: number, to: number) {
    if (from === to || to < 0 || to >= document.sections.length) {
      return;
    }

    const nextSections = [...document.sections];
    const [moved] = nextSections.splice(from, 1);
    nextSections.splice(to, 0, moved);
    onDocumentChange({ ...document, sections: nextSections });
  }

  function deleteSection(sectionId: string) {
    onDocumentChange({
      ...document,
      sections: document.sections.filter((section) => section.id !== sectionId),
    });
  }

  function addSection() {
    const section: ResumeSection = {
      blocks: [],
      id: createId("section"),
      kind: "custom",
      title: "Custom Section",
      visible: true,
    };

    onDocumentChange({
      ...document,
      sections: [...document.sections, section],
    });
    onSectionFocus(section.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
          简历信息
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_116px] gap-2.5">
          <TextField
            label="简历名称"
            onChange={(title) => updateDocument({ title })}
            value={document.title}
          />
          <TextField
            label="语言"
            onChange={(locale) => updateDocument({ locale })}
            value={document.locale}
          />
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
            章节
          </h3>
          <span className="text-[11px] font-semibold text-slate-300">
            {document.sections.length}
          </span>
        </div>
        <Button
          className="rounded-[7px] border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-100"
          onPress={addSection}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          添加章节
        </Button>
      </div>

      {document.sections.map((section, index) => (
        <SectionEditor
          canMoveDown={index < document.sections.length - 1}
          canMoveUp={index > 0}
          isSelected={selectedSectionId === section.id}
          key={section.id}
          onDelete={() => deleteSection(section.id)}
          onFocus={() => onSectionFocus(section.id)}
          onMoveDown={() => moveSection(index, index + 1)}
          onMoveUp={() => moveSection(index, index - 1)}
          onReplace={replaceSection}
          onSectionRef={(node) => setSectionRef(section.id, node)}
          onUpdate={(patch) => updateSection(section.id, patch)}
          section={section}
        />
      ))}
    </div>
  );
}

function SectionEditor({
  canMoveDown,
  canMoveUp,
  isSelected,
  onDelete,
  onFocus,
  onMoveDown,
  onMoveUp,
  onReplace,
  onSectionRef,
  onUpdate,
  section,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onFocus: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onReplace: (section: ResumeSection) => void;
  onSectionRef: (node: HTMLElement | null) => void;
  onUpdate: (patch: Partial<ResumeSection>) => void;
  section: ResumeSection;
}) {
  const [newBlockKind, setNewBlockKind] = useState<ResumeBlockKind>("text");

  function updateBlock(blockId: string, nextBlock: ResumeBlock) {
    onReplace({
      ...section,
      blocks: section.blocks.map((block) =>
        block.id === blockId ? nextBlock : block,
      ),
    });
  }

  function deleteBlock(blockId: string) {
    onReplace({
      ...section,
      blocks: section.blocks.filter((block) => block.id !== blockId),
    });
  }

  function addBlock() {
    onReplace({
      ...section,
      blocks: [...section.blocks, createEmptyBlock(newBlockKind)],
    });
  }

  if (!isSelected) {
    return (
      <section
        className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:border-blue-300"
        onClick={onFocus}
        onFocus={onFocus}
        ref={onSectionRef}
      >
        <GripVertical className="size-3.5 text-slate-300" />
        <span className="flex-1 truncate text-[13px] font-semibold text-slate-900">
          {section.title || sectionKindLabels[section.kind]}
        </span>
        <span className="rounded-[5px] bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-slate-400">
          {sectionKindLabels[section.kind]}
        </span>
        <ChevronDown className="size-[15px] text-slate-300" />
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-blue-300"
      onClick={onFocus}
      onFocus={onFocus}
      ref={onSectionRef}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
        <GripVertical className="size-3.5 text-slate-400" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900">
          {section.title || sectionKindLabels[section.kind]}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            icon={section.visible ? Eye : EyeOff}
            label={section.visible ? "隐藏 section" : "显示 section"}
            onPress={() => onUpdate({ visible: !section.visible })}
          />
          <IconButton
            disabled={!canMoveUp}
            icon={ChevronUp}
            label="上移 section"
            onPress={onMoveUp}
          />
          <IconButton
            disabled={!canMoveDown}
            icon={ChevronDown}
            label="下移 section"
            onPress={onMoveDown}
          />
          <IconButton
            icon={Trash2}
            label="删除 section"
            onPress={onDelete}
            variant="danger-soft"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2.5">
          <TextField
            label="章节标题"
            onChange={(title) => onUpdate({ title })}
            value={section.title}
          />
          <SelectField
            label="类型"
            onChange={(kind) => onUpdate({ kind: kind as ResumeSectionKind })}
            options={sectionKindLabels}
            value={section.kind}
          />
        </div>

        <div className="flex flex-col gap-2">
          {section.blocks.map((block) => (
            <BlockEditor
              block={block}
              key={block.id}
              onDelete={() => deleteBlock(block.id)}
              onUpdate={(nextBlock) => updateBlock(block.id, nextBlock)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[9px] border border-dashed border-slate-300 bg-[#fbfdff] p-2.5">
          <SelectField
            className="min-w-0 flex-1"
            hideLabel
            label="新增 Block"
            onChange={(kind) => setNewBlockKind(kind as ResumeBlockKind)}
            options={blockKindLabels}
            value={newBlockKind}
          />
          <Button
            className="shrink-0 rounded-[7px] border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-100"
            onPress={addBlock}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus className="size-4" />
            添加 Block
          </Button>
        </div>
      </div>
    </section>
  );
}

function BlockEditor({
  block,
  onDelete,
  onUpdate,
}: {
  block: ResumeBlock;
  onDelete: () => void;
  onUpdate: (block: ResumeBlock) => void;
}) {
  return (
    <div className="rounded-[9px] border border-slate-100 bg-[#f9fbfd] p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("h-3 w-[3px] rounded-sm", blockBarColor[block.kind])}
          />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-500">
            {blockKindLabels[block.kind]}
          </span>
        </span>
        <IconButton
          icon={Trash2}
          label="删除 block"
          onPress={onDelete}
          variant="danger-soft"
        />
      </div>

      <div className="mb-2 grid gap-2.5 md:grid-cols-2">
        <TextField
          label="Block 标签"
          onChange={(label) => onUpdate({ ...block, label })}
          value={block.label ?? ""}
        />
      </div>

      {block.kind === "text" || block.kind === "paragraph" ? (
        <TextAreaField
          label="内容"
          onChange={(text) => onUpdate({ ...block, text })}
          value={block.text}
        />
      ) : null}

      {block.kind === "bulletList" ? (
        <BulletListEditor block={block} onUpdate={onUpdate} />
      ) : null}

      {block.kind === "tagList" ? (
        <TagListEditor block={block} onUpdate={onUpdate} />
      ) : null}

      {block.kind === "dateRange" ? (
        <div className="flex items-center gap-2">
          <TextField
            className="min-w-0 flex-1"
            label="开始日期"
            onChange={(startDate) => onUpdate({ ...block, startDate })}
            value={block.startDate}
          />
          <span className="mt-5 text-slate-300">-</span>
          <TextField
            className="min-w-0 flex-1"
            isDisabled={Boolean(block.current)}
            label="结束日期"
            onChange={(endDate) => onUpdate({ ...block, endDate })}
            value={block.endDate}
          />
          <Checkbox
            className="mt-5 shrink-0 text-[12px] text-slate-500"
            isSelected={Boolean(block.current)}
            onChange={(checked) => onUpdate({ ...block, current: checked })}
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>当前仍在进行</Checkbox.Content>
          </Checkbox>
        </div>
      ) : null}

      {block.kind === "linkList" ? (
        <LinkListEditor block={block} onUpdate={onUpdate} />
      ) : null}
    </div>
  );
}

function BulletListEditor({
  block,
  onUpdate,
}: {
  block: ResumeBulletListBlock;
  onUpdate: (block: ResumeBlock) => void;
}) {
  function updateItem(itemId: string, text: string) {
    onUpdate({
      ...block,
      items: block.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    });
  }

  function deleteItem(itemId: string) {
    onUpdate({
      ...block,
      items: block.items.filter((item) => item.id !== itemId),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {block.items.map((item) => (
        <div className="flex gap-2" key={item.id}>
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
          <TextArea
            className="min-w-0 flex-1 rounded-[7px] text-[12.5px] leading-relaxed"
            fullWidth
            onChange={(event) => updateItem(item.id, event.target.value)}
            rows={2}
            value={item.text}
          />
          <IconButton
            icon={Trash2}
            label="删除 bullet"
            onPress={() => deleteItem(item.id)}
            variant="danger-soft"
          />
        </div>
      ))}
      <Button
        className="self-start rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        onPress={() =>
          onUpdate({
            ...block,
            items: [...block.items, { id: createId("bullet"), text: "" }],
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        添加 Bullet
      </Button>
    </div>
  );
}

function TagListEditor({
  block,
  onUpdate,
}: {
  block: ResumeTagListBlock;
  onUpdate: (block: ResumeBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {block.tags.map((tag, index) => (
        <div className="flex gap-2" key={`${tag}-${index}`}>
          <Input
            className="h-8 rounded-[7px] border-slate-200 text-[12.5px]"
            fullWidth
            onChange={(event) => {
              const tags = [...block.tags];
              tags[index] = event.target.value;
              onUpdate({ ...block, tags });
            }}
            value={tag}
          />
          <IconButton
            icon={Trash2}
            label="删除 tag"
            onPress={() =>
              onUpdate({
                ...block,
                tags: block.tags.filter((_, itemIndex) => itemIndex !== index),
              })
            }
            variant="danger-soft"
          />
        </div>
      ))}
      <Button
        className="self-start rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        onPress={() => onUpdate({ ...block, tags: [...block.tags, ""] })}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        添加 Tag
      </Button>
    </div>
  );
}

function LinkListEditor({
  block,
  onUpdate,
}: {
  block: ResumeLinkListBlock;
  onUpdate: (block: ResumeBlock) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {block.links.map((link) => (
        <div
          className="grid gap-2 md:grid-cols-[132px_minmax(0,1fr)_auto]"
          key={link.id}
        >
          <Input
            className="h-8 rounded-[7px] border-slate-200 text-[12.5px]"
            fullWidth
            onChange={(event) =>
              onUpdate({
                ...block,
                links: block.links.map((item) =>
                  item.id === link.id
                    ? { ...item, label: event.target.value }
                    : item,
                ),
              })
            }
            placeholder="Label"
            value={link.label}
          />
          <Input
            className="h-8 rounded-[7px] border-slate-200 text-[12.5px]"
            fullWidth
            onChange={(event) =>
              onUpdate({
                ...block,
                links: block.links.map((item) =>
                  item.id === link.id
                    ? { ...item, url: event.target.value }
                    : item,
                ),
              })
            }
            placeholder="URL"
            value={link.url}
          />
          <IconButton
            icon={Trash2}
            label="删除 link"
            onPress={() =>
              onUpdate({
                ...block,
                links: block.links.filter((item) => item.id !== link.id),
              })
            }
            variant="danger-soft"
          />
        </div>
      ))}
      <Button
        className="self-start rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        onPress={() =>
          onUpdate({
            ...block,
            links: [
              ...block.links,
              { id: createId("link"), label: "", url: "" },
            ],
          })
        }
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        添加 Link
      </Button>
    </div>
  );
}

function TextField({
  className,
  isDisabled = false,
  label,
  onChange,
  value,
}: {
  className?: string;
  isDisabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <Input
        className="h-8 rounded-[7px] border-slate-200 text-[12.5px] disabled:bg-slate-50 disabled:text-slate-400"
        disabled={isDisabled}
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <TextArea
        className="rounded-[7px] text-[12.5px] leading-relaxed"
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        value={value}
      />
    </label>
  );
}

function SelectField<TValue extends string>({
  className,
  hideLabel = false,
  label,
  onChange,
  options,
  value,
}: {
  className?: string;
  hideLabel?: boolean;
  label: string;
  onChange: (value: TValue) => void;
  options: Record<TValue, string>;
  value: TValue;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span
        className={cn(
          "text-[11px] font-semibold text-slate-500",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </span>
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

function IconButton({
  disabled = false,
  icon: Icon,
  label,
  onPress,
  variant = "tertiary",
}: {
  disabled?: boolean;
  icon: typeof Eye;
  label: string;
  onPress: () => void;
  variant?: "danger-soft" | "tertiary";
}) {
  return (
    <Button
      aria-label={label}
      className={cn(
        "inline-flex size-[26px] items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900",
        variant === "danger-soft" &&
          "text-slate-400 hover:bg-red-100 hover:text-red-600",
      )}
      isDisabled={disabled}
      isIconOnly
      onPress={onPress}
      size="sm"
      type="button"
      variant={variant}
    >
      <Icon className="size-[15px]" />
    </Button>
  );
}

function createEmptyBlock(kind: ResumeBlockKind): ResumeBlock {
  const id = createId(kind);

  if (kind === "bulletList") {
    return { id, items: [{ id: createId("bullet"), text: "" }], kind };
  }

  if (kind === "tagList") {
    return { id, kind, tags: [""] };
  }

  if (kind === "dateRange") {
    return { endDate: "", id, kind, startDate: "" };
  }

  if (kind === "linkList") {
    return { id, kind, links: [{ id: createId("link"), label: "", url: "" }] };
  }

  return { id, kind, text: "" };
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export { ResumeFormEditor };
