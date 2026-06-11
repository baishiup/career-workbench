"use client";

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  ComboBox,
  Input,
  ListBox,
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
        normalizedSkills={normalizedSkills}
        query={query}
        setQuery={setQuery}
      />
    </div>
  );
}

function SkillInput({
  addSkill,
  filteredSuggestions,
  normalizedSkills,
  query,
  setQuery,
}: {
  addSkill: (value: string) => void;
  filteredSuggestions: string[];
  normalizedSkills: Set<string>;
  query: string;
  setQuery: (query: string) => void;
}) {
  const createOptionId = "__create_skill__";
  const canCreate =
    query.trim() &&
    !normalizedSkills.has(query.trim().toLowerCase()) &&
    !filteredSuggestions.some(
      (suggestion) => suggestion.toLowerCase() === query.trim().toLowerCase(),
    );

  return (
    <ComboBox
      allowsCustomValue
      className="max-w-md"
      fullWidth
      inputValue={query}
      menuTrigger="focus"
      onInputChange={setQuery}
      onSelectionChange={(key) => {
        if (!key) {
          return;
        }

        addSkill(String(key) === createOptionId ? query : String(key));
      }}
      variant="secondary"
    >
      <ComboBox.InputGroup>
        <Input
          fullWidth
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill(query);
            }
          }}
          placeholder="添加技能..."
        />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox aria-label="技能建议">
          {filteredSuggestions.map((suggestion) => (
            <ListBox.Item id={suggestion} key={suggestion}>
              {suggestion}
            </ListBox.Item>
          ))}
          {canCreate ? (
            <ListBox.Item id={createOptionId}>
              {`创建“${query.trim()}”`}
            </ListBox.Item>
          ) : null}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

export { EducationForm, SkillsForm, WorkForm };
