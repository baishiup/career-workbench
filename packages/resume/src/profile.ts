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
  /** 前端生成的稳定 id，用于编辑、删除和列表渲染。 */
  id: string;
  /** 用户输入的字段名，例如签证状态、期望薪资、个人网站等。 */
  label: string;
  /** 用户输入的字段值。 */
  value: string;
};

/** 基础个人信息，主要来自手动填写、简历解析或第三方资料导入。 */
type PersonalInfo = {
  /** 名。 */
  firstName: string;
  /** 姓。 */
  lastName: string;
  /** 对外展示的职业标题或一句话定位。 */
  headline: string;
  /** 联系邮箱。 */
  email: string;
  /** 联系电话。 */
  phone: string;
  /** 当前城市或常驻地。 */
  city: string;
  /** 目标地区；旧字段，保留用于兼容历史草稿。 */
  targetRegion: string;
  /** LinkedIn 个人主页。 */
  linkedin: string;
  /** GitHub 个人主页。 */
  github: string;
  /** 作品集链接；旧字段，保留用于兼容历史草稿。 */
  portfolio: string;
  /** 固定字段无法覆盖的信息，统一放在自定义字段里。 */
  customFields: PersonalCustomField[];
};

/** 求职偏好，用于岗位匹配、简历生成和 onboarding 初始配置。 */
type JobPreferences = {
  /** 目标岗位方向，例如前端工程师、全栈开发者。 */
  jobFunction: string;
  /** 期望工作类型，例如全职、合同、兼职、实习。 */
  jobTypes: string[];
  /** 目标地点；旧字段，保留用于兼容历史草稿。 */
  location: string;
  /** 是否接受远程；旧字段，保留用于兼容历史草稿。 */
  openToRemote: boolean;
  /** 工作授权或签证相关说明；旧字段，保留用于兼容历史草稿。 */
  workAuthorization: string[];
};

/** 教育经历条目，可按时间或用户拖拽顺序展示。 */
type EducationItem = {
  /** 前端生成或后端返回的稳定 id。 */
  id: string;
  /** 学校名称。 */
  school: string;
  /** 学历或学位。 */
  degree: string;
  /** 专业方向。 */
  major: string;
  /** 学校所在地。 */
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
  /** 前端生成或后端返回的稳定 id。 */
  id: string;
  /** 公司或组织名称。 */
  company: string;
  /** 职位名称。 */
  title: string;
  /** 工作地点。 */
  location: string;
  /** 工作类型，例如全职、合同、兼职、实习。 */
  jobType: string;
  /** 开始日期，当前用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，当前用 YYYY-MM 文本保存；在职时可为空。 */
  endDate: string;
  /** 是否仍在当前岗位任职。 */
  current: boolean;
  /** 经历摘要，用于页面预览和简历段落生成。 */
  summary: string;
  /** 可直接进入简历的职责、成果或项目要点。 */
  bullets: string[];
};

/** 项目经历条目，后续可用于补充工作经历之外的代表项目。 */
type ProjectItem = {
  /** 前端生成或后端返回的稳定 id。 */
  id: string;
  /** 项目名称。 */
  name: string;
  /** 用户在项目中的角色。 */
  role: string;
  /** 开始日期，当前用 YYYY-MM 文本保存。 */
  startDate: string;
  /** 结束日期，当前用 YYYY-MM 文本保存。 */
  endDate: string;
  /** 项目摘要。 */
  summary: string;
  /** 项目要点，通常强调技术方案、职责和结果。 */
  bullets: string[];
  /** 项目相关链接，例如仓库、线上地址、文档。 */
  links: string[];
  /** 项目使用的技术栈或关键词。 */
  technologies: string[];
};

/** 当前用户可编辑的完整资料草稿。 */
type ProfileDraft = {
  /** 个人基础信息。 */
  personal: PersonalInfo;
  /** 求职偏好。 */
  preferences: JobPreferences;
  /** 教育经历列表。 */
  education: EducationItem[];
  /** 工作经历列表。 */
  work: WorkItem[];
  /** 项目经历列表。 */
  projects: ProjectItem[];
  /** 技能标签。 */
  skills: string[];
};

/** 资料事实来源，用于区分手动填写、简历上传、AI 解析或外部导入。 */
type ProfileFactSource = "manual" | "resume_upload" | "ai_parse" | "import";

/** 可持久化的资料快照，用于后续版本记录、导入记录或回滚。 */
type ProfileSnapshot = {
  /** 快照 id，前端本地草稿场景可以为空。 */
  id?: string;
  /** 快照中的完整资料。 */
  profile: ProfileDraft;
  /** 这份快照的主要来源。 */
  source: ProfileFactSource;
  /** 创建时间，推荐 ISO 字符串。 */
  createdAt?: string;
  /** 更新时间，推荐 ISO 字符串。 */
  updatedAt?: string;
};

export type {
  EducationItem,
  JobPreferences,
  PersonalCustomField,
  PersonalInfo,
  ProfileDraft,
  ProfileFactSource,
  ProfileSectionId,
  ProfileSnapshot,
  ProjectItem,
  WorkItem,
};
