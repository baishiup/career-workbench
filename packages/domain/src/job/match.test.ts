import { describe, expect, it } from "vitest";

import type { ProfileDraft } from "../profile/types";
import {
  computeProfileYears,
  computeRuleMatch,
  hasMatchableProfile,
  matchLabelForScore,
  normalizeSkill,
  parseYearsRequired,
} from "./match";
import type { JobDescription } from "./types";

const fixedNow = new Date("2026-06-01T00:00:00Z");

function buildProfile(overrides: Partial<ProfileDraft> = {}): ProfileDraft {
  return {
    personal: {
      firstName: "",
      lastName: "",
      headline: "",
      email: "",
      phone: "",
      city: "",
      linkedin: "",
      github: "",
      portfolio: "",
      customFields: [],
    },
    preferences: {
      jobFunction: "",
      jobTypes: [],
      openToRemote: true,
      targetCity: "",
      salaryExpectation: "",
    },
    education: [],
    work: [],
    projects: [],
    skills: [],
    ...overrides,
  };
}

function buildWorkItem(
  overrides: Partial<ProfileDraft["work"][number]> = {},
): ProfileDraft["work"][number] {
  return {
    id: "w1",
    company: "Acme",
    title: "Engineer",
    location: "",
    jobType: "",
    startDate: "2020-01",
    endDate: "2023-01",
    current: false,
    summary: "",
    bullets: [],
    ...overrides,
  };
}

function buildJob(overrides: Partial<JobDescription> = {}): JobDescription {
  return {
    id: "job-1",
    sourcePlatform: null,
    sourceUrl: null,
    company: "Acme",
    title: "前端工程师",
    companyStage: null,
    location: null,
    remoteStatus: "remote",
    jobType: "full_time",
    seniority: null,
    yearsRequired: null,
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    requirements: [],
    salaryRange: null,
    postedAt: null,
    summary: null,
    importedBy: null,
    importMethod: "manual_form",
    isActive: true,
    ...overrides,
  };
}

describe("normalizeSkill", () => {
  it("忽略大小写和分隔符", () => {
    expect(normalizeSkill("  TypeScript ")).toBe("typescript");
    expect(normalizeSkill("Node.js")).toBe(normalizeSkill("NodeJS"));
    expect(normalizeSkill("React Native")).toBe(normalizeSkill("react-native"));
  });

  it("通过别名词典命中常见变体", () => {
    expect(normalizeSkill("ReactJS")).toBe(normalizeSkill("React"));
    expect(normalizeSkill("Golang")).toBe(normalizeSkill("Go"));
    expect(normalizeSkill("Postgres")).toBe(normalizeSkill("PostgreSQL"));
    expect(normalizeSkill("K8s")).toBe(normalizeSkill("Kubernetes"));
  });
});

describe("parseYearsRequired", () => {
  it("解析常见年限文本，区间取下限", () => {
    expect(parseYearsRequired("5+ 年")).toBe(5);
    expect(parseYearsRequired("3-5 years")).toBe(3);
    expect(parseYearsRequired("至少 2 年经验")).toBe(2);
  });

  it("无数字或空输入返回 null", () => {
    expect(parseYearsRequired(null)).toBeNull();
    expect(parseYearsRequired("不限")).toBeNull();
  });
});

describe("computeProfileYears", () => {
  it("合并重叠区间后累计年限", () => {
    const years = computeProfileYears(
      [
        buildWorkItem({ startDate: "2020-01", endDate: "2022-01" }),
        buildWorkItem({ id: "w2", startDate: "2021-01", endDate: "2023-01" }),
      ],
      fixedNow,
    );

    // 2020-01 到 2023-01 连续区间，约 3 年。
    expect(years).toBeGreaterThanOrEqual(3);
    expect(years).toBeLessThan(3.5);
  });

  it("在职经历按当前时间截止", () => {
    const years = computeProfileYears(
      [buildWorkItem({ startDate: "2024-06", endDate: "", current: true })],
      fixedNow,
    );

    expect(years).toBeCloseTo(2, 0);
  });

  it("忽略非法日期", () => {
    expect(
      computeProfileYears([buildWorkItem({ startDate: "未知" })], fixedNow),
    ).toBe(0);
  });
});

describe("hasMatchableProfile", () => {
  it("技能和工作经历都为空视为无 Profile", () => {
    expect(hasMatchableProfile(null)).toBe(false);
    expect(hasMatchableProfile(undefined)).toBe(false);
    expect(hasMatchableProfile(buildProfile())).toBe(false);
  });

  it("有技能或工作经历即可计分", () => {
    expect(hasMatchableProfile(buildProfile({ skills: ["React"] }))).toBe(true);
    expect(hasMatchableProfile(buildProfile({ work: [buildWorkItem()] }))).toBe(
      true,
    );
  });
});

describe("matchLabelForScore", () => {
  it("分数区间映射等级标签", () => {
    expect(matchLabelForScore(75)).toBe("强匹配");
    expect(matchLabelForScore(74)).toBe("可冲刺");
    expect(matchLabelForScore(50)).toBe("可冲刺");
    expect(matchLabelForScore(49)).toBe("需补证据");
  });
});

describe("computeRuleMatch", () => {
  it("技能全部命中且年限满足时为强匹配", () => {
    const profile = buildProfile({
      skills: ["React", "TypeScript", "Node.js"],
      work: [buildWorkItem({ startDate: "2018-01", endDate: "2024-01" })],
    });
    const job = buildJob({
      requiredSkills: ["ReactJS", "TypeScript"],
      preferredSkills: ["NodeJS"],
      yearsRequired: "3+ 年",
      remoteStatus: "remote",
    });

    const result = computeRuleMatch(profile, job, fixedNow);

    expect(result.score).toBe(100);
    expect(result.label).toBe("强匹配");
    expect(result.breakdown.matchedRequiredSkills).toEqual([
      "ReactJS",
      "TypeScript",
    ]);
    expect(result.breakdown.missingRequiredSkills).toEqual([]);
    expect(result.breakdown.matchedPreferredSkills).toEqual(["NodeJS"]);
  });

  it("技能全部未命中时为需补证据", () => {
    const profile = buildProfile({ skills: ["Java", "Spring"] });
    const job = buildJob({
      requiredSkills: ["React", "TypeScript"],
      preferredSkills: ["Tailwind"],
      yearsRequired: "5 年",
    });

    const result = computeRuleMatch(profile, job, fixedNow);

    expect(result.label).toBe("需补证据");
    expect(result.breakdown.matchedRequiredSkills).toEqual([]);
    expect(result.breakdown.missingRequiredSkills).toEqual([
      "React",
      "TypeScript",
    ]);
  });

  it("归一化后 ReactJS 能命中 Profile 里的 React", () => {
    const profile = buildProfile({ skills: ["react"] });
    const job = buildJob({ requiredSkills: ["ReactJS"] });

    const result = computeRuleMatch(profile, job, fixedNow);

    expect(result.breakdown.matchedRequiredSkills).toEqual(["ReactJS"]);
  });

  it("JD 缺技能与年限时按剩余权重归一化，分数仍在 0-100", () => {
    const profile = buildProfile({
      skills: ["React"],
      preferences: {
        jobFunction: "",
        jobTypes: [],
        openToRemote: true,
        targetCity: "",
        salaryExpectation: "",
      },
    });
    const job = buildJob({
      requiredSkills: [],
      preferredSkills: [],
      yearsRequired: null,
      remoteStatus: "remote",
    });

    const result = computeRuleMatch(profile, job, fixedNow);

    // 只剩远程偏好维度且完全兼容。
    expect(result.score).toBe(100);
  });

  it("远程偏好不兼容会拉低分数", () => {
    const profile = buildProfile({
      skills: ["React"],
      preferences: {
        jobFunction: "",
        jobTypes: [],
        openToRemote: true,
        targetCity: "",
        salaryExpectation: "",
      },
    });
    const remoteJob = buildJob({
      requiredSkills: ["React"],
      remoteStatus: "remote",
    });
    const onsiteJob = buildJob({
      requiredSkills: ["React"],
      remoteStatus: "onsite",
    });

    const remoteScore = computeRuleMatch(profile, remoteJob, fixedNow).score;
    const onsiteScore = computeRuleMatch(profile, onsiteJob, fixedNow).score;

    expect(onsiteScore).toBeLessThan(remoteScore);
  });
});
