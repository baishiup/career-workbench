/**
 * AI 简历解析草稿模型。
 *
 * 这里描述 LLM / parser 的原始结构化输出，字段刻意保持 snake_case，
 * 后续再由 normalizer 映射到 ProfileDraft 或 ResumeDocument。
 */

/** Dify / LLM structured output 使用的 JSON Schema。 */
const aiParsedResumeDraftJsonSchema = {
  type: "object",
  properties: {
    schema_version: { type: "string", enum: ["resume.parse.v1"] },
    candidate: {
      type: "object",
      properties: {
        full_name: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        headline: { type: ["string", "null"] },
        job_function: { type: ["string", "null"] },
        expected_city: { type: ["string", "null"] },
        expected_salary: { type: ["string", "null"] },
        links: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: ["string", "null"] },
              url: { type: "string" },
            },
            required: ["label", "url"],
          },
        },
      },
      required: [
        "full_name",
        "email",
        "phone",
        "city",
        "headline",
        "job_function",
        "expected_city",
        "expected_salary",
        "links",
      ],
    },
    work_experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: ["string", "null"] },
          title: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          start_date: { type: ["string", "null"] },
          end_date: { type: ["string", "null"] },
          current: { type: ["boolean", "null"] },
          raw_date: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
          bullets: { type: "array", items: { type: "string" } },
          technologies: { type: "array", items: { type: "string" } },
        },
        required: [
          "company",
          "title",
          "location",
          "start_date",
          "end_date",
          "current",
          "raw_date",
          "summary",
          "bullets",
          "technologies",
        ],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: ["string", "null"] },
          role: { type: ["string", "null"] },
          start_date: { type: ["string", "null"] },
          end_date: { type: ["string", "null"] },
          raw_date: { type: ["string", "null"] },
          summary: { type: ["string", "null"] },
          bullets: { type: "array", items: { type: "string" } },
          links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: ["string", "null"] },
                url: { type: "string" },
              },
              required: ["label", "url"],
            },
          },
          technologies: { type: "array", items: { type: "string" } },
        },
        required: [
          "name",
          "role",
          "start_date",
          "end_date",
          "raw_date",
          "summary",
          "bullets",
          "links",
          "technologies",
        ],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: ["string", "null"] },
          degree: { type: ["string", "null"] },
          major: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          start_date: { type: ["string", "null"] },
          end_date: { type: ["string", "null"] },
          raw_date: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
        },
        required: [
          "school",
          "degree",
          "major",
          "location",
          "start_date",
          "end_date",
          "raw_date",
          "description",
        ],
      },
    },
    skills: { type: "array", items: { type: "string" } },
    parse_warnings: { type: "array", items: { type: "string" } },
    unmapped_text: { type: "array", items: { type: "string" } },
  },
  required: [
    "schema_version",
    "candidate",
    "work_experiences",
    "projects",
    "education",
    "skills",
    "parse_warnings",
    "unmapped_text",
  ],
} as const;

/** AI 解析结果使用的 schema 版本。 */
type AIParsedResumeSchemaVersion = "resume.parse.v1";

/** AI 从简历中提取到的链接。 */
type AIParsedResumeLink = {
  label: string | null;
  url: string;
};

/** AI 从简历中提取到的候选人基础信息。 */
type AIParsedResumeCandidate = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  /** 现居城市。 */
  city: string | null;
  /** 纯职业标题，不含薪资/城市等求职偏好。 */
  headline: string | null;
  /** 求职方向/目标岗位。 */
  job_function: string | null;
  /** 期望工作城市。 */
  expected_city: string | null;
  /** 期望薪资文本，例如 "20-25K"。 */
  expected_salary: string | null;
  links: AIParsedResumeLink[];
};

/** AI 从简历中提取到的工作经历。 */
type AIParsedWorkExperience = {
  company: string | null;
  title: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  current: boolean | null;
  raw_date: string | null;
  summary: string | null;
  bullets: string[];
  technologies: string[];
};

/** AI 从简历中提取到的项目经历。 */
type AIParsedProject = {
  name: string | null;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  raw_date: string | null;
  summary: string | null;
  bullets: string[];
  links: AIParsedResumeLink[];
  technologies: string[];
};

/** AI 从简历中提取到的教育经历。 */
type AIParsedEducation = {
  school: string | null;
  degree: string | null;
  major: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  raw_date: string | null;
  description: string | null;
};

/** AI 简历解析输出的完整草稿，允许 null 表示原文没有可靠信息。 */
type AIParsedResumeDraft = {
  schema_version: AIParsedResumeSchemaVersion;
  candidate: AIParsedResumeCandidate;
  work_experiences: AIParsedWorkExperience[];
  projects: AIParsedProject[];
  education: AIParsedEducation[];
  skills: string[];
  parse_warnings: string[];
  unmapped_text: string[];
};

export type {
  AIParsedEducation,
  AIParsedProject,
  AIParsedResumeCandidate,
  AIParsedResumeDraft,
  AIParsedResumeLink,
  AIParsedResumeSchemaVersion,
  AIParsedWorkExperience,
};

export { aiParsedResumeDraftJsonSchema };
