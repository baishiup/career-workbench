import { describe, expect, it } from "vitest";

import { textToRichText } from "../rich-text";
import type { ResumeDocument, ResumePatch } from "../index";
import {
  applyResumePatch,
  deriveResumePatchDiff,
  rejectResumePatch,
} from "./patch";

const baseDocument: ResumeDocument = {
  modules: [
    {
      id: "module-personal",
      kind: "personal",
      personal: {
        avatarUrl: "",
        city: "Shanghai",
        customFields: [],
        email: "me@example.com",
        fullName: "Alex Chen",
        github: "",
        headline: "Frontend Developer",
        linkedin: "",
        phone: "",
        portfolio: "",
      },
      visible: true,
    },
    {
      id: "module-skills",
      kind: "skills",
      skills: ["React", "TypeScript", "jQuery"],
      visible: true,
    },
    {
      id: "module-work",
      items: [
        {
          company: "Acme",
          current: true,
          description: textToRichText(
            "Built admin pages\nMaintained legacy UI",
          ),
          endDate: "",
          id: "work-1",
          skills: ["React"],
          startDate: "2022",
          title: "Frontend Engineer",
        },
      ],
      kind: "work",
      visible: true,
    },
  ],
  title: "Original Resume Title",
};

function createPatch(): ResumePatch {
  const skills = baseDocument.modules[1];
  const work = baseDocument.modules[2];

  if (skills.kind !== "skills" || work.kind !== "work") {
    throw new Error("Invalid fixture");
  }

  return {
    changes: [
      {
        data: {
          ...skills,
          skills: ["React", "TypeScript", "Dashboard"],
        },
        moduleId: skills.id,
      },
      {
        data: {
          ...work,
          items: [
            {
              ...work.items[0],
              description: textToRichText(
                "Built hiring dashboards with React\nImproved internal workflow clarity",
              ),
            },
          ],
        },
        moduleId: work.id,
      },
    ],
    createdAt: "2026-06-15T00:00:00Z",
    description: "移除弱相关技能，并强化工作经历与目标职位的关联。",
    evidenceRefs: ["Profile.skills", "Job.requiredSkills"],
    id: "patch-1",
    original: [
      { data: skills, moduleId: skills.id },
      { data: work, moduleId: work.id },
    ],
    riskNotes: ["量化结果需要人工确认。"],
    status: "pending",
    title: "对齐目标职位技能与经历",
  };
}

describe("resume patch", () => {
  it("采纳 patch 只替换 changes 声明的模块，不修改简历标题", () => {
    const result = applyResumePatch(baseDocument, createPatch());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.document.title).toBe("Original Resume Title");
    expect(result.document.modules[0]).toBe(baseDocument.modules[0]);
    expect(result.document.modules[1]).not.toBe(baseDocument.modules[1]);
    expect(result.document.modules[2]).not.toBe(baseDocument.modules[2]);
  });

  it("拒绝 patch 不修改主数据", () => {
    const rejected = rejectResumePatch(createPatch());

    expect(rejected.status).toBe("rejected");
    expect(baseDocument.modules[1]).toEqual(createPatch().original[0].data);
  });

  it("派生 tag 级和富文本行级 diff", () => {
    const diff = deriveResumePatchDiff(createPatch());
    const fields = diff.flatMap((item) => item.fieldDiffs);

    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          after: "",
          before: "jQuery",
          kind: "removed",
          label: "技能",
        }),
        expect.objectContaining({
          after: "Dashboard",
          before: "",
          kind: "added",
          label: "技能",
        }),
        expect.objectContaining({
          after: "Built hiring dashboards with React",
          before: "Built admin pages",
          kind: "changed",
          label: "工作描述",
        }),
      ]),
    );
  });
});
