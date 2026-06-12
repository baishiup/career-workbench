/**
 * 用户长期资料模型。
 *
 * ProfileDraft 是简历生成和匹配分析的事实来源，
 * 不等同于某份最终投递的 ResumeDocument。
 */

/** Profile 页面和简历生成共用的资料分区标识。 */
type ProfileSectionId =
  | "personal"
  | "preferences"
  | "education"
  | "work"
  | "projects"
  | "skills";

/** 用户在个人信息里自行追加的键值字段，用于覆盖固定 schema 之外的信息。 */
type PersonalCustomField = {
  id: string;
  label: string;
  value: string;
};

/** 基础个人信息，主要来自手动填写、简历解析或第三方资料导入。 */
type PersonalInfo = {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  linkedin: string;
  github: string;
  /** 作品集链接，用于简历生成的链接区。 */
  portfolio: string;
  /** 固定字段无法覆盖的信息，统一放在自定义字段里。 */
  customFields: PersonalCustomField[];
};

/** 求职偏好，用于岗位匹配、简历生成和 onboarding 初始配置。 */
type JobPreferences = {
  jobFunction: string;
  jobTypes: string[];
  /** 是否接受远程，用于岗位匹配打分。 */
  openToRemote: boolean;
  /** 期望城市。 */
  targetCity: string;
  /** 薪资期望，自由文本，例如 "20-30k"。 */
  salaryExpectation: string;
};

/** 教育经历条目，可按时间或用户拖拽顺序展示。 */
type EducationItem = {
  id: string;
  school: string;
  degree: string;
  major: string;
  location: string;
  /** 开始日期，当前用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，当前用 YYYY-MM 文本保存。 */
  endDate: string;
  /** 补充说明，例如课程、成绩、荣誉或转专业背景。 */
  description: string;
};

/** 工作经历条目，是简历生成和岗位匹配的核心事实来源。 */
type WorkItem = {
  id: string;
  company: string;
  title: string;
  location: string;
  jobType: string;
  /** 开始日期，当前用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，当前用 YYYY-MM 文本保存；在职时可为空。 */
  endDate: string;
  current: boolean;
  /** 经历摘要，用于页面预览和简历段落生成。 */
  summary: string;
  /** 可直接进入简历的职责、成果或项目要点。 */
  bullets: string[];
};

/** 项目经历条目，后续可用于补充工作经历之外的代表项目。 */
type ProjectItem = {
  id: string;
  name: string;
  role: string;
  /** 开始日期，当前用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，当前用 YYYY-MM 文本保存。 */
  endDate: string;
  summary: string;
  /** 项目要点，通常强调技术方案、职责和结果。 */
  bullets: string[];
  links: string[];
  technologies: string[];
};

/** 当前用户可编辑的完整资料草稿。 */
type ProfileDraft = {
  personal: PersonalInfo;
  preferences: JobPreferences;
  education: EducationItem[];
  work: WorkItem[];
  projects: ProjectItem[];
  skills: string[];
};

export type {
  EducationItem,
  JobPreferences,
  PersonalCustomField,
  PersonalInfo,
  ProfileDraft,
  ProfileSectionId,
  ProjectItem,
  WorkItem,
};
