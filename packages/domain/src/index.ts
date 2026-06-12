/**
 * @career-workbench/domain 的公开出口。
 *
 * 本包只放稳定领域模型和纯领域函数（无 IO、无 UI、无客户端依赖）。
 * 应用层优先从这里导入，避免直接依赖内部文件路径。
 */

export { aiParsedResumeDraftJsonSchema } from "./resume/parse";
export {
  aiParsedResumeDraftToProfileDraft,
  buildBaseResumeFromAIParsedDraft,
  createDefaultResumeStyleConfig,
  profileDraftToBaseResumeDocument,
} from "./resume/normalize";
export type {
  AIParsedEducation,
  AIParsedProject,
  AIParsedResumeCandidate,
  AIParsedResumeDraft,
  AIParsedResumeLink,
  AIParsedResumeSchemaVersion,
  AIParsedWorkExperience,
} from "./resume/parse";
export type {
  AIParsedResumeDraftToProfileOptions,
  BaseResumeBuildResult,
  BuildBaseResumeFromAIParsedDraftOptions,
  DefaultResumeStyleConfigOptions,
  ProfileDraftToResumeDocumentOptions,
} from "./resume/normalize";
export type {
  EducationItem,
  JobPreferences,
  PersonalCustomField,
  PersonalInfo,
  ProfileDraft,
  ProfileSectionId,
  ProjectItem,
  WorkItem,
} from "./profile/types";
export { emptyProfile } from "./profile/empty";
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
} from "./resume/types";
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
} from "./resume/patch";
export type {
  ResumeColorConfig,
  ResumePageMargin,
  ResumePageSize,
  ResumeSpacingConfig,
  ResumeStyleConfig,
  ResumeTemplateConfig,
  ResumeTypographyConfig,
} from "./resume/style";
export type {
  JobDescription,
  JobEmploymentType,
  JobImportMethod,
  JobRemoteStatus,
} from "./job/types";
export {
  computeProfileYears,
  computeRuleMatch,
  hasMatchableProfile,
  matchLabelForScore,
  normalizeSkill,
  parseYearsRequired,
} from "./job/match";
export type {
  RuleMatchBreakdown,
  RuleMatchLabel,
  RuleMatchResult,
} from "./job/match";
export {
  coerceMatchReportNarrative,
  isMatchReportStale,
} from "./job/match-report";
export type {
  MatchReportFreshnessInput,
  MatchReportNarrative,
  MatchReportStatus,
} from "./job/match-report";
