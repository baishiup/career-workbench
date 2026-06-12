/**
 * 简历样式配置模型。
 *
 * 这里描述模板、页面、颜色、字体和间距配置，和 ResumeDocument 一起持久化。
 */

/** 简历预览和导出的纸张尺寸。 */
type ResumePageSize = "a4" | "letter";

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
  templateId: string;
  pageSize: ResumePageSize;
  colors: ResumeColorConfig;
  typography: ResumeTypographyConfig;
  spacing: ResumeSpacingConfig;
};

export type {
  ResumeColorConfig,
  ResumePageMargin,
  ResumePageSize,
  ResumeSpacingConfig,
  ResumeStyleConfig,
  ResumeTypographyConfig,
};
