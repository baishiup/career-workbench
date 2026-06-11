/**
 * 规则匹配分：根据 Profile 和结构化 JD 实时计算分数与等级标签。
 *
 * 全部为纯函数（无 IO、不持久化、不调 AI），由列表页和详情页在
 * 读取时调用。技能归一化用静态别名词典，不做语义匹配。
 */

import type { ProfileDraft, WorkItem } from "../profile/types";
import type { JobDescription } from "./types";

/** 分数区间映射出的等级标签。 */
type RuleMatchLabel = "强匹配" | "可冲刺" | "需补证据";

/** 计分明细，供 UI 解释分数，也是后续 job_match 工作流的输入。 */
type RuleMatchBreakdown = {
  /** 命中的必备技能（保留 JD 原始写法）。 */
  matchedRequiredSkills: string[];
  /** 未命中的必备技能（保留 JD 原始写法）。 */
  missingRequiredSkills: string[];
  /** 命中的加分技能（保留 JD 原始写法）。 */
  matchedPreferredSkills: string[];
  /** 从 JD 年限要求文本解析出的最低年限，解析失败为 null。 */
  yearsRequired: number | null;
  /** 由工作经历合并重叠区间后推算的年限。 */
  profileYears: number;
};

/** 规则匹配结果。 */
type RuleMatchResult = {
  /** 0–100 整数分。 */
  score: number;
  label: RuleMatchLabel;
  breakdown: RuleMatchBreakdown;
};

/**
 * 技能别名词典：key 和 value 都是「压缩形态」（小写、去掉空格和
 * 常见分隔符）。归一化时先压缩再查词典，未命中则用压缩形态本身。
 */
const skillAliasDictionary: Record<string, string> = {
  reactjs: "react",
  vuejs: "vue",
  angularjs: "angular",
  nextjs: "nextjs",
  next: "nextjs",
  node: "nodejs",
  golang: "go",
  postgres: "postgresql",
  postgre: "postgresql",
  k8s: "kubernetes",
  js: "javascript",
  ts: "typescript",
  py: "python",
  tf: "terraform",
  gcp: "googlecloud",
  amazonwebservices: "aws",
  microsoftazure: "azure",
  cicd: "cicd",
  ci: "cicd",
  scss: "sass",
  tailwindcss: "tailwind",
  reactnative: "reactnative",
  rn: "reactnative",
};

/** 各维度权重，JD 缺数据的维度会被剔除并按剩余权重归一化。 */
const dimensionWeights = {
  requiredSkills: 50,
  preferredSkills: 20,
  years: 20,
  remote: 10,
} as const;

/** 等级标签分数下限。 */
const labelThresholds = {
  strong: 75,
  stretch: 50,
} as const;

/**
 * 归一化技能写法：小写、去掉空格和 `.`/`-`/`_` 分隔符，再查别名词典，
 * 让 "ReactJS" 与 "React"、"Node.js" 与 "NodeJS" 互相命中。
 */
function normalizeSkill(raw: string): string {
  const compact = raw.trim().toLowerCase().replace(/[\s./_-]+/g, "");
  return skillAliasDictionary[compact] ?? compact;
}

/**
 * 从 JD 年限要求自由文本中解析最低年限，如 "5+ 年"、"3-5 years"。
 * 区间取下限；没有数字时返回 null，该维度不参与计分。
 */
function parseYearsRequired(text: string | null): number | null {
  if (!text) {
    return null;
  }

  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const years = Number.parseFloat(match[0]);
  return Number.isFinite(years) ? years : null;
}

/** 把 YYYY-MM 文本转成自 0 年起的月份序号，非法输入返回 null。 */
function parseYearMonth(text: string): number | null {
  const match = text.trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (month < 1 || month > 12) {
    return null;
  }

  return year * 12 + (month - 1);
}

/**
 * 由工作经历推算总年限：把每段经历转成月份区间，合并重叠后累计。
 * 在职（current 或缺结束日期）按当前月截止。
 */
function computeProfileYears(work: WorkItem[], now: Date = new Date()): number {
  const nowMonth = now.getFullYear() * 12 + now.getMonth();

  const intervals = work
    .map((item) => {
      const start = parseYearMonth(item.startDate);
      if (start === null) {
        return null;
      }

      const end =
        item.current || !item.endDate.trim()
          ? nowMonth
          : parseYearMonth(item.endDate);
      if (end === null || end < start) {
        return null;
      }

      // 同月入职离职也算 1 个月经验。
      return { start, end: end + 1 };
    })
    .filter((interval): interval is { start: number; end: number } =>
      interval !== null,
    )
    .sort((a, b) => a.start - b.start);

  let totalMonths = 0;
  let cursor = -1;

  for (const interval of intervals) {
    const start = Math.max(interval.start, cursor);
    if (interval.end > start) {
      totalMonths += interval.end - start;
      cursor = interval.end;
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Profile 是否具备计分条件：技能和工作经历都为空视为「无 Profile」，
 * 调用方应展示引导完善 Profile 的空状态，而不是调用计分。
 */
function hasMatchableProfile(
  profile: ProfileDraft | null | undefined,
): profile is ProfileDraft {
  if (!profile) {
    return false;
  }

  return profile.skills.length > 0 || profile.work.length > 0;
}

/** 统计 JD 技能列表里被 Profile 技能命中的项。 */
function splitSkillHits(jobSkills: string[], profileSkillSet: Set<string>) {
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of jobSkills) {
    if (profileSkillSet.has(normalizeSkill(skill))) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matched, missing };
}

/** 远程偏好兼容度：方向一致为 1，hybrid 视为兼容，完全相反给 0.5。 */
function remotePreferenceScore(
  openToRemote: boolean,
  remoteStatus: JobDescription["remoteStatus"],
): number {
  if (remoteStatus === "hybrid") {
    return 1;
  }

  if (openToRemote) {
    return remoteStatus === "remote" ? 1 : 0.5;
  }

  return remoteStatus === "onsite" ? 1 : 0.5;
}

/** 分数区间映射等级标签。 */
function matchLabelForScore(score: number): RuleMatchLabel {
  if (score >= labelThresholds.strong) {
    return "强匹配";
  }

  if (score >= labelThresholds.stretch) {
    return "可冲刺";
  }

  return "需补证据";
}

/**
 * 计算规则匹配分。
 *
 * 加权维度：必备技能命中率 50、加分技能命中率 20、年限满足度 20、
 * 远程偏好兼容度 10。JD 侧缺数据的维度（无技能标签、年限解析失败）
 * 剔除后按剩余权重归一化，保证输出仍是 0–100。
 */
function computeRuleMatch(
  profile: ProfileDraft,
  job: JobDescription,
  now: Date = new Date(),
): RuleMatchResult {
  const profileSkillSet = new Set(profile.skills.map(normalizeSkill));

  const required = splitSkillHits(job.requiredSkills, profileSkillSet);
  const preferred = splitSkillHits(job.preferredSkills, profileSkillSet);
  const yearsRequired = parseYearsRequired(job.yearsRequired);
  const profileYears = computeProfileYears(profile.work, now);

  const dimensions: { weight: number; score: number }[] = [];

  if (job.requiredSkills.length > 0) {
    dimensions.push({
      weight: dimensionWeights.requiredSkills,
      score: required.matched.length / job.requiredSkills.length,
    });
  }

  if (job.preferredSkills.length > 0) {
    dimensions.push({
      weight: dimensionWeights.preferredSkills,
      score: preferred.matched.length / job.preferredSkills.length,
    });
  }

  if (yearsRequired !== null && yearsRequired > 0) {
    dimensions.push({
      weight: dimensionWeights.years,
      score: Math.min(1, profileYears / yearsRequired),
    });
  }

  dimensions.push({
    weight: dimensionWeights.remote,
    score: remotePreferenceScore(profile.preferences.openToRemote, job.remoteStatus),
  });

  const totalWeight = dimensions.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = dimensions.reduce(
    (sum, item) => sum + item.weight * item.score,
    0,
  );

  const score = Math.round((weightedScore / totalWeight) * 100);

  return {
    score,
    label: matchLabelForScore(score),
    breakdown: {
      matchedRequiredSkills: required.matched,
      missingRequiredSkills: required.missing,
      matchedPreferredSkills: preferred.matched,
      yearsRequired,
      profileYears,
    },
  };
}

export {
  computeProfileYears,
  computeRuleMatch,
  hasMatchableProfile,
  matchLabelForScore,
  normalizeSkill,
  parseYearsRequired,
};
export type { RuleMatchBreakdown, RuleMatchLabel, RuleMatchResult };
