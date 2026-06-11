"use client";

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Tag,
  TagGroup,
  TextArea,
} from "@heroui/react";
import { Plus, X } from "lucide-react";

import { skillSuggestions } from "@/pages/profile/data";
import type { EducationItem, WorkItem } from "@career-workbench/domain";
import { DateField, TextAreaField, TextField } from "./profile-fields";
import { SortableEditorCard } from "./sortable-editor-card";

function EducationForm({
  education,
  onAdd,
  onDelete,
  onReorder,
  onUpdate,
}: {
  education: EducationItem[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, patch: Partial<EducationItem>) => void;
}) {
  const dragIndexRef = useRef<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {education.map((item, index) => (
        <SortableEditorCard
          dragIndexRef={dragIndexRef}
          index={index}
          key={item.id}
          onDelete={() => onDelete(item.id)}
          onDragEnd={() => {
            dragIndexRef.current = null;
          }}
          onDragStartIndex={(nextIndex) => {
            dragIndexRef.current = nextIndex;
          }}
          onReorder={onReorder}
          title={`教育经历 ${index + 1}`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              className="md:col-span-2"
              label="学校"
              required
              value={item.school}
              onChange={(value) => onUpdate(item.id, { school: value })}
            />
            <TextField
              label="学历"
              value={item.degree}
              onChange={(value) => onUpdate(item.id, { degree: value })}
            />
            <TextField
              label="专业"
              value={item.major}
              onChange={(value) => onUpdate(item.id, { major: value })}
            />
            <TextField
              label="地点"
              value={item.location}
              onChange={(value) => onUpdate(item.id, { location: value })}
            />
            <DateField
              label="开始日期"
              value={item.startDate}
              onChange={(value) => onUpdate(item.id, { startDate: value })}
            />
            <DateField
              label="结束日期"
              value={item.endDate}
              onChange={(value) => onUpdate(item.id, { endDate: value })}
            />
            <TextAreaField
              className="md:col-span-2"
              label="补充说明"
              value={item.description}
              onChange={(value) => onUpdate(item.id, { description: value })}
            />
          </div>
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加教育经历
      </Button>
    </div>
  );
}

function WorkForm({
  onAdd,
  onDelete,
  onReorder,
  onUpdate,
  work,
}: {
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  work: WorkItem[];
}) {
  const dragIndexRef = useRef<number | null>(null);

  function updateBullet(item: WorkItem, bulletIndex: number, value: string) {
    const nextBullets = [...item.bullets];
    nextBullets[bulletIndex] = value;
    onUpdate(item.id, { bullets: nextBullets });
  }

  return (
    <div className="flex flex-col gap-4">
      {work.map((item, index) => (
        <SortableEditorCard
          dragIndexRef={dragIndexRef}
          index={index}
          key={item.id}
          onDelete={() => onDelete(item.id)}
          onDragEnd={() => {
            dragIndexRef.current = null;
          }}
          onDragStartIndex={(nextIndex) => {
            dragIndexRef.current = nextIndex;
          }}
          onReorder={onReorder}
          title={`工作经历 ${index + 1}`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <WorkCoreFields item={item} onUpdate={onUpdate} />
            <TextAreaField
              className="md:col-span-2"
              label="经历摘要"
              value={item.summary}
              onChange={(value) => onUpdate(item.id, { summary: value })}
            />
            <WorkBulletList
              item={item}
              onUpdate={onUpdate}
              updateBullet={updateBullet}
            />
          </div>
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加工作经历
      </Button>
    </div>
  );
}

function WorkCoreFields({
  item,
  onUpdate,
}: {
  item: WorkItem;
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
}) {
  return (
    <>
      <TextField
        className="md:col-span-2"
        label="职位名称"
        required
        value={item.title}
        onChange={(value) => onUpdate(item.id, { title: value })}
      />
      <TextField
        className="md:col-span-2"
        label="公司"
        required
        value={item.company}
        onChange={(value) => onUpdate(item.id, { company: value })}
      />
      <TextField
        label="工作类型"
        value={item.jobType}
        onChange={(value) => onUpdate(item.id, { jobType: value })}
      />
      <TextField
        label="地点"
        value={item.location}
        onChange={(value) => onUpdate(item.id, { location: value })}
      />
      <DateField
        label="开始日期"
        value={item.startDate}
        onChange={(value) => onUpdate(item.id, { startDate: value })}
      />
      <DateField
        label="结束日期"
        value={item.endDate}
        onChange={(value) => onUpdate(item.id, { endDate: value })}
      />
      <Checkbox
        className="md:col-span-2"
        isSelected={item.current}
        onChange={(checked) => onUpdate(item.id, { current: checked })}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>我目前仍在这里工作</Checkbox.Content>
      </Checkbox>
    </>
  );
}

function WorkBulletList({
  item,
  onUpdate,
  updateBullet,
}: {
  item: WorkItem;
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  updateBullet: (item: WorkItem, bulletIndex: number, value: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">工作描述</p>
        <Button
          onPress={() => onUpdate(item.id, { bullets: [...item.bullets, ""] })}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          添加要点
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {item.bullets.map((bullet, bulletIndex) => (
          <div className="flex items-start gap-2" key={bulletIndex}>
            <span className="pt-2 text-sm font-semibold text-slate-500">•</span>
            <TextArea
              className="min-h-10 py-2"
              fullWidth
              onChange={(event) =>
                updateBullet(item, bulletIndex, event.target.value)
              }
              rows={2}
              value={bullet}
              variant="secondary"
            />
            <Button
              aria-label="删除要点"
              isIconOnly
              onPress={() =>
                onUpdate(item.id, {
                  bullets: item.bullets.filter(
                    (_, currentIndex) => currentIndex !== bulletIndex,
                  ),
                })
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

function SkillsForm({
  onChange,
  skills,
}: {
  onChange: (skills: string[]) => void;
  skills: string[];
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const normalizedSkills = useMemo(
    () => new Set(skills.map((skill) => skill.toLowerCase())),
    [skills],
  );
  const skillItems = useMemo(
    () => skills.map((skill) => ({ id: skill, name: skill })),
    [skills],
  );
  const filteredSuggestions = skillSuggestions
    .filter((suggestion) => !normalizedSkills.has(suggestion.toLowerCase()))
    .filter((suggestion) =>
      suggestion.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .slice(0, 6);

  function addSkill(value: string) {
    const skill = value.trim();
    if (!skill || normalizedSkills.has(skill.toLowerCase())) {
      setQuery("");
      return;
    }

    onChange([...skills, skill]);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-4">
      <TagGroup
        aria-label="技能标签"
        onRemove={(keys) => {
          const keysToRemove = new Set(Array.from(keys, String));
          onChange(skills.filter((skill) => !keysToRemove.has(skill)));
        }}
        size="lg"
      >
        <TagGroup.List items={skillItems}>
          {(item) => (
            <Tag id={item.id}>
              {item.name}
              <Tag.RemoveButton aria-label={`删除 ${item.name}`} />
            </Tag>
          )}
        </TagGroup.List>
      </TagGroup>

      <SkillInput
        addSkill={addSkill}
        filteredSuggestions={filteredSuggestions}
        isFocused={isFocused}
        normalizedSkills={normalizedSkills}
        query={query}
        setIsFocused={setIsFocused}
        setQuery={setQuery}
      />
    </div>
  );
}

function SkillInput({
  addSkill,
  filteredSuggestions,
  isFocused,
  normalizedSkills,
  query,
  setIsFocused,
  setQuery,
}: {
  addSkill: (value: string) => void;
  filteredSuggestions: string[];
  isFocused: boolean;
  normalizedSkills: Set<string>;
  query: string;
  setIsFocused: (isFocused: boolean) => void;
  setQuery: (query: string) => void;
}) {
  const canCreate =
    query.trim() &&
    !normalizedSkills.has(query.trim().toLowerCase()) &&
    !filteredSuggestions.some(
      (suggestion) => suggestion.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <div className="relative max-w-md">
      <Input
        fullWidth
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addSkill(query);
          }
        }}
        placeholder="添加技能..."
        value={query}
        variant="secondary"
      />
      {isFocused && (query || filteredSuggestions.length > 0) ? (
        <div className="absolute left-0 top-11 z-10 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
          {filteredSuggestions.map((suggestion) => (
            <Button
              fullWidth
              key={suggestion}
              onPress={() => addSkill(suggestion)}
              type="button"
              variant="tertiary"
            >
              {suggestion}
            </Button>
          ))}
          {canCreate ? (
            <Button
              fullWidth
              onPress={() => addSkill(query)}
              type="button"
              variant="secondary"
            >
              {`创建“${query.trim()}”`}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { EducationForm, SkillsForm, WorkForm };
