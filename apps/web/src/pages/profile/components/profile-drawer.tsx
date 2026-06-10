"use client";

import { useEffect } from "react";
import { Alert, Button, Drawer, useOverlayState } from "@heroui/react";
import { Save, X } from "lucide-react";

import { sectionMeta } from "@/pages/profile/data";
import type {
  EducationItem,
  JobPreferences,
  PersonalInfo,
  ProfileDraft,
  WorkItem,
} from "@career-workbench/domain";
import type { ProfileSection } from "@/pages/profile/types";
import { PersonalForm } from "./personal-form";
import { EducationForm, SkillsForm, WorkForm } from "./profile-forms";
import { createId } from "@/pages/profile/utils";

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
  const drawerState = useOverlayState({
    isOpen: open,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) {
        onClose();
      }
      onAfterOpenChange?.(nextOpen);
    },
  });

  useEffect(() => {
    onAfterOpenChange?.(open);
  }, [onAfterOpenChange, open]);

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
    <Drawer state={drawerState}>
      <Drawer.Backdrop isDismissable>
        <Drawer.Content className="justify-end" placement="right">
          <Drawer.Dialog className="h-dvh w-[min(760px,100vw)] max-w-[100vw] border-l border-slate-200 bg-white p-0 shadow-2xl sm:w-[min(760px,92vw)]">
            <Drawer.Header className="shrink-0 flex-row items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <Drawer.Heading className="text-lg font-semibold">
                  {meta.label}
                </Drawer.Heading>
                <p className="text-sm font-normal text-slate-500">
                  {meta.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  isDisabled={isSaving}
                  onPress={onSave}
                  type="button"
                  variant="primary"
                >
                  <Save className="size-4" />
                  {isSaving ? "保存中..." : "保存"}
                </Button>
                <Button
                  aria-label="关闭编辑抽屉"
                  isIconOnly
                  onPress={onClose}
                  type="button"
                  variant="tertiary"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </Drawer.Header>
            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-slate-900">
              {saveError ? (
                <Alert className="mb-5" status="danger">
                  <Alert.Content>
                    <Alert.Title>保存失败</Alert.Title>
                    <Alert.Description>{saveError}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}

              {section === "personal" ? (
                <PersonalForm
                  jobTypes={draft.preferences.jobTypes}
                  onJobTypesChange={(jobTypes) =>
                    updatePreferences({ jobTypes })
                  }
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
                      education: draft.education.filter(
                        (item) => item.id !== id,
                      ),
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
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export { ProfileDrawer };
