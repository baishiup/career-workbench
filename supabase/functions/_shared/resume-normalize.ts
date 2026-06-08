/**
 * Edge Function 到 packages/resume 的归一化桥接。
 *
 * 真实实现仍放在 packages/resume；Edge Function 只通过这个相对路径桥接，
 * 避免业务函数里复制 AIParsedResumeDraft -> ProfileDraft -> ResumeDocument 逻辑。
 */

export type {
  AIParsedResumeDraft,
} from "../../../packages/resume/src/parse.ts";

export type {
  AIParsedResumeDraftToProfileOptions,
  BaseResumeBuildResult,
  BuildBaseResumeFromAIParsedDraftOptions,
  DefaultResumeStyleConfigOptions,
  ProfileDraftToResumeDocumentOptions,
} from "../../../packages/resume/src/normalize.ts";

export {
  aiParsedResumeDraftToProfileDraft,
  buildBaseResumeFromAIParsedDraft,
  createDefaultResumeStyleConfig,
  profileDraftToBaseResumeDocument,
} from "../../../packages/resume/src/normalize.ts";
