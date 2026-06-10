/**
 * 简历 patch 和修改日志模型。
 *
 * AI 只能产生待审阅 patch；用户采纳后才修改 ResumeDocument 或 ResumeStyleConfig。
 */

import type { ResumeBlock, ResumeEvidenceRef } from "./types";
import type { ResumeStyleConfig } from "./style";

/** AI patch 的用户审阅状态。 */
type ResumePatchStatus = "pending" | "accepted" | "rejected" | "superseded";

/** patch 支持的最小操作集合。 */
type ResumePatchOperation =
  | "replace_text"
  | "append_block"
  | "remove_block"
  | "reorder_section"
  | "update_style";

/** patch 作用位置，支持定位到 section、block、列表项或字段路径。 */
type ResumePatchTarget = {
  sectionId?: string;
  blockId?: string;
  itemId?: string;
  fieldPath?: string;
};

/** 替换目标位置文本的 patch change。 */
type ResumeReplaceTextChange = {
  operation: "replace_text";
  target: ResumePatchTarget;
  beforeText?: string;
  nextText: string;
};

/** 向指定 section 追加内容块的 patch change。 */
type ResumeAppendBlockChange = {
  operation: "append_block";
  target: Required<Pick<ResumePatchTarget, "sectionId">>;
  block: ResumeBlock;
};

/** 从指定 section 删除内容块的 patch change。 */
type ResumeRemoveBlockChange = {
  operation: "remove_block";
  target: Required<Pick<ResumePatchTarget, "sectionId" | "blockId">>;
  beforeBlock?: ResumeBlock;
};

/** 重排简历 section 顺序的 patch change。 */
type ResumeReorderSectionChange = {
  operation: "reorder_section";
  sectionOrder: string[];
};

/** 更新简历样式配置的 patch change。 */
type ResumeUpdateStyleChange = {
  operation: "update_style";
  style: Partial<ResumeStyleConfig>;
};

/** AI 或用户操作可产生的所有 patch change 联合类型。 */
type ResumePatchChange =
  | ResumeReplaceTextChange
  | ResumeAppendBlockChange
  | ResumeRemoveBlockChange
  | ResumeReorderSectionChange
  | ResumeUpdateStyleChange;

/** AI 只能产生待审阅 patch；采纳后才允许写入 ResumeDocument。 */
type ResumePatch = {
  id: string;
  resumeId?: string;
  resumeVersionId?: string;
  aiRunId?: string;
  conversationId?: string;
  status: ResumePatchStatus;
  summary: string;
  changes: ResumePatchChange[];
  evidenceRefs: ResumeEvidenceRef[];
  riskNotes: string[];
  confidence?: number;
  createdAt: string;
  decidedAt?: string;
};

/** 修改日志的触发者。 */
type ResumeChangeActor = "user" | "ai" | "system";

/** 用户可见修改日志的事件类型。 */
type ResumeChangeType =
  | "ai_generated_initial"
  | "ai_suggested_patch"
  | "user_accepted_patch"
  | "user_rejected_patch"
  | "user_manual_edit"
  | "user_reordered_section"
  | "user_changed_style"
  | "user_exported_resume";

/** 一条可展示、可追溯的简历修改记录。 */
type ResumeChangeLog = {
  id: string;
  resumeId?: string;
  resumeVersionId?: string;
  aiRunId?: string;
  resumePatchId?: string;
  actor: ResumeChangeActor;
  changeType: ResumeChangeType;
  sectionId?: string;
  beforeSummary?: string;
  afterSummary?: string;
  sourceRefs: ResumeEvidenceRef[];
  createdAt: string;
};

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
};
