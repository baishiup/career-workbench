"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

type WorkbenchState = {
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  resumes: ResumeRecord[];
  selectedJobId: string;
  selectedResumeId: string;
  addUploadedResume: (fileName: string, jobFunction: string) => string;
  completeOnboarding: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setSelectedJobId: (jobId: string) => void;
  setSelectedResumeId: (resumeId: string) => void;
};

type PersistedWorkbenchState = Pick<
  WorkbenchState,
  | "hasCompletedOnboarding"
  | "resumes"
  | "selectedJobId"
  | "selectedResumeId"
>;

export const useWorkbenchStore = create<WorkbenchState>()(
  persist<WorkbenchState, [], [], PersistedWorkbenchState>(
    (set) => ({
      hasHydrated: true,
      hasCompletedOnboarding: false,
      resumes: [],
      selectedJobId: "",
      selectedResumeId: "",
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
              tone: "bg-emerald-600/10 text-emerald-600",
            },
            ...state.resumes,
          ],
          selectedResumeId: id,
        }));

        return id;
      },
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSelectedJobId: (selectedJobId) => set({ selectedJobId }),
      setSelectedResumeId: (selectedResumeId) => set({ selectedResumeId }),
    }),
    {
      name: "career-workbench-store",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state): PersistedWorkbenchState => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
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
        };
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export type { ResumeRecord };
