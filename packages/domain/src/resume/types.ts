/**
 * 投递简历正文模型。
 *
 * 简历 = 一组有序、可显隐的模块（ResumeModule）。每个模块复用 profile/types.ts
 * 里定义的同一套内容类型（PersonalInfo / EducationItem / WorkItem ...），
 * 简历额外承载排序与显隐；Profile 则是这些内容的扁平事实层。两边共用字段类型。
 */

import type {
  CustomModule,
  EducationItem,
  JobPreferences,
  PersonalInfo,
  ProjectItem,
  WorkItem,
} from "../profile/types.ts";

/** 固定的简历模块类型。 */
type ResumeModuleKind =
  | "personal"
  | "preferences"
  | "education"
  | "work"
  | "projects"
  | "skills"
  | "custom";

/** 所有模块共享的排序与显隐元数据。 */
type ResumeModuleBase = {
  id: string;
  /** 是否在这份简历里展示该模块。 */
  visible: boolean;
};

type PersonalResumeModule = ResumeModuleBase & {
  kind: "personal";
  personal: PersonalInfo;
};

type PreferencesResumeModule = ResumeModuleBase & {
  kind: "preferences";
  preferences: JobPreferences;
};

type EducationResumeModule = ResumeModuleBase & {
  kind: "education";
  items: EducationItem[];
};

type WorkResumeModule = ResumeModuleBase & {
  kind: "work";
  items: WorkItem[];
};

type ProjectsResumeModule = ResumeModuleBase & {
  kind: "projects";
  items: ProjectItem[];
};

type SkillsResumeModule = ResumeModuleBase & {
  kind: "skills";
  skills: string[];
};

type CustomResumeModule = ResumeModuleBase & {
  kind: "custom";
  module: CustomModule;
};

/** 简历模块联合类型。 */
type ResumeModule =
  | PersonalResumeModule
  | PreferencesResumeModule
  | EducationResumeModule
  | WorkResumeModule
  | ProjectsResumeModule
  | SkillsResumeModule
  | CustomResumeModule;

/** 当前简历面向的目标岗位上下文。 */
type ResumeTargetContext = {
  jobId?: string;
  company?: string;
  title?: string;
};

/** 投递用简历正文，不等同于 ProfileDraft；它是面向某个岗位打磨后的版本。 */
type ResumeDocument = {
  id?: string;
  title: string;
  target?: ResumeTargetContext;
  modules: ResumeModule[];
};

export type {
  CustomResumeModule,
  EducationResumeModule,
  PersonalResumeModule,
  PreferencesResumeModule,
  ProjectsResumeModule,
  ResumeDocument,
  ResumeModule,
  ResumeModuleBase,
  ResumeModuleKind,
  ResumeTargetContext,
  SkillsResumeModule,
  WorkResumeModule,
};
