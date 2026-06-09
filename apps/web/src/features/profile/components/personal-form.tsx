"use client";

import { Button } from "@heroui/react";
import { Plus, X } from "lucide-react";

import { jobTypeOptions } from "@/features/profile/data";
import type {
  PersonalCustomField,
  PersonalInfo,
} from "@career-workbench/resume";
import { createId } from "@/features/profile/utils";
import { fieldClassName, TextField } from "./profile-fields";

function PersonalForm({
  jobTypes,
  onJobTypesChange,
  onPersonalChange,
  personal,
}: {
  jobTypes: string[];
  onJobTypesChange: (jobTypes: string[]) => void;
  onPersonalChange: <K extends keyof PersonalInfo>(
    key: K,
    value: PersonalInfo[K],
  ) => void;
  personal: PersonalInfo;
}) {
  const customFields = personal.customFields ?? [];

  function updateCustomField(id: string, patch: Partial<PersonalCustomField>) {
    onPersonalChange(
      "customFields",
      customFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="名"
          required
          value={personal.firstName}
          onChange={(value) => onPersonalChange("firstName", value)}
        />
        <TextField
          label="姓"
          required
          value={personal.lastName}
          onChange={(value) => onPersonalChange("lastName", value)}
        />
        <TextField
          className="md:col-span-2"
          label="职业标题"
          value={personal.headline}
          onChange={(value) => onPersonalChange("headline", value)}
        />
        <TextField
          label="邮箱"
          required
          value={personal.email}
          onChange={(value) => onPersonalChange("email", value)}
        />
        <TextField
          label="电话"
          value={personal.phone}
          onChange={(value) => onPersonalChange("phone", value)}
        />
        <TextField
          label="城市"
          value={personal.city}
          onChange={(value) => onPersonalChange("city", value)}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-muted-foreground">
            工作类型
          </span>
          <select
            className={fieldClassName}
            onChange={(event) =>
              onJobTypesChange(event.target.value ? [event.target.value] : [])
            }
            value={jobTypes[0] ?? ""}
          >
            <option value="">未选择</option>
            {jobTypeOptions.map((jobType) => (
              <option key={jobType} value={jobType}>
                {jobType}
              </option>
            ))}
          </select>
        </label>
        <TextField
          className="md:col-span-2"
          label="LinkedIn 链接"
          value={personal.linkedin}
          onChange={(value) => onPersonalChange("linkedin", value)}
        />
        <TextField
          className="md:col-span-2"
          label="GitHub 链接"
          value={personal.github}
          onChange={(value) => onPersonalChange("github", value)}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">自定义字段</h3>
          <Button
            onPress={() =>
              onPersonalChange("customFields", [
                ...customFields,
                { id: createId("custom"), label: "", value: "" },
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

        {customFields.map((field) => (
          <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]" key={field.id}>
            <input
              aria-label="字段名"
              className={fieldClassName}
              onChange={(event) =>
                updateCustomField(field.id, { label: event.target.value })
              }
              placeholder="字段名"
              value={field.label}
            />
            <input
              aria-label="字段值"
              className={fieldClassName}
              onChange={(event) =>
                updateCustomField(field.id, { value: event.target.value })
              }
              placeholder="字段值"
              value={field.value}
            />
            <Button
              aria-label="删除自定义字段"
              isIconOnly
              onPress={() =>
                onPersonalChange(
                  "customFields",
                  customFields.filter((item) => item.id !== field.id),
                )
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

export { PersonalForm };
