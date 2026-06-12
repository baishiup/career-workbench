/**
 * Jobs feature 层类型。
 *
 * 领域类型 `JobDescription` 来自 @career-workbench/domain；
 * 这里只追加 feature 专属的 demo 占位结构，并统一 re-export
 * 领域枚举，feature 内组件一律从本文件导入。
 */

import type { JobDescription } from "@career-workbench/domain";

/**
 * Demo-only AI 匹配报告，仅 mock fixture 使用。真实叙事分析持久化在
 * match_reports 表（见 lib/jobs/match-report-api），无 Supabase env 时
 * match-report-api 会把这里的占位转换成演示报告。
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
  JobRemoteStatus,
} from "@career-workbench/domain";
