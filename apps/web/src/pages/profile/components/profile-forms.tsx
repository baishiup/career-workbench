"use client";

import { useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  ComboBox,
  Input,
  ListBox,
  Select,
  Tag,
  TagGroup,
} from "@heroui/react";
import { Plus } from "lucide-react";

import { jobTypeOptions, skillSuggestions } from "@/pages/profile/data";
import type {
  CustomModule,
  EducationItem,
  JobPreferences,
  ProjectItem,
  WorkItem,
} from "@career-workbench/domain";
import { MonthRangeField } from "@/components/forms/month-range-field";
import {
  CustomFieldsEditor,
  RichTextField,
  TagsField,
  TextField,
} from "./profile-fields";
import { SortableEditorCard } from "./sortable-editor-card";

function PreferencesForm({
  onPreferencesChange,
  preferences,
}: {
  onPreferencesChange: (patch: Partial<JobPreferences>) => void;
  preferences: JobPreferences;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        className="md:col-span-2"
        label="求职方向"
        required
        value={preferences.jobFunction}
        onChange={(value) => onPreferencesChange({ jobFunction: value })}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-500">工作类型</span>
        <Select
          aria-label="工作类型"
          fullWidth
          onSelectionChange={(key) => {
            onPreferencesChange({ jobTypes: key ? [String(key)] : [] });
          }}
          placeholder="未选择"
          selectedKey={preferences.jobTypes[0] ?? null}
          variant="secondary"
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {jobTypeOptions.map((jobType) => (
                <ListBox.Item id={jobType} key={jobType}>
                  {jobType}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <TextField
        label="期望工作城市"
        value={preferences.targetCity}
        onChange={(value) => onPreferencesChange({ targetCity: value })}
      />
      <TextField
        label="薪资期望"
        value={preferences.salaryExpectation}
        onChange={(value) => onPreferencesChange({ salaryExpectation: value })}
      />
      <Checkbox
        className="md:col-span-2"
        isSelected={preferences.openToRemote}
        onChange={(checked) => onPreferencesChange({ openToRemote: checked })}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>接受远程工作</Checkbox.Content>
      </Checkbox>
      <CustomFieldsEditor
        className="md:col-span-2"
        fields={preferences.customFields}
        onChange={(customFields) => onPreferencesChange({ customFields })}
      />
    </div>
  );
}

/** 教育经历单条字段组，profile 抽屉与简历编辑器共用。 */
function EducationItemFields({
  item,
  onChange,
}: {
  item: EducationItem;
  onChange: (patch: Partial<EducationItem>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        className="md:col-span-2"
        label="学校"
        required
        value={item.school}
        onChange={(value) => onChange({ school: value })}
      />
      <TextField
        label="学历"
        value={item.degree}
        onChange={(value) => onChange({ degree: value })}
      />
      <TextField
        label="专业"
        value={item.major}
        onChange={(value) => onChange({ major: value })}
      />
      <MonthRangeField
        className="md:col-span-2"
        onChange={(range) => onChange(range)}
        value={{
          current: item.current,
          endDate: item.endDate,
          startDate: item.startDate,
        }}
      />
      <RichTextField
        className="md:col-span-2"
        label="补充说明"
        onChange={(description) => onChange({ description })}
        value={item.description}
      />
    </div>
  );
}

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
          <EducationItemFields
            item={item}
            onChange={(patch) => onUpdate(item.id, patch)}
          />
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加教育经历
      </Button>
    </div>
  );
}

/** 工作经历单条字段组，profile 抽屉与简历编辑器共用。 */
function WorkItemFields({
  item,
  onChange,
}: {
  item: WorkItem;
  onChange: (patch: Partial<WorkItem>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        className="md:col-span-2"
        label="职位名称"
        required
        value={item.title}
        onChange={(value) => onChange({ title: value })}
      />
      <TextField
        className="md:col-span-2"
        label="公司"
        required
        value={item.company}
        onChange={(value) => onChange({ company: value })}
      />
      <MonthRangeField
        className="md:col-span-2"
        onChange={(range) => onChange(range)}
        value={{
          current: item.current,
          endDate: item.endDate,
          startDate: item.startDate,
        }}
      />
      <RichTextField
        className="md:col-span-2"
        label="工作描述"
        onChange={(description) => onChange({ description })}
        value={item.description}
      />
      <TagsField
        className="md:col-span-2"
        label="技能"
        onChange={(skills) => onChange({ skills })}
        values={item.skills}
      />
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
          <WorkItemFields
            item={item}
            onChange={(patch) => onUpdate(item.id, patch)}
          />
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加工作经历
      </Button>
    </div>
  );
}

/** 项目经历单条字段组，profile 抽屉与简历编辑器共用。 */
function ProjectItemFields({
  item,
  onChange,
}: {
  item: ProjectItem;
  onChange: (patch: Partial<ProjectItem>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        className="md:col-span-2"
        label="项目名称"
        required
        value={item.name}
        onChange={(value) => onChange({ name: value })}
      />
      <TextField
        label="角色"
        value={item.role}
        onChange={(value) => onChange({ role: value })}
      />
      <div className="hidden md:block" />
      <MonthRangeField
        className="md:col-span-2"
        onChange={(range) => onChange(range)}
        value={{
          current: item.current,
          endDate: item.endDate,
          startDate: item.startDate,
        }}
      />
      <RichTextField
        className="md:col-span-2"
        label="项目描述"
        onChange={(description) => onChange({ description })}
        value={item.description}
      />
      <TagsField
        className="md:col-span-2"
        label="技能"
        onChange={(skills) => onChange({ skills })}
        values={item.skills}
      />
    </div>
  );
}

function ProjectsForm({
  onAdd,
  onDelete,
  onReorder,
  onUpdate,
  projects,
}: {
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, patch: Partial<ProjectItem>) => void;
  projects: ProjectItem[];
}) {
  const dragIndexRef = useRef<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {projects.map((item, index) => (
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
          title={`项目经历 ${index + 1}`}
        >
          <ProjectItemFields
            item={item}
            onChange={(patch) => onUpdate(item.id, patch)}
          />
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加项目经历
      </Button>
    </div>
  );
}

/** 自定义模块单条字段组：标题 + 富文本内容。 */
function CustomModuleFields({
  item,
  onChange,
}: {
  item: CustomModule;
  onChange: (patch: Partial<CustomModule>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField
        label="模块名称"
        required
        value={item.name}
        onChange={(value) => onChange({ name: value })}
      />
      <RichTextField
        label="内容"
        onChange={(content) => onChange({ content })}
        value={item.content}
      />
    </div>
  );
}

function CustomForm({
  custom,
  onAdd,
  onDelete,
  onReorder,
  onUpdate,
}: {
  custom: CustomModule[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onUpdate: (id: string, patch: Partial<CustomModule>) => void;
}) {
  const dragIndexRef = useRef<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {custom.map((item, index) => (
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
          title={item.name || `自定义模块 ${index + 1}`}
        >
          <CustomModuleFields
            item={item}
            onChange={(patch) => onUpdate(item.id, patch)}
          />
        </SortableEditorCard>
      ))}
      <Button onPress={onAdd} type="button" variant="outline">
        <Plus className="size-4" />
        添加自定义模块
      </Button>
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

export {
  CustomForm,
  CustomModuleFields,
  EducationForm,
  EducationItemFields,
  PreferencesForm,
  ProjectItemFields,
  ProjectsForm,
  SkillsForm,
  WorkForm,
  WorkItemFields,
};
