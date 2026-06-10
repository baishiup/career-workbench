"use client";

import { useState } from "react";
import { Button, Checkbox, Input, ListBox, Select, TextArea } from "@heroui/react";
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
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ResumeFormEditorProps = {
  document: ResumeDocument;
  onDocumentChange: (document: ResumeDocument) => void;
  onSectionFocus: (sectionId: string) => void;
  selectedSectionId: string | null;
};

const sectionKindLabels: Record<ResumeSectionKind, string> = {
  custom: "Custom",
  education: "Education",
  personal: "Personal",
  projects: "Projects",
  skills: "Skills",
  summary: "Summary",
  work: "Work",
};

const blockKindLabels: Record<ResumeBlockKind, string> = {
  bulletList: "Bullet List",
  dateRange: "Date Range",
  linkList: "Link List",
  paragraph: "Paragraph",
  tagList: "Tag List",
  text: "Text",
};

function ResumeFormEditor({
  document,
  onDocumentChange,
  onSectionFocus,
  selectedSectionId,
}: ResumeFormEditorProps) {
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

    onDocumentChange({ ...document, sections: [...document.sections, section] });
    onSectionFocus(section.id);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid gap-2.5 md:grid-cols-2">
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
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <h3 className="text-sm font-semibold text-slate-900">Sections</h3>
        <Button onPress={addSection} size="sm" type="button" variant="outline">
          <Plus className="size-4" />
          添加 Section
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

  return (
    <section
      className={cn(
        "rounded-xl border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        isSelected ? "border-blue-400 ring-3 ring-blue-400/20" : "border-slate-200",
      )}
      onFocus={onFocus}
    >
      <div className="mb-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <Button
            className="min-w-0 text-left text-sm font-semibold text-slate-900"
            onPress={onFocus}
            type="button"
            variant="tertiary"
          >
            {section.title || sectionKindLabels[section.kind]}
          </Button>
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

        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_150px]">
          <TextField
            label="Section 标题"
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

      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2.5 sm:flex-row sm:items-end">
        <SelectField
          className="sm:w-48"
          label="新增 Block"
          onChange={(kind) => setNewBlockKind(kind as ResumeBlockKind)}
          options={blockKindLabels}
          value={newBlockKind}
        />
        <Button onPress={addBlock} type="button" variant="outline">
          <Plus className="size-4" />
          添加 Block
        </Button>
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
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          {blockKindLabels[block.kind]}
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
        <div className="grid gap-2.5 md:grid-cols-3">
          <TextField
            label="开始日期"
            onChange={(startDate) => onUpdate({ ...block, startDate })}
            value={block.startDate}
          />
          <TextField
            label="结束日期"
            onChange={(endDate) => onUpdate({ ...block, endDate })}
            value={block.endDate}
          />
          <Checkbox
            className="items-end pb-1.5"
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
          <TextArea
            fullWidth
            onChange={(event) => updateItem(item.id, event.target.value)}
            rows={3}
            value={item.text}
            variant="secondary"
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
            fullWidth
            onChange={(event) => {
              const tags = [...block.tags];
              tags[index] = event.target.value;
              onUpdate({ ...block, tags });
            }}
            value={tag}
            variant="secondary"
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
        <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_auto]" key={link.id}>
          <Input
            fullWidth
            onChange={(event) =>
              onUpdate({
                ...block,
                links: block.links.map((item) =>
                  item.id === link.id ? { ...item, label: event.target.value } : item,
                ),
              })
            }
            placeholder="Label"
            value={link.label}
            variant="secondary"
          />
          <Input
            fullWidth
            onChange={(event) =>
              onUpdate({
                ...block,
                links: block.links.map((item) =>
                  item.id === link.id ? { ...item, url: event.target.value } : item,
                ),
              })
            }
            placeholder="URL"
            value={link.url}
            variant="secondary"
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
        onPress={() =>
          onUpdate({
            ...block,
            links: [...block.links, { id: createId("link"), label: "", url: "" }],
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
  label,
  onChange,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <Input
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        value={value}
        variant="secondary"
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
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <TextArea
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        value={value}
        variant="secondary"
      />
    </label>
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
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <Select
        aria-label={label}
        fullWidth
        onSelectionChange={(key) => {
          if (key) {
            onChange(String(key) as TValue);
          }
        }}
        selectedKey={value}
        variant="secondary"
      >
        <Select.Trigger>
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
      isDisabled={disabled}
      isIconOnly
      onPress={onPress}
      size="sm"
      type="button"
      variant={variant}
    >
      <Icon className="size-4" />
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
