/**
 * Edge Function 到 packages/domain resume 模块的归一化桥接。
 *
 * 真实实现仍放在 packages/domain；Edge Function 只通过这个相对路径桥接，
 * 避免业务函数里复制 AIParsedResumeDraft -> ProfileDraft -> ResumeDocument 逻辑。
 */

export type {
  ProfileDraft,
} from "../../../packages/domain/src/profile/types.ts";

export type {
  AIParsedResumeDraft,
} from "../../../packages/domain/src/resume/parse.ts";

export type {
  AIParsedResumeDraftToProfileOptions,
  BaseResumeBuildResult,
  BuildBaseResumeFromAIParsedDraftOptions,
  DefaultResumeStyleConfigOptions,
  ProfileDraftToResumeDocumentOptions,
} from "../../../packages/domain/src/resume/normalize.ts";

export type {
  ResumeDocument,
  ResumeModule,
} from "../../../packages/domain/src/resume/types.ts";

export {
  aiParsedResumeDraftToProfileDraft,
  buildBaseResumeFromAIParsedDraft,
  createDefaultResumeStyleConfig,
  profileDraftToBaseResumeDocument,
} from "../../../packages/domain/src/resume/normalize.ts";

export {
  coerceRichText,
  textToRichText,
} from "../../../packages/domain/src/rich-text.ts";
