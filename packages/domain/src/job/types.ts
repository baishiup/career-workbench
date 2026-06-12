/**
 * JD（工作机会）领域类型。
 *
 * 字段与 Supabase `public.job_descriptions` 表对齐，是职位浏览、
 * 规则匹配和 AI 叙事分析的共同输入。本文件不放展示映射（中文 label、
 * logo 派生）和本地 fixture，它们跟随 feature 归属。
 */

/** 远程办公状态。 */
type JobRemoteStatus = "remote" | "hybrid" | "onsite";

/** 岗位用工类型。 */
type JobEmploymentType = "full_time" | "contract" | "part_time";

/** 管理员导入的结构化职位。停用职位不会出现在用户侧列表。 */
type JobDescription = {
  id: string;
  sourcePlatform: string | null;
  sourceUrl: string | null;
  company: string;
  title: string;
  /** 公司 logo 图片 URL（Supabase Storage 公开地址），无图时为 null。 */
  logoUrl: string | null;
  /** 公司简介自由文本，未提供时为 null。 */
  companyInfo: string | null;
  location: string | null;
  remoteStatus: JobRemoteStatus;
  jobType: JobEmploymentType;
  yearsRequired: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requirements: string[];
  salaryRange: string | null;
  /** ISO 日期（YYYY-MM-DD），未知时为 null。 */
  postedAt: string | null;
  summary: string | null;
  importedBy: string | null;
  /** 停用职位仅 admin 可见，用于编辑或重新启用。 */
  isActive: boolean;
};

export type { JobDescription, JobEmploymentType, JobRemoteStatus };
