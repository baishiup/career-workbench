/**
 * 简历样式配置模型。
 *
 * 这里描述模板、颜色、字体、布局和间距配置，和 ResumeDocument 一起持久化。
 */

import type { ResumeModuleKind } from "./types.ts";

/** 第一版内置模板 ID，不支持用户自定义模板。 */
type ResumeTemplateId = "standard-clean" | "business-sidebar" | "fresh-header";

/** 单栏、左侧栏和顶部色带三种模板布局。 */
type ResumeLayoutConfig =
  | { kind: "single-column" }
  | {
      kind: "sidebar-left";
      sidebarModuleKinds: ResumeModuleKind[];
      sidebarWidth: number;
    }
  | { kind: "header-band"; headerModuleKinds: ResumeModuleKind[] };

/** 联系方式展示方式。 */
type ResumeContactStyle = "plain" | "icons" | "sidebar";

/** Section 标题视觉。 */
type ResumeSectionStyle = "underline" | "left-bar" | "pill" | "minimal";

/** 技能展示方式。 */
type ResumeSkillStyle = "tags" | "inline" | "sidebar-list";

/** 页面四边距，单位由渲染层统一解释，第一阶段按 px 处理。 */
type ResumePageMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/** 简历模板和自定义样式共用的颜色配置。 */
type ResumeColorConfig = {
  text: string;
  mutedText: string;
  accent: string;
  border: string;
  background: string;
  panelBackground: string;
  panelText: string;
  panelMutedText: string;
  subtleBackground: string;
};

/** 简历正文、标题和行高的基础排版配置。 */
type ResumeTypographyConfig = {
  fontFamily: string;
  baseFontSize: number;
  headingFontSize: number;
  lineHeight: number;
};

/** 简历页面、section、block 和条目之间的间距配置。 */
type ResumeSpacingConfig = {
  pageMargin: ResumePageMargin;
  sectionSpacing: number;
  blockSpacing: number;
  itemSpacing: number;
};

/** 和 ResumeDocument 一起持久化的样式配置。 */
type ResumeStyleConfig = {
  templateId: ResumeTemplateId;
  colors: ResumeColorConfig;
  contactStyle: ResumeContactStyle;
  layout: ResumeLayoutConfig;
  sectionStyle: ResumeSectionStyle;
  skillStyle: ResumeSkillStyle;
  typography: ResumeTypographyConfig;
  spacing: ResumeSpacingConfig;
};

/** 模板定义是产品级预设，用户选择模板后直接持久化为 ResumeStyleConfig。 */
type ResumeStyleTemplate = ResumeStyleConfig & {
  description: string;
  name: string;
};

const resumeStyleTemplates: ResumeStyleTemplate[] = [
  {
    colors: {
      accent: "#2563EB",
      background: "#FFFFFF",
      border: "#D7DEE8",
      mutedText: "#475569",
      panelBackground: "#FFFFFF",
      panelMutedText: "#64748B",
      panelText: "#0F172A",
      subtleBackground: "#F8FAFC",
      text: "#111827",
    },
    contactStyle: "plain",
    description: "白底单栏，信息密度适中，适合大多数投递场景。",
    layout: { kind: "single-column" },
    name: "标准",
    sectionStyle: "underline",
    skillStyle: "tags",
    spacing: {
      blockSpacing: 8,
      itemSpacing: 6,
      pageMargin: { bottom: 40, left: 40, right: 40, top: 40 },
      sectionSpacing: 18,
    },
    templateId: "standard-clean",
    typography: {
      baseFontSize: 12,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      headingFontSize: 16,
      lineHeight: 1.45,
    },
  },
  {
    colors: {
      accent: "#2F6BBA",
      background: "#FFFFFF",
      border: "#CBD5E1",
      mutedText: "#475569",
      panelBackground: "#1E3A8A",
      panelMutedText: "#C7D2FE",
      panelText: "#FFFFFF",
      subtleBackground: "#EEF2FF",
      text: "#0F172A",
    },
    contactStyle: "sidebar",
    description: "左侧深色栏承载个人信息和技能，右侧展示经历正文。",
    layout: {
      kind: "sidebar-left",
      sidebarModuleKinds: ["personal", "skills", "preferences"],
      sidebarWidth: 218,
    },
    name: "商务侧栏",
    sectionStyle: "left-bar",
    skillStyle: "sidebar-list",
    spacing: {
      blockSpacing: 9,
      itemSpacing: 6,
      pageMargin: { bottom: 38, left: 34, right: 38, top: 38 },
      sectionSpacing: 17,
    },
    templateId: "business-sidebar",
    typography: {
      baseFontSize: 11.5,
      fontFamily: "Arial, Helvetica, sans-serif",
      headingFontSize: 15,
      lineHeight: 1.42,
    },
  },
  {
    colors: {
      accent: "#0F766E",
      background: "#FFFFFF",
      border: "#B7E4DA",
      mutedText: "#48666A",
      panelBackground: "#E9FBF7",
      panelMutedText: "#4F7C78",
      panelText: "#0F3D3E",
      subtleBackground: "#F1FCF9",
      text: "#173033",
    },
    contactStyle: "icons",
    description: "浅绿色顶部信息区，整体更清新但仍保持正式。",
    layout: { headerModuleKinds: ["personal"], kind: "header-band" },
    name: "清新抬头",
    sectionStyle: "pill",
    skillStyle: "inline",
    spacing: {
      blockSpacing: 8,
      itemSpacing: 5,
      pageMargin: { bottom: 38, left: 38, right: 38, top: 34 },
      sectionSpacing: 16,
    },
    templateId: "fresh-header",
    typography: {
      baseFontSize: 11.8,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      headingFontSize: 15,
      lineHeight: 1.46,
    },
  },
];

const defaultResumeTemplateId: ResumeTemplateId = "standard-clean";

function getResumeStyleTemplate(templateId: string): ResumeStyleTemplate {
  return (
    resumeStyleTemplates.find(
      (template) => template.templateId === templateId,
    ) ?? resumeStyleTemplates[0]
  );
}

function createResumeStyleFromTemplate(
  templateId: string = defaultResumeTemplateId,
): ResumeStyleConfig {
  const {
    description: _description,
    name: _name,
    ...style
  } = getResumeStyleTemplate(templateId);

  return cloneValue(style);
}

function cloneValue<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as TValue;
}

export {
  createResumeStyleFromTemplate,
  defaultResumeTemplateId,
  getResumeStyleTemplate,
  resumeStyleTemplates,
};

export type {
  ResumeColorConfig,
  ResumeContactStyle,
  ResumeLayoutConfig,
  ResumePageMargin,
  ResumeSectionStyle,
  ResumeSkillStyle,
  ResumeSpacingConfig,
  ResumeStyleConfig,
  ResumeStyleTemplate,
  ResumeTemplateId,
  ResumeTypographyConfig,
};
