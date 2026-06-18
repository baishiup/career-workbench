"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button, Input } from "@heroui/react";
import { Loader2, Plus, Trash2, Upload, UserRound, X } from "lucide-react";

import type {
  PersonalCustomField,
  PersonalInfo,
} from "@career-workbench/domain";
import { uploadProfileAvatar } from "@/lib/profile/api";
import { createId } from "@/pages/profile/utils";
import { TextField } from "./profile-fields";

function PersonalForm({
  onPersonalChange,
  personal,
}: {
  onPersonalChange: <K extends keyof PersonalInfo>(
    key: K,
    value: PersonalInfo[K],
  ) => void;
  personal: PersonalInfo;
}) {
  const customFields = personal.customFields ?? [];
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarUrl = personal.avatarUrl.trim();

  function updateCustomField(id: string, patch: Partial<PersonalCustomField>) {
    onPersonalChange(
      "customFields",
      customFields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    );
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isUploadingAvatar) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const uploadedUrl = await uploadProfileAvatar(file);
      onPersonalChange("avatarUrl", uploadedUrl);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "头像上传失败。");
    } finally {
      event.target.value = "";
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {avatarUrl ? (
            <img
              alt="头像预览"
              className="size-full object-cover"
              src={avatarUrl}
            />
          ) : (
            <UserRound className="size-8 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">头像</p>
          <p className="mt-1 text-xs text-slate-500">
            可选。支持 JPG、PNG、WebP，最大 2MB。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              isDisabled={isUploadingAvatar}
              onPress={() => avatarInputRef.current?.click()}
              size="sm"
              type="button"
              variant="secondary"
            >
              {isUploadingAvatar ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {avatarUrl ? "更换头像" : "上传头像"}
            </Button>
            {avatarUrl ? (
              <Button
                isDisabled={isUploadingAvatar}
                onPress={() => onPersonalChange("avatarUrl", "")}
                size="sm"
                type="button"
                variant="danger-soft"
              >
                <Trash2 className="size-4" />
                移除
              </Button>
            ) : null}
          </div>
          <input
            ref={avatarInputRef}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            type="file"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          className="md:col-span-2"
          label="姓名"
          required
          value={personal.fullName}
          onChange={(value) => onPersonalChange("fullName", value)}
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
          label="现居城市"
          value={personal.city}
          onChange={(value) => onPersonalChange("city", value)}
        />
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

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">自定义字段</h3>
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
          <div
            className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]"
            key={field.id}
          >
            <Input
              aria-label="字段名"
              fullWidth
              onChange={(event) =>
                updateCustomField(field.id, { label: event.target.value })
              }
              placeholder="字段名"
              value={field.label}
              variant="secondary"
            />
            <Input
              aria-label="字段值"
              fullWidth
              onChange={(event) =>
                updateCustomField(field.id, { value: event.target.value })
              }
              placeholder="字段值"
              value={field.value}
              variant="secondary"
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
