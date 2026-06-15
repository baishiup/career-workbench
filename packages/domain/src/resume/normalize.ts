/**
 * AI 解析简历的归一化工具。
 *
 * 主链路是 AIParsedResumeDraft -> ProfileDraft -> ResumeDocument。
 * ProfileDraft 是事实归一层；raw_date、parse_warnings、unmapped_text 等
 * parser-only 字段不要进入 ProfileDraft 或 ResumeDocument 主数据。
 * AI 仍输出纯文本的 summary / bullets / description，富文本（Delta）转换在此完成。
 */

import type {
  AIParsedResumeCandidate,
  AIParsedResumeDraft,
  AIParsedResumeLink,
} from "./parse.ts";
import type {
  CustomField,
  JobPreferences,
  ProfileDraft,
} from "../profile/types.ts";
import type { ResumeDocument, ResumeModule } from "./types.ts";
import {
  createResumeStyleFromTemplate,
  type ResumeStyleConfig,
  type ResumeTemplateId,
} from "./style.ts";
import { emptyProfile } from "../profile/empty.ts";
import { mergeTextAndBulletsToRichText, textToRichText } from "../rich-text.ts";

type AIParsedResumeDraftToProfileOptions = {
  preferences?: Partial<JobPreferences>;
};

type ProfileDraftToResumeDocumentOptions = {
  title?: string;
};

type DefaultResumeStyleConfigOptions = {
  templateId?: ResumeTemplateId;
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

/** 将 AI 原始抽取草稿转换成用户长期 Profile。 */
function aiParsedResumeDraftToProfileDraft(
  parsed: AIParsedResumeDraft,
  options: AIParsedResumeDraftToProfileOptions = {},
): ProfileDraft {
  const fullName = cleanString(parsed.candidate.full_name);
  const links = mapCandidateLinks(parsed.candidate.links);
  const preferences = mergePreferences(parsed.candidate, options.preferences);

  return {
    ...emptyProfile,
    personal: {
      ...emptyProfile.personal,
      fullName,
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
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      current: false,
      description: textToRichText(cleanString(item.description)),
    })),
    work: parsed.work_experiences.map((item, index) => ({
      id: stableId("work", index),
      company: cleanString(item.company),
      title: cleanString(item.title),
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      // current 为 null 表示无法确认，不推测为在职。
      current: item.current === true,
      description: mergeTextAndBulletsToRichText(item.summary, item.bullets),
      skills: cleanStringArray(item.technologies),
    })),
    projects: parsed.projects.map((item, index) => ({
      id: stableId("project", index),
      name: cleanString(item.name),
      role: cleanString(item.role),
      startDate: cleanString(item.start_date),
      endDate: cleanString(item.end_date),
      current: false,
      description: mergeTextAndBulletsToRichText(item.summary, item.bullets),
      skills: cleanStringArray(item.technologies),
    })),
    skills: cleanStringArray(parsed.skills),
    custom: [],
  };
}

/** 从 Profile 生成基础简历正文；这是确定性初版，不做 JD 定制改写。 */
function profileDraftToBaseResumeDocument(
  profile: ProfileDraft,
  options: ProfileDraftToResumeDocumentOptions = {},
): ResumeDocument {
  const title = options.title ?? getResumeTitle(profile);
  const modules: ResumeModule[] = [];

  modules.push({
    id: "module-personal",
    kind: "personal",
    visible: true,
    personal: profile.personal,
  });

  if (profile.skills.length > 0) {
    modules.push({
      id: "module-skills",
      kind: "skills",
      visible: true,
      skills: cleanStringArray(profile.skills),
    });
  }

  if (profile.work.length > 0) {
    modules.push({
      id: "module-work",
      kind: "work",
      visible: true,
      items: profile.work,
    });
  }

  if (profile.projects.length > 0) {
    modules.push({
      id: "module-projects",
      kind: "projects",
      visible: true,
      items: profile.projects,
    });
  }

  if (profile.education.length > 0) {
    modules.push({
      id: "module-education",
      kind: "education",
      visible: true,
      items: profile.education,
    });
  }

  profile.custom.forEach((module, index) => {
    modules.push({
      id: `module-custom-${index + 1}`,
      kind: "custom",
      visible: true,
      module,
    });
  });

  return { title, modules };
}

/** 第一阶段默认样式来自内置模板库。 */
function createDefaultResumeStyleConfig(
  options: DefaultResumeStyleConfigOptions = {},
): ResumeStyleConfig {
  return createResumeStyleFromTemplate(options.templateId);
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

function mapCandidateLinks(links: AIParsedResumeLink[]) {
  const result = {
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [] as CustomField[],
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

/**
 * 求职偏好按"显式输入 > 简历抽取 > 默认值"逐字段取值。
 * options.preferences 来自 onboarding 用户手填；candidate 来自简历解析。
 */
function mergePreferences(
  candidate: AIParsedResumeCandidate,
  options?: Partial<JobPreferences>,
): JobPreferences {
  const pick = (explicit: string | undefined, fromResume: string | null) =>
    cleanString(explicit) || cleanString(fromResume);

  return {
    jobFunction: pick(options?.jobFunction, candidate.job_function),
    jobTypes: cleanStringArray(options?.jobTypes ?? []),
    openToRemote:
      options?.openToRemote ?? emptyProfile.preferences.openToRemote,
    targetCity: pick(options?.targetCity, candidate.expected_city),
    salaryExpectation: pick(
      options?.salaryExpectation,
      candidate.expected_salary,
    ),
    customFields: options?.customFields ?? [],
  };
}

function getResumeTitle(profile: ProfileDraft) {
  const fullName = profile.personal.fullName.trim();

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
