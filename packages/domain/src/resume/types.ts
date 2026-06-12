/**
 * 投递简历正文模型。
 *
 * 这里描述 ResumeDocument、ResumeSection 和 ResumeBlock，
 * 不存用户长期资料；长期资料归 profile.ts。
 */

/** 简历第一阶段支持的 section 类型。 */
type ResumeSectionKind =
  | "personal"
  | "summary"
  | "skills"
  | "work"
  | "projects"
  | "education"
  | "custom";

/** section 内部可复用的内容块类型。 */
type ResumeBlockKind =
  | "text"
  | "paragraph"
  | "bulletList"
  | "tagList"
  | "dateRange"
  | "linkList";

/** 所有简历内容块共享的稳定标识。 */
type ResumeBlockBase = {
  id: string;
  kind: ResumeBlockKind;
  label?: string;
};

/** 单行文本或段落文本内容块。 */
type ResumeTextBlock = ResumeBlockBase & {
  kind: "text" | "paragraph";
  text: string;
};

/** bullet 列表中的单个条目，可独立定位和改写。 */
type ResumeBulletListItem = {
  id: string;
  text: string;
};

/** 工作经历、项目经历等区域常用的 bullet 列表内容块。 */
type ResumeBulletListBlock = ResumeBlockBase & {
  kind: "bulletList";
  items: ResumeBulletListItem[];
};

/** 技能、关键词等标签列表内容块。 */
type ResumeTagListBlock = ResumeBlockBase & {
  kind: "tagList";
  tags: string[];
};

/** 教育或经历时间范围内容块。 */
type ResumeDateRangeBlock = ResumeBlockBase & {
  kind: "dateRange";
  startDate: string;
  endDate: string;
  current?: boolean;
};

/** 简历中的链接项，例如 GitHub、作品集或项目地址。 */
type ResumeLink = {
  id: string;
  label: string;
  url: string;
};

/** 多个链接组成的内容块。 */
type ResumeLinkListBlock = ResumeBlockBase & {
  kind: "linkList";
  links: ResumeLink[];
};

/** section 内允许渲染和编辑的所有内容块联合类型。 */
type ResumeBlock =
  | ResumeTextBlock
  | ResumeBulletListBlock
  | ResumeTagListBlock
  | ResumeDateRangeBlock
  | ResumeLinkListBlock;

/** 简历顶层 section，负责排序、显隐和承载内容块。 */
type ResumeSection = {
  id: string;
  kind: ResumeSectionKind;
  title: string;
  visible: boolean;
  blocks: ResumeBlock[];
};

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
  locale: string;
  target?: ResumeTargetContext;
  sections: ResumeSection[];
};

export type {
  ResumeBlock,
  ResumeBlockBase,
  ResumeBlockKind,
  ResumeBulletListBlock,
  ResumeBulletListItem,
  ResumeDateRangeBlock,
  ResumeDocument,
  ResumeLink,
  ResumeLinkListBlock,
  ResumeSection,
  ResumeSectionKind,
  ResumeTagListBlock,
  ResumeTargetContext,
  ResumeTextBlock,
};
