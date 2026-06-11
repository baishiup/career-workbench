/**
 * AI 解析简历的归一化工具。
 *
 * 主链路是 AIParsedResumeDraft -> ProfileDraft -> ResumeDocument。
 * ProfileDraft 是事实归一层；raw_date、parse_warnings、unmapped_text 等
 * parser-only 字段不要进入 ProfileDraft 或 ResumeDocument 主数据。
 */

import type { AIParsedResumeDraft, AIParsedResumeLink } from "./parse.ts";
import type {
  JobPreferences,
  PersonalCustomField,
  ProfileDraft,
} from "../profile/types.ts";
import type {
  ResumeBlock,
  ResumeDocument,
  ResumeEvidenceRef,
  ResumeSection,
} from "./types.ts";
import type { ResumeStyleConfig } from "./style.ts";

type AIParsedResumeDraftToProfileOptions = {
  preferences?: Partial<JobPreferences>;
};

type ProfileDraftToResumeDocumentOptions = {
  locale?: string;
  title?: string;
};

type DefaultResumeStyleConfigOptions = {
  pageSize?: "a4" | "letter";
  templateId?: string;
};

type BuildBaseResumeFromAIParsedDraftOptions =
  AIParsedResumeDraftToProfileOptions &
    ProfileDraftToResumeDocumentOptions &
    DefaultResumeStyleConfigOptions;

type BaseResumeBuildResult = {
  document: ResumeDocument;
  profile: ProfileDraft;
  style: ResumeStyleConfig;
};

const emptyProfileDraft: ProfileDraft = {
  personal: {
    firstName: "",
    lastName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    targetRegion: "",
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [],
  },
  preferences: {
    jobFunction: "",
    jobTypes: [],
    location: "",
    openToRemote: false,
    workAuthorization: [],
  },
  education: [],
  work: [],
  projects: [],
  skills: [],
};

/** 将 AI 原始抽取草稿转换成用户长期 Profile。 */
function aiParsedResumeDraftToProfileDraft(
  parsed: AIParsedResumeDraft,
  options: AIParsedResumeDraftToProfileOptions = {},
): ProfileDraft {
  const { firstName, lastName } = splitFullName(parsed.candidate.full_name);
  const links = mapCandidateLinks(parsed.candidate.links);
  const preferences = mergePreferences(options.preferences);

  return {
    ...emptyProfileDraft,
    personal: {
      ...emptyProfileDraft.personal,
      firstName,
      lastName,
      headline:
        cleanString(parsed.candidate.headline) || preferences.jobFunction,
      email: cleanString(parsed.candidate.email),
      phone: cleanString(parsed.candidate.phone),
      city: cleanString(parsed.candidate.city),
      linkedin: links.linkedin,
      github: links.github,
      portfolio: links.portfolio,
      customFields: links.customFields,
    },
    preferences,
    education: parsed.education.map((item, index) => ({
      id: stableId("education", index),
      school: cleanString(item.school),
      degree: cleanString(item.degree),
      major: cleanString(item.major),
      location: cleanString(item.location),
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      description: cleanString(item.description),
    })),
    work: parsed.work_experiences.map((item, index) => ({
      id: stableId("work", index),
      company: cleanString(item.company),
      title: cleanString(item.title),
      location: cleanString(item.location),
      jobType: "",
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      // current 为 null 表示无法确认，不推测为在职。
      current: item.current === true,
      summary: cleanString(item.summary),
      bullets: cleanStringArray(item.bullets),
    })),
    projects: parsed.projects.map((item, index) => ({
      id: stableId("project", index),
      name: cleanString(item.name),
      role: cleanString(item.role),
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      summary: cleanString(item.summary),
      bullets: cleanStringArray(item.bullets),
      links: item.links.map((link) => cleanString(link.url)).filter(Boolean),
      technologies: cleanStringArray(item.technologies),
    })),
    skills: cleanStringArray(parsed.skills),
  };
}

/** 从 Profile 生成基础简历正文；这是确定性初版，不做 JD 定制改写。 */
function profileDraftToBaseResumeDocument(
  profile: ProfileDraft,
  options: ProfileDraftToResumeDocumentOptions = {},
): ResumeDocument {
  const locale = options.locale ?? "zh-CN";
  const title = options.title ?? getResumeTitle(profile);
  const sections: ResumeSection[] = [
    buildPersonalSection(profile),
    buildSummarySection(profile),
    buildSkillsSection(profile),
    buildWorkSection(profile),
    buildProjectsSection(profile),
    buildEducationSection(profile),
  ];

  return {
    title,
    locale,
    sections: sections.filter((section) => section.blocks.length > 0),
  };
}

/** 第一阶段默认样式，后续可由模板系统覆盖。 */
function createDefaultResumeStyleConfig(
  options: DefaultResumeStyleConfigOptions = {},
): ResumeStyleConfig {
  return {
    templateId: options.templateId ?? "base-clean-v1",
    pageSize: options.pageSize ?? "a4",
    colors: {
      text: "#111827",
      mutedText: "#4B5563",
      accent: "#2563EB",
      border: "#D1D5DB",
      background: "#FFFFFF",
    },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      baseFontSize: 12,
      headingFontSize: 16,
      lineHeight: 1.45,
    },
    spacing: {
      pageMargin: {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      },
      sectionSpacing: 18,
      blockSpacing: 8,
      itemSpacing: 6,
    },
  };
}

/** 便利 wrapper；内部必须保持 parsed -> profile -> resume 的主链路。 */
function buildBaseResumeFromAIParsedDraft(
  parsed: AIParsedResumeDraft,
  options: BuildBaseResumeFromAIParsedDraftOptions = {},
): BaseResumeBuildResult {
  const profile = aiParsedResumeDraftToProfileDraft(parsed, options);

  return {
    profile,
    document: profileDraftToBaseResumeDocument(profile, options),
    style: createDefaultResumeStyleConfig(options),
  };
}

/** Personal section 同时承载姓名、联系方式和候选人链接。 */
function buildPersonalSection(profile: ProfileDraft): ResumeSection {
  const blocks: ResumeBlock[] = [];
  const fullName = [profile.personal.firstName, profile.personal.lastName]
    .filter(Boolean)
    .join(" ");
  const links = [
    profile.personal.linkedin
      ? {
          id: "personal-link-linkedin",
          label: "LinkedIn",
          url: profile.personal.linkedin,
        }
      : null,
    profile.personal.github
      ? {
          id: "personal-link-github",
          label: "GitHub",
          url: profile.personal.github,
        }
      : null,
    profile.personal.portfolio
      ? {
          id: "personal-link-portfolio",
          label: "Portfolio",
          url: profile.personal.portfolio,
        }
      : null,
  ].filter((item): item is { id: string; label: string; url: string } =>
    Boolean(item),
  );

  addTextBlock(blocks, "personal-name", "姓名", fullName, "personal.firstName");
  addTextBlock(
    blocks,
    "personal-headline",
    "标题",
    profile.personal.headline,
    "personal.headline",
  );
  addTextBlock(
    blocks,
    "personal-email",
    "邮箱",
    profile.personal.email,
    "personal.email",
  );
  addTextBlock(
    blocks,
    "personal-phone",
    "电话",
    profile.personal.phone,
    "personal.phone",
  );
  addTextBlock(
    blocks,
    "personal-city",
    "城市",
    profile.personal.city,
    "personal.city",
  );

  if (links.length > 0) {
    blocks.push({
      id: "personal-links",
      kind: "linkList",
      label: "链接",
      links,
      evidenceRefs: [profileEvidence("personal")],
    });
  }

  return {
    id: "section-personal",
    kind: "personal",
    title: "Personal Info",
    visible: true,
    blocks,
  };
}

/** Summary 第一阶段只使用 Profile headline，避免自动扩写事实。 */
function buildSummarySection(profile: ProfileDraft): ResumeSection {
  const blocks: ResumeBlock[] = [];

  addTextBlock(
    blocks,
    "summary-headline",
    "职业摘要",
    profile.personal.headline,
    "personal.headline",
    "paragraph",
  );

  return {
    id: "section-summary",
    kind: "summary",
    title: "Professional Summary",
    visible: true,
    blocks,
  };
}

function buildSkillsSection(profile: ProfileDraft): ResumeSection {
  const tags = cleanStringArray(profile.skills);

  return {
    id: "section-skills",
    kind: "skills",
    title: "Core Skills",
    visible: true,
    blocks:
      tags.length > 0
        ? [
            {
              id: "skills-tags",
              kind: "tagList",
              label: "技能",
              tags,
              evidenceRefs: [profileEvidence("skills")],
            },
          ]
        : [],
  };
}

/** Work section 从 Profile.work 生成，并保留 evidenceRefs 到原字段。 */
function buildWorkSection(profile: ProfileDraft): ResumeSection {
  return {
    id: "section-work",
    kind: "work",
    title: "Work Experience",
    visible: true,
    blocks: profile.work.flatMap((item, index) => {
      const prefix = `work-${index + 1}`;
      const blocks: ResumeBlock[] = [];
      const title = [item.company, item.title].filter(Boolean).join(" · ");

      addTextBlock(blocks, `${prefix}-title`, "职位", title, `work.${index}`);
      addDateRangeBlock(
        blocks,
        `${prefix}-dates`,
        item.startDate,
        item.endDate,
        item.current,
        `work.${index}`,
      );
      addTextBlock(
        blocks,
        `${prefix}-summary`,
        "摘要",
        item.summary,
        `work.${index}.summary`,
        "paragraph",
      );
      addBulletListBlock(
        blocks,
        `${prefix}-bullets`,
        item.bullets,
        `work.${index}.bullets`,
      );

      return blocks;
    }),
  };
}

/** Project section 从 Profile.projects 生成，并保留技术栈标签。 */
function buildProjectsSection(profile: ProfileDraft): ResumeSection {
  return {
    id: "section-projects",
    kind: "projects",
    title: "Project Experience",
    visible: true,
    blocks: profile.projects.flatMap((item, index) => {
      const prefix = `project-${index + 1}`;
      const blocks: ResumeBlock[] = [];
      const title = [item.name, item.role].filter(Boolean).join(" · ");

      addTextBlock(
        blocks,
        `${prefix}-title`,
        "项目",
        title,
        `projects.${index}`,
      );
      addDateRangeBlock(
        blocks,
        `${prefix}-dates`,
        item.startDate,
        item.endDate,
        false,
        `projects.${index}`,
      );
      addTextBlock(
        blocks,
        `${prefix}-summary`,
        "摘要",
        item.summary,
        `projects.${index}.summary`,
        "paragraph",
      );
      addBulletListBlock(
        blocks,
        `${prefix}-bullets`,
        item.bullets,
        `projects.${index}.bullets`,
      );

      if (item.technologies.length > 0) {
        blocks.push({
          id: `${prefix}-technologies`,
          kind: "tagList",
          label: "技术栈",
          tags: cleanStringArray(item.technologies),
          evidenceRefs: [profileEvidence(`projects.${index}.technologies`)],
        });
      }

      return blocks;
    }),
  };
}

/** Education section 从 Profile.education 生成，不推断额外学历信息。 */
function buildEducationSection(profile: ProfileDraft): ResumeSection {
  return {
    id: "section-education",
    kind: "education",
    title: "Education",
    visible: true,
    blocks: profile.education.flatMap((item, index) => {
      const prefix = `education-${index + 1}`;
      const blocks: ResumeBlock[] = [];
      const title = [item.school, item.degree, item.major]
        .filter(Boolean)
        .join(" · ");

      addTextBlock(
        blocks,
        `${prefix}-title`,
        "教育",
        title,
        `education.${index}`,
      );
      addDateRangeBlock(
        blocks,
        `${prefix}-dates`,
        item.startDate,
        item.endDate,
        false,
        `education.${index}`,
      );
      addTextBlock(
        blocks,
        `${prefix}-description`,
        "说明",
        item.description,
        `education.${index}.description`,
        "paragraph",
      );

      return blocks;
    }),
  };
}

function addTextBlock(
  blocks: ResumeBlock[],
  id: string,
  label: string,
  text: string,
  fieldPath: string,
  kind: "text" | "paragraph" = "text",
) {
  const cleaned = cleanString(text);

  if (!cleaned) {
    return;
  }

  blocks.push({
    id,
    kind,
    label,
    text: cleaned,
    evidenceRefs: [profileEvidence(fieldPath)],
  });
}

function addDateRangeBlock(
  blocks: ResumeBlock[],
  id: string,
  startDate: string,
  endDate: string,
  current: boolean,
  fieldPath: string,
) {
  if (!startDate && !endDate && !current) {
    return;
  }

  blocks.push({
    id,
    kind: "dateRange",
    label: "时间",
    startDate,
    endDate,
    current,
    evidenceRefs: [profileEvidence(fieldPath)],
  });
}

function addBulletListBlock(
  blocks: ResumeBlock[],
  id: string,
  bullets: string[],
  fieldPath: string,
) {
  const items = cleanStringArray(bullets).map((text, index) => ({
    id: `${id}-${index + 1}`,
    text,
    evidenceRefs: [profileEvidence(`${fieldPath}.${index}`)],
  }));

  if (items.length === 0) {
    return;
  }

  blocks.push({
    id,
    kind: "bulletList",
    label: "要点",
    items,
    evidenceRefs: [profileEvidence(fieldPath)],
  });
}

function profileEvidence(fieldPath: string): ResumeEvidenceRef {
  return {
    sourceType: "profile",
    fieldPath,
  };
}

function splitFullName(value: string | null) {
  const fullName = cleanString(value);

  if (!fullName) {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: fullName, lastName: "" };
  }

  const [firstName, ...lastNameParts] = parts;

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

function mapCandidateLinks(links: AIParsedResumeLink[]) {
  const result = {
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [] as PersonalCustomField[],
  };

  for (const link of links) {
    const url = cleanString(link.url);

    if (!url) {
      continue;
    }

    const label = cleanString(link.label) || getLinkLabel(url);
    const normalized = url.toLowerCase();

    if (!result.linkedin && normalized.includes("linkedin.")) {
      result.linkedin = url;
      continue;
    }

    if (!result.github && normalized.includes("github.")) {
      result.github = url;
      continue;
    }

    if (!result.portfolio) {
      result.portfolio = url;
      continue;
    }

    result.customFields.push({
      id: stableId("custom-link", result.customFields.length),
      label,
      value: url,
    });
  }

  return result;
}

function getLinkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

function mergePreferences(
  preferences?: Partial<JobPreferences>,
): JobPreferences {
  return {
    ...emptyProfileDraft.preferences,
    ...preferences,
    jobTypes: cleanStringArray(preferences?.jobTypes ?? []),
    workAuthorization: cleanStringArray(preferences?.workAuthorization ?? []),
  };
}

function getResumeTitle(profile: ProfileDraft) {
  const fullName = [profile.personal.firstName, profile.personal.lastName]
    .filter(Boolean)
    .join(" ");

  if (fullName && profile.personal.headline) {
    return `${fullName} - ${profile.personal.headline}`;
  }

  return fullName || profile.personal.headline || "Uploaded Resume";
}

function cleanString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(values: string[]) {
  return values.map((value) => cleanString(value)).filter(Boolean);
}

function stableId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export type {
  AIParsedResumeDraftToProfileOptions,
  BaseResumeBuildResult,
  BuildBaseResumeFromAIParsedDraftOptions,
  DefaultResumeStyleConfigOptions,
  ProfileDraftToResumeDocumentOptions,
};

export {
  aiParsedResumeDraftToProfileDraft,
  buildBaseResumeFromAIParsedDraft,
  createDefaultResumeStyleConfig,
  profileDraftToBaseResumeDocument,
};
