/**
 * MatchReport（AI 匹配分析）领域类型与纯函数。
 *
 * 匹配度（0–100）和叙事都由 job_match workflow 的大模型产出，AI 直接
 * 读取 Profile + 结构化 JD 给出语义判断；本文件只描述报告内容、状态和
 * 复用/过期判断，不含 IO、持久化和 UI。
 */

/** match_reports 行的生命周期状态。 */
type MatchReportStatus = "pending" | "succeeded" | "failed";

/** AI 匹配分析产出：一个 0–100 匹配度加四类叙事。 */
type MatchReportNarrative = {
  /** AI 综合评估的匹配度，0–100 整数。 */
  matchScore: number;
  /** 命中证据：Profile 中能支撑该职位要求的事实。 */
  evidence: string[];
  /** 能力缺口：JD 要求但 Profile 缺少或证据不足的部分。 */
  gaps: string[];
  /** 风险表达：投递或简历表述中需要注意的风险点。 */
  risks: string[];
  /** 总评叙事，即匹配度背后的理由。 */
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

/** 解析匹配度：取数字（兼容 "85" 字符串），夹到 0–100 并取整。 */
function coerceMatchScore(value: unknown): number | null {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(raw)) {
    return null;
  }

  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * 把 match_reports.report_json 解析成报告结构。兼容 workflow 输出的
 * snake_case（match_score / ai_note）和 camelCase（matchScore / aiNote）；
 * 匹配度或 aiNote 缺失视为非法报告。
 */
function coerceMatchReportNarrative(
  value: unknown,
): MatchReportNarrative | null {
  if (!isRecord(value)) {
    return null;
  }

  const matchScore = coerceMatchScore(value.match_score ?? value.matchScore);

  if (matchScore === null) {
    return null;
  }

  const aiNote =
    typeof value.ai_note === "string" ? value.ai_note : value.aiNote;

  if (typeof aiNote !== "string" || aiNote.trim().length === 0) {
    return null;
  }

  return {
    matchScore,
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
