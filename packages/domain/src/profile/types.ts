/**
 * 用户长期资料模型，同时是简历模块的内容字段事实来源。
 *
 * 设计：内容类型（PersonalInfo / JobPreferences / EducationItem / WorkItem /
 * ProjectItem / CustomModule）只在这里定义一次，Profile 与简历（见
 * resume/types.ts 的 ResumeModule）共用同一套字段，避免双份建模漂移。
 * ProfileDraft 是扁平的事实层；简历是带排序/显隐的有序模块包装。
 */

import type { RichText } from "../rich-text.ts";

/** Profile 页面和简历共用的模块标识。 */
type ProfileSectionId =
  | "personal"
  | "preferences"
  | "education"
  | "work"
  | "projects"
  | "skills"
  | "custom";

/** 用户自行追加的键值字段，用于覆盖固定 schema 之外的信息。 */
type CustomField = {
  id: string;
  label: string;
  value: string;
};

/** @deprecated 历史命名，等价于 CustomField。保留以兼容旧引用。 */
type PersonalCustomField = CustomField;

/** 基础个人信息，主要来自手动填写、简历解析或第三方资料导入。 */
type PersonalInfo = {
  fullName: string;
  headline: string;
  /** 头像公开 URL，用户可选上传。 */
  avatarUrl: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  /** 作品集链接，用于简历生成的链接区。 */
  portfolio: string;
  /** 固定字段无法覆盖的信息，统一放在自定义字段里。 */
  customFields: CustomField[];
};

/** 求职偏好（求职方向），用于岗位匹配、简历生成和 onboarding 初始配置。 */
type JobPreferences = {
  jobFunction: string;
  jobTypes: string[];
  /** 是否接受远程，用于岗位匹配打分。 */
  openToRemote: boolean;
  /** 期望城市。 */
  targetCity: string;
  /** 薪资期望，自由文本，例如 "20-30k"。 */
  salaryExpectation: string;
  /** 固定字段之外的自定义键值字段。 */
  customFields: CustomField[];
};

/** 教育经历条目。 */
type EducationItem = {
  id: string;
  school: string;
  degree: string;
  major: string;
  /** 开始日期，用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，用 YYYY-MM 文本保存；current 为 true 时表示"至今"。 */
  endDate: string;
  /** 是否至今（在读）。 */
  current: boolean;
  /** 补充说明（课程、成绩、荣誉等），富文本。 */
  description: RichText;
};

/** 工作经历条目，是简历生成和岗位匹配的核心事实来源。 */
type WorkItem = {
  id: string;
  company: string;
  title: string;
  /** 开始日期，用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，用 YYYY-MM 文本保存；current 为 true 时表示"至今"。 */
  endDate: string;
  current: boolean;
  /** 工作描述（原摘要 + 要点合并），富文本。 */
  description: RichText;
  /** 该段经历相关技能标签。 */
  skills: string[];
};

/** 项目经历条目。 */
type ProjectItem = {
  id: string;
  name: string;
  role: string;
  /** 开始日期，用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，用 YYYY-MM 文本保存；current 为 true 时表示"至今"。 */
  endDate: string;
  current: boolean;
  /** 项目描述（原摘要 + 要点合并），富文本。 */
  description: RichText;
  /** 项目相关技能标签（原"技术栈"）。 */
  skills: string[];
};

/** 自定义模块：一个标题 + 一段富文本内容。 */
type CustomModule = {
  id: string;
  name: string;
  content: RichText;
};

/** 当前用户可编辑的完整资料草稿。 */
type ProfileDraft = {
  personal: PersonalInfo;
  preferences: JobPreferences;
  education: EducationItem[];
  work: WorkItem[];
  projects: ProjectItem[];
  skills: string[];
  custom: CustomModule[];
};

export type {
  CustomField,
  CustomModule,
  EducationItem,
  JobPreferences,
  PersonalCustomField,
  PersonalInfo,
  ProfileDraft,
  ProfileSectionId,
  ProjectItem,
  WorkItem,
};
