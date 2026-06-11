/**
 * MatchReport（AI 叙事分析）领域类型与纯函数。
 *
 * 分数始终来自规则匹配（match.ts），这里只描述 job_match workflow
 * 产出的叙事内容、报告状态和复用/过期判断；不含 IO、持久化和 UI。
 */

/** match_reports 行的生命周期状态。 */
type MatchReportStatus = "pending" | "succeeded" | "failed";

/** AI 叙事分析的四类产出，不含分数。 */
type MatchReportNarrative = {
  /** 命中证据：Profile 中能支撑该职位要求的事实。 */
  evidence: string[];
  /** 能力缺口：JD 要求但 Profile 缺少或证据不足的部分。 */
  gaps: string[];
  /** 风险表达：投递或简历表述中需要注意的风险点。 */
  risks: string[];
  /** 总评叙事，围绕规则匹配分展开。 */
  aiNote: string;
};

/** 过期判断输入：报告生成时的双快照 + Profile / 职位当前更新时间。 */
type MatchReportFreshnessInput = {
  /** 报告生成时的 profiles.updated_at 快照。 */
  profileSnapshotAt: string | null;
  /** 报告生成时的职位 updated_at 快照。 */
  jobSnapshotAt: string | null;
  /** Profile 当前 updated_at；无 Profile 时为 null。 */
  profileUpdatedAt: string | null;
  /** 职位当前 updated_at。 */
  jobUpdatedAt: string | null;
};

function parseTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** 单条时间轴的过期判断：没有快照视为过期，当前时间未知视为未过期。 */
function isAxisStale(snapshotAt: string | null, updatedAt: string | null) {
  const updated = parseTimestamp(updatedAt);
  if (updated === null) {
    return false;
  }

  const snapshot = parseTimestamp(snapshotAt);
  if (snapshot === null) {
    return true;
  }

  return updated > snapshot;
}

/**
 * 报告是否过期：Profile 或职位任一 updated_at 晚于生成快照即过期。
 * 过期报告仍可展示，由 UI 提示重新分析。
 */
function isMatchReportStale(input: MatchReportFreshnessInput): boolean {
  return (
    isAxisStale(input.profileSnapshotAt, input.profileUpdatedAt) ||
    isAxisStale(input.jobSnapshotAt, input.jobUpdatedAt)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

/**
 * 把 match_reports.report_json 解析成叙事结构。兼容 workflow 输出的
 * snake_case（ai_note）和 camelCase（aiNote）；aiNote 缺失视为非法报告。
 */
function coerceMatchReportNarrative(
  value: unknown,
): MatchReportNarrative | null {
  if (!isRecord(value)) {
    return null;
  }

  const aiNote =
    typeof value.ai_note === "string" ? value.ai_note : value.aiNote;

  if (typeof aiNote !== "string" || aiNote.trim().length === 0) {
    return null;
  }

  return {
    evidence: toStringArray(value.evidence),
    gaps: toStringArray(value.gaps),
    risks: toStringArray(value.risks),
    aiNote: aiNote.trim(),
  };
}

export { coerceMatchReportNarrative, isMatchReportStale };
export type {
  MatchReportFreshnessInput,
  MatchReportNarrative,
  MatchReportStatus,
};
