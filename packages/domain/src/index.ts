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
  CustomField,
  CustomModule,
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
export { hasMatchableProfile } from "./profile/matchable";
export type { RichText, RichTextOp } from "./rich-text";
export {
  coerceRichText,
  emptyRichText,
  isRichText,
  mergeTextAndBulletsToRichText,
  renderRichTextToHtml,
  richTextToPlainText,
  textToRichText,
} from "./rich-text";
export type {
  CustomResumeModule,
  EducationResumeModule,
  PersonalResumeModule,
  PreferencesResumeModule,
  ProjectsResumeModule,
  ResumeDocument,
  ResumeModule,
  ResumeModuleBase,
  ResumeModuleKind,
  ResumeTargetContext,
  SkillsResumeModule,
  WorkResumeModule,
} from "./resume/types";
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
} from "./resume/style";
export {
  createResumeStyleFromTemplate,
  defaultResumeTemplateId,
  getResumeStyleTemplate,
  resumeStyleTemplates,
} from "./resume/style";
export type {
  ApplyResumePatchResult,
  ResumeChangeLogEntry,
  ResumePatch,
  ResumePatchDiff,
  ResumePatchFieldDiff,
  ResumePatchModuleChange,
  ResumePatchModuleSnapshot,
  ResumePatchStatus,
} from "./resume/patch";
export {
  acceptResumePatch,
  applyResumePatch,
  createResumeChangeLogFromPatchDecision,
  deriveResumePatchDiff,
  rejectResumePatch,
  summarizeResumeModule,
} from "./resume/patch";
export type {
  JobDescription,
  JobEmploymentType,
  JobRemoteStatus,
} from "./job/types";
export {
  coerceMatchReportNarrative,
  isMatchReportStale,
} from "./job/match-report";
export type {
  MatchReportFreshnessInput,
  MatchReportNarrative,
  MatchReportStatus,
} from "./job/match-report";
