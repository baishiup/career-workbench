"use client";

import { Button, Drawer } from "antd";
import { Save } from "lucide-react";

import { sectionMeta } from "@/features/profile/data";
import type {
  EducationItem,
  JobPreferences,
  PersonalInfo,
  ProfileDraft,
  WorkItem,
} from "@career-workbench/resume";
import type { ProfileSection } from "@/features/profile/types";
import { PersonalForm } from "./personal-form";
import { EducationForm, SkillsForm, WorkForm } from "./profile-forms";
import { createId } from "@/features/profile/utils";

function ProfileDrawer({
  draft,
  isSaving = false,
  onAfterOpenChange,
  onClose,
  onDraftChange,
  open,
  onSave,
  saveError,
  section,
}: {
  draft: ProfileDraft;
  isSaving?: boolean;
  onAfterOpenChange?: (open: boolean) => void;
  onClose: () => void;
  onDraftChange: (draft: ProfileDraft) => void;
  open: boolean;
  onSave: () => Promise<void> | void;
  saveError?: string | null;
  section: ProfileSection;
}) {
  const meta = sectionMeta[section];

  function updatePersonal<K extends keyof PersonalInfo>(
    key: K,
    value: PersonalInfo[K],
  ) {
    onDraftChange({
      ...draft,
      personal: {
        ...draft.personal,
        [key]: value,
      },
    });
  }

  function updatePreferences(patch: Partial<JobPreferences>) {
    onDraftChange({
      ...draft,
      preferences: {
        ...draft.preferences,
        ...patch,
      },
    });
  }

  function updateEducation(id: string, patch: Partial<EducationItem>) {
    onDraftChange({
      ...draft,
      education: draft.education.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function updateWork(id: string, patch: Partial<WorkItem>) {
    onDraftChange({
      ...draft,
      work: draft.work.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function reorderList(listName: "education" | "work", from: number, to: number) {
    if (from === to) {
      return;
    }

    const nextList = [...draft[listName]];
    const [moved] = nextList.splice(from, 1);
    nextList.splice(to, 0, moved);
    onDraftChange({ ...draft, [listName]: nextList });
  }

  return (
    <Drawer
      destroyOnHidden
      extra={
        <Button
          className="bg-success text-success-foreground hover:bg-success/90"
          disabled={isSaving}
          htmlType="button"
          icon={<Save />}
          onClick={onSave}
          type="primary"
        >
          {isSaving ? "保存中..." : "保存"}
        </Button>
      }
      mask={{
        closable: true,
      }}
      afterOpenChange={onAfterOpenChange}
      onClose={onClose}
      open={open}
      placement="right"
      title={
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{meta.label}</h2>
          <p className="text-sm font-normal text-muted-foreground">
            {meta.description}
          </p>
        </div>
      }
      size={760}
    >
      <div className="px-5 py-5">
        {saveError ? (
          <p className="mb-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            保存失败：{saveError}
          </p>
        ) : null}

        {section === "personal" ? (
          <PersonalForm
            jobTypes={draft.preferences.jobTypes}
            onJobTypesChange={(jobTypes) => updatePreferences({ jobTypes })}
            onPersonalChange={updatePersonal}
            personal={draft.personal}
          />
        ) : null}

        {section === "education" ? (
          <EducationForm
            education={draft.education}
            onAdd={() =>
              onDraftChange({
                ...draft,
                education: [
                  ...draft.education,
                  {
                    id: createId("edu"),
                    school: "",
                    degree: "",
                    major: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  },
                ],
              })
            }
            onDelete={(id) =>
              onDraftChange({
                ...draft,
                education: draft.education.filter((item) => item.id !== id),
              })
            }
            onReorder={(from, to) => reorderList("education", from, to)}
            onUpdate={updateEducation}
          />
        ) : null}

        {section === "work" ? (
          <WorkForm
            onAdd={() =>
              onDraftChange({
                ...draft,
                work: [
                  ...draft.work,
                  {
                    id: createId("work"),
                    company: "",
                    title: "",
                    location: "",
                    jobType: "全职",
                    startDate: "",
                    endDate: "",
                    current: false,
                    summary: "",
                    bullets: [""],
                  },
                ],
              })
            }
            onDelete={(id) =>
              onDraftChange({
                ...draft,
                work: draft.work.filter((item) => item.id !== id),
              })
            }
            onReorder={(from, to) => reorderList("work", from, to)}
            onUpdate={updateWork}
            work={draft.work}
          />
        ) : null}

        {section === "skills" ? (
          <SkillsForm
            onChange={(skills) => onDraftChange({ ...draft, skills })}
            skills={draft.skills}
          />
        ) : null}
      </div>
    </Drawer>
  );
}

export { ProfileDrawer };
