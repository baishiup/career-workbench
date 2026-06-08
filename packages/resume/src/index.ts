/**
 * @career-workbench/resume 的公开类型出口。
 *
 * 应用层优先从这里导入稳定领域类型，避免直接依赖内部文件路径。
 */

export { aiParsedResumeDraftJsonSchema } from "./parse";
export type {
  AIParsedEducation,
  AIParsedProject,
  AIParsedResumeCandidate,
  AIParsedResumeDraft,
  AIParsedResumeLink,
  AIParsedResumeSchemaVersion,
  AIParsedWorkExperience,
} from "./parse";
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
} from "./profile";
export type {
  ResumeBlock,
  ResumeBlockBase,
  ResumeBlockKind,
  ResumeBulletListBlock,
  ResumeBulletListItem,
  ResumeDateRangeBlock,
  ResumeDocument,
  ResumeEvidenceRef,
  ResumeLink,
  ResumeLinkListBlock,
  ResumeSection,
  ResumeSectionKind,
  ResumeTagListBlock,
  ResumeTargetContext,
  ResumeTextBlock,
  ResumeVersionSnapshot,
} from "./resume";
export type {
  ResumeAppendBlockChange,
  ResumeChangeActor,
  ResumeChangeLog,
  ResumeChangeType,
  ResumePatch,
  ResumePatchChange,
  ResumePatchOperation,
  ResumePatchStatus,
  ResumePatchTarget,
  ResumeRemoveBlockChange,
  ResumeReorderSectionChange,
  ResumeReplaceTextChange,
  ResumeUpdateStyleChange,
} from "./patch";
export type {
  ResumeColorConfig,
  ResumePageMargin,
  ResumePageSize,
  ResumeSpacingConfig,
  ResumeStyleConfig,
  ResumeTemplateConfig,
  ResumeTypographyConfig,
} from "./style";
