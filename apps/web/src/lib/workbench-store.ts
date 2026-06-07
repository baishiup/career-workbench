"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { initialProfile } from "@/features/profile/data";
import type {
  JobPreferences,
  ProfileDraft,
} from "@career-workbench/resume";

type ResumeRecord = {
  id: string;
  title: string;
  type: "上传简历" | "生成简历";
  updated: string;
  source: string;
  score: number;
  status: "可导出" | "待补事实" | "待审阅" | "已解析";
  iconKey: "sparkles" | "file" | "education";
  tone: string;
};

const initialResumes: ResumeRecord[] = [
  {
    id: "frontend-ai",
    title: "前端 AI 产品简历",
    type: "生成简历",
    updated: "2 小时前编辑",
    source: "基础简历 + ThriveCart JD",
    score: 96,
    status: "可导出",
    iconKey: "sparkles",
    tone: "bg-info/10 text-info",
  },
  {
    id: "base-2026",
    title: "基础简历 2026",
    type: "上传简历",
    updated: "昨天更新",
    source: "PDF 导入 · 英文",
    score: 82,
    status: "待补事实",
    iconKey: "file",
    tone: "bg-secondary text-secondary-foreground",
  },
  {
    id: "senior-platform",
    title: "高级前端平台简历",
    type: "生成简历",
    updated: "4 天前编辑",
    source: "DataCamp + Emergent 目标 JD",
    score: 88,
    status: "待审阅",
    iconKey: "education",
    tone: "bg-warning/20 text-warning-foreground",
  },
];

type PersistedProfileDraft = Partial<
  Omit<ProfileDraft, "personal" | "preferences">
> & {
  personal?: Partial<ProfileDraft["personal"]>;
  preferences?: Partial<ProfileDraft["preferences"]>;
};

function normalizeProfile(profile: PersistedProfileDraft): ProfileDraft {
  const personal = profile.personal ?? {};
  const preferences = profile.preferences ?? {};

  return {
    ...initialProfile,
    ...profile,
    personal: {
      ...initialProfile.personal,
      ...personal,
      customFields: Array.isArray(personal.customFields)
        ? personal.customFields
        : [],
    },
    preferences: {
      ...initialProfile.preferences,
      ...preferences,
      jobTypes:
        Array.isArray(preferences.jobTypes) && preferences.jobTypes.length > 0
          ? preferences.jobTypes
          : initialProfile.preferences.jobTypes,
      workAuthorization: Array.isArray(preferences.workAuthorization)
        ? preferences.workAuthorization
        : initialProfile.preferences.workAuthorization,
    },
    education: Array.isArray(profile.education)
      ? profile.education
      : initialProfile.education,
    work: Array.isArray(profile.work) ? profile.work : initialProfile.work,
    projects: Array.isArray(profile.projects)
      ? profile.projects
      : initialProfile.projects,
    skills: Array.isArray(profile.skills) ? profile.skills : initialProfile.skills,
  };
}

// Cross-view product state stays local for the current front-end MVP. It mirrors
// the future Supabase boundaries: profile facts, resume artifacts, and first-run state.
type WorkbenchState = {
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  profile: ProfileDraft;
  resumes: ResumeRecord[];
  selectedJobId: string;
  selectedResumeId: string;
  addUploadedResume: (fileName: string, jobFunction: string) => string;
  completeOnboarding: (preferences: JobPreferences) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setProfile: (profile: ProfileDraft) => void;
  setSelectedJobId: (jobId: string) => void;
  setSelectedResumeId: (resumeId: string) => void;
};

export const useWorkbenchStore = create<WorkbenchState>()(
  persist(
    (set) => ({
      hasHydrated: true,
      hasCompletedOnboarding: false,
      profile: initialProfile,
      resumes: initialResumes,
      selectedJobId: "thrivecart",
      selectedResumeId: "frontend-ai",
      addUploadedResume: (fileName, jobFunction) => {
        const id = `uploaded-${Date.now()}`;
        const title = fileName.replace(/\.(pdf|docx?|rtf)$/i, "") || "上传简历";

        set((state) => ({
          resumes: [
            {
              id,
              title,
              type: "上传简历",
              updated: "刚刚解析",
              source: jobFunction
                ? `Onboarding upload · ${jobFunction}`
                : "Onboarding upload",
              score: 78,
              status: "已解析",
              iconKey: "file",
              tone: "bg-success/10 text-success",
            },
            ...state.resumes,
          ],
          selectedResumeId: id,
        }));

        return id;
      },
      completeOnboarding: (preferences) =>
        set((state) => ({
          hasCompletedOnboarding: true,
          profile: {
            ...state.profile,
            preferences,
            personal: {
              ...state.profile.personal,
              headline:
                preferences.jobFunction || state.profile.personal.headline,
            },
          },
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setProfile: (profile) => set({ profile }),
      setSelectedJobId: (selectedJobId) => set({ selectedJobId }),
      setSelectedResumeId: (selectedResumeId) => set({ selectedResumeId }),
    }),
    {
      name: "career-workbench-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        profile: state.profile,
        resumes: state.resumes,
        selectedJobId: state.selectedJobId,
        selectedResumeId: state.selectedResumeId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<WorkbenchState>;

        return {
          ...currentState,
          ...persisted,
          hasHydrated: true,
          profile: persisted.profile
            ? normalizeProfile(persisted.profile)
            : currentState.profile,
        };
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type { ResumeRecord };
