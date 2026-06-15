import { describe, expect, it } from "vitest";

import { coerceMatchReportNarrative, isMatchReportStale } from "./match-report";

describe("isMatchReportStale", () => {
  const base = {
    profileSnapshotAt: "2026-06-01T00:00:00Z",
    jobSnapshotAt: "2026-06-01T00:00:00Z",
    profileUpdatedAt: "2026-06-01T00:00:00Z",
    jobUpdatedAt: "2026-06-01T00:00:00Z",
  };

  it("快照与更新时间一致时不过期", () => {
    expect(isMatchReportStale(base)).toBe(false);
  });

  it("Profile 更新晚于快照时过期", () => {
    expect(
      isMatchReportStale({
        ...base,
        profileUpdatedAt: "2026-06-02T00:00:00Z",
      }),
    ).toBe(true);
  });

  it("职位更新晚于快照时过期", () => {
    expect(
      isMatchReportStale({
        ...base,
        jobUpdatedAt: "2026-06-02T08:30:00Z",
      }),
    ).toBe(true);
  });

  it("缺失快照时视为过期", () => {
    expect(
      isMatchReportStale({
        ...base,
        profileSnapshotAt: null,
      }),
    ).toBe(true);
  });

  it("当前更新时间未知时不判定过期", () => {
    expect(
      isMatchReportStale({
        ...base,
        profileUpdatedAt: null,
        jobUpdatedAt: null,
      }),
    ).toBe(false);
  });
});

describe("coerceMatchReportNarrative", () => {
  it("解析 workflow 的 snake_case 输出", () => {
    expect(
      coerceMatchReportNarrative({
        schema_version: "job.match.v1",
        match_score: 82,
        evidence: ["有 React 生产经验"],
        gaps: ["缺少支付链路案例"],
        risks: ["避免夸大 A/B 测试经验"],
        ai_note: "整体匹配度较好。",
      }),
    ).toEqual({
      matchScore: 82,
      evidence: ["有 React 生产经验"],
      gaps: ["缺少支付链路案例"],
      risks: ["避免夸大 A/B 测试经验"],
      aiNote: "整体匹配度较好。",
    });
  });

  it("兼容 camelCase 字段并过滤非字符串项", () => {
    expect(
      coerceMatchReportNarrative({
        matchScore: 70,
        evidence: ["证据 A", 42, ""],
        gaps: null,
        risks: ["风险 A"],
        aiNote: " 总评。 ",
      }),
    ).toEqual({
      matchScore: 70,
      evidence: ["证据 A"],
      gaps: [],
      risks: ["风险 A"],
      aiNote: "总评。",
    });
  });

  it("匹配度为字符串数字时解析，并夹到 0–100 取整", () => {
    expect(
      coerceMatchReportNarrative({
        match_score: "85.6",
        aiNote: "总评。",
      })?.matchScore,
    ).toBe(86);
    expect(
      coerceMatchReportNarrative({
        match_score: 140,
        aiNote: "总评。",
      })?.matchScore,
    ).toBe(100);
  });

  it("匹配度或 aiNote 缺失、非对象输入返回 null", () => {
    expect(coerceMatchReportNarrative({ ai_note: "缺分数" })).toBeNull();
    expect(
      coerceMatchReportNarrative({ match_score: 60, evidence: [] }),
    ).toBeNull();
    expect(coerceMatchReportNarrative("not a report")).toBeNull();
    expect(coerceMatchReportNarrative(null)).toBeNull();
  });
});
