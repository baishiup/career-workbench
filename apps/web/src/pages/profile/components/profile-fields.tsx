import { Button, Input, Tag, TagGroup, TextArea } from "@heroui/react";
import { Plus, X } from "lucide-react";
import { useState } from "react";

import type { CustomField, RichText } from "@career-workbench/domain";
import { RichTextEditor } from "@/components/rich-text/rich-text-editor";
import { createId } from "@/pages/profile/utils";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full rounded-lg border border-transparent bg-slate-100/60 px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-400/20";

const textareaClassName =
  "min-h-20 w-full rounded-lg border border-transparent bg-slate-100/60 px-3 py-2 text-sm font-medium leading-5 text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-400/20";

function TextField({
  className,
  label,
  onChange,
  required = false,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold text-slate-500">
        {required ? <span className="text-red-600">*</span> : null} {label}
      </span>
      <Input
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        value={value}
        variant="secondary"
      />
    </label>
  );
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return <TextField label={label} onChange={onChange} value={value} />;
}

function TextAreaField({
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
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <TextArea
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        value={value}
        variant="secondary"
      />
    </label>
  );
}

function RichTextField({
  className,
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  label: string;
  onChange: (value: RichText) => void;
  placeholder?: string;
  value: RichText;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <RichTextEditor
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function TagsField({
  className,
  label,
  onChange,
  placeholder = "输入后回车添加",
  values,
}: {
  className?: string;
  label: string;
  onChange: (values: string[]) => void;
  placeholder?: string;
  values: string[];
}) {
  const [query, setQuery] = useState("");

  function addTag(value: string) {
    const tag = value.trim();
    const exists = values.some(
      (item) => item.toLowerCase() === tag.toLowerCase(),
    );

    if (!tag || exists) {
      setQuery("");
      return;
    }

    onChange([...values, tag]);
    setQuery("");
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      {values.length > 0 ? (
        <TagGroup
          aria-label={label}
          onRemove={(keys) => {
            const removed = new Set(Array.from(keys, String));
            onChange(values.filter((tag) => !removed.has(tag)));
          }}
          size="sm"
        >
          <TagGroup.List items={values.map((tag) => ({ id: tag, name: tag }))}>
            {(item) => (
              <Tag id={item.id}>
                {item.name}
                <Tag.RemoveButton aria-label={`删除 ${item.name}`} />
              </Tag>
            )}
          </TagGroup.List>
        </TagGroup>
      ) : null}
      <Input
        fullWidth
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag(query);
          }
        }}
        placeholder={placeholder}
        value={query}
        variant="secondary"
      />
    </div>
  );
}

function CustomFieldsEditor({
  className,
  fields,
  onChange,
}: {
  className?: string;
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  function updateField(id: string, patch: Partial<CustomField>) {
    onChange(
      fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">自定义字段</p>
        <Button
          onPress={() =>
            onChange([
              ...fields,
              { id: createId("custom-field"), label: "", value: "" },
            ])
          }
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          添加字段
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {fields.map((field) => (
          <div
            className="grid gap-2 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)_auto]"
            key={field.id}
          >
            <Input
              fullWidth
              onChange={(event) =>
                updateField(field.id, { label: event.target.value })
              }
              placeholder="字段名"
              value={field.label}
              variant="secondary"
            />
            <Input
              fullWidth
              onChange={(event) =>
                updateField(field.id, { value: event.target.value })
              }
              placeholder="内容"
              value={field.value}
              variant="secondary"
            />
            <Button
              aria-label="删除字段"
              isIconOnly
              onPress={() =>
                onChange(fields.filter((item) => item.id !== field.id))
              }
              size="sm"
              type="button"
              variant="danger-soft"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  CustomFieldsEditor,
  DateField,
  fieldClassName,
  RichTextField,
  TagsField,
  TextAreaField,
  textareaClassName,
  TextField,
};
