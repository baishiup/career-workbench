/**
 * Jobs feature 层类型。
 *
 * 领域类型 `JobDescription` 来自 @career-workbench/domain；
 * 这里只追加 feature 专属的 demo 占位结构，并统一 re-export
 * 领域枚举，feature 内组件一律从本文件导入。
 */

import type { JobDescription } from "@career-workbench/domain";

/**
 * Demo-only AI 匹配报告。真实的规则匹配分与 AI 叙事分析
 * 由后续任务（规则匹配分 / match_reports）接入，届时替换此结构。
 */
type MatchReport = {
  score: number;
  label: "强匹配" | "可冲刺" | "需补证据";
  aiNote: string;
  evidence: string[];
  gaps: string[];
  risks: string[];
  runId: string;
  provider: "mock";
  generatedAt: string;
};

/** 职位记录：领域 JD 字段加 mock fixture 专用的匹配占位。 */
type JobRecord = JobDescription & {
  /** 仅 mock fixture 携带；Supabase 数据没有匹配报告。 */
  match?: MatchReport;
};

export type { JobRecord, MatchReport };
export type {
  JobDescription,
  JobEmploymentType,
  JobImportMethod,
  JobImportStatus,
  JobRemoteStatus,
} from "@career-workbench/domain";
