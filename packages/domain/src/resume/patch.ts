/**
 * 简历 AI patch 领域模型。
 *
 * Patch 只描述模块级新数据：AI 不能修改简历标题，也不能直接写入持久化。
 * UI 可以基于 original 与 changes 派生字段级、tag 级和富文本行级 diff。
 */

import { richTextToPlainText, type RichText } from "../rich-text";
import type {
  EducationItem,
  PersonalInfo,
  ProjectItem,
  WorkItem,
} from "../profile/types";
import type { ResumeDocument, ResumeModule } from "./types";

/** AI 修改建议的决策状态。 */
type ResumePatchStatus = "pending" | "accepted" | "rejected";

/** 生成 patch 时保存的原始模块快照，用于 compare、日志和冲突规避。 */
type ResumePatchModuleSnapshot = {
  moduleId: string;
  data: ResumeModule;
};

/** AI 建议写入的新模块数据。 */
type ResumePatchModuleChange = {
  moduleId: string;
  data: ResumeModule;
};

/** AI 生成的待采纳简历修改建议。 */
type ResumePatch = {
  id: string;
  title: string;
  description: string;
  original: ResumePatchModuleSnapshot[];
  changes: ResumePatchModuleChange[];
  evidenceRefs: string[];
  riskNotes: string[];
  status: ResumePatchStatus;
  createdAt: string;
  decidedAt?: string;
};

/** 用户可见的简历修改记录。 */
type ResumeChangeLogEntry = {
  id: string;
  resumeId: string;
  patchId?: string;
  actor: "user" | "ai" | "system";
  changeType:
    | "ai_suggested_patch"
    | "user_accepted_patch"
    | "user_rejected_patch";
  title: string;
  description: string;
  moduleIds: string[];
  createdAt: string;
};

/** UI 派生 diff 的最小粒度。 */
type ResumePatchDiff = {
  moduleId: string;
  fieldDiffs: ResumePatchFieldDiff[];
};

/** 单个字段、tag 或富文本行的差异。 */
type ResumePatchFieldDiff = {
  path: string;
  label: string;
  before: string;
  after: string;
  kind: "added" | "removed" | "changed";
};

type ApplyResumePatchResult =
  | { ok: true; document: ResumeDocument }
  | { ok: false; reason: string };

function applyResumePatch(
  document: ResumeDocument,
  patch: ResumePatch,
): ApplyResumePatchResult {
  if (patch.status !== "pending") {
    return { ok: false, reason: "只能采纳待处理的 AI 修改建议。" };
  }

  const modulesById = new Map(
    document.modules.map((module) => [module.id, module] as const),
  );

  for (const change of patch.changes) {
    const current = modulesById.get(change.moduleId);

    if (!current) {
      return { ok: false, reason: "AI 修改建议指向的模块不存在。" };
    }

    if (change.data.id !== change.moduleId) {
      return { ok: false, reason: "AI 修改建议的模块 ID 不一致。" };
    }
  }

  const changesById = new Map(
    patch.changes.map((change) => [change.moduleId, change.data] as const),
  );

  return {
    document: {
      ...document,
      modules: document.modules.map(
        (module) => changesById.get(module.id) ?? module,
      ),
    },
    ok: true,
  };
}

function acceptResumePatch(
  patch: ResumePatch,
  decidedAt = new Date().toISOString(),
): ResumePatch {
  return { ...patch, decidedAt, status: "accepted" };
}

function rejectResumePatch(
  patch: ResumePatch,
  decidedAt = new Date().toISOString(),
): ResumePatch {
  return { ...patch, decidedAt, status: "rejected" };
}

function createResumeChangeLogFromPatchDecision({
  action,
  patch,
  resumeId,
}: {
  action: "accepted" | "rejected" | "suggested";
  patch: ResumePatch;
  resumeId: string;
}): ResumeChangeLogEntry {
  const moduleIds = patch.changes.map((change) => change.moduleId);
  const prefix =
    action === "accepted" ? "采纳" : action === "rejected" ? "拒绝" : "生成";

  return {
    actor: action === "suggested" ? "ai" : "user",
    changeType:
      action === "accepted"
        ? "user_accepted_patch"
        : action === "rejected"
          ? "user_rejected_patch"
          : "ai_suggested_patch",
    createdAt: new Date().toISOString(),
    description: `${prefix} AI 修改建议：${patch.description}`,
    id: stablePatchId("change-log"),
    moduleIds,
    patchId: patch.id,
    resumeId,
    title: `${prefix}：${patch.title}`,
  };
}

function deriveResumePatchDiff(patch: ResumePatch): ResumePatchDiff[] {
  const originalById = new Map(
    patch.original.map(
      (snapshot) => [snapshot.moduleId, snapshot.data] as const,
    ),
  );

  return patch.changes
    .map((change): ResumePatchDiff | null => {
      const original = originalById.get(change.moduleId);

      if (!original) {
        return {
          fieldDiffs: [
            {
              after: summarizeResumeModule(change.data),
              before: "",
              kind: "added",
              label: getModuleTitle(change.data),
              path: `${change.moduleId}`,
            },
          ],
          moduleId: change.moduleId,
        };
      }

      return {
        fieldDiffs: diffResumeModule(original, change.data),
        moduleId: change.moduleId,
      };
    })
    .filter((diff): diff is ResumePatchDiff =>
      Boolean(diff && diff.fieldDiffs.length > 0),
    );
}

function summarizeResumeModule(module: ResumeModule): string {
  switch (module.kind) {
    case "personal":
      return [
        module.personal.fullName,
        module.personal.headline,
        module.personal.email,
      ]
        .filter(Boolean)
        .join(" / ");
    case "skills":
      return module.skills.filter(Boolean).join(" / ");
    case "work":
      return module.items
        .map((item) => [item.company, item.title].filter(Boolean).join(" / "))
        .filter(Boolean)
        .join("; ");
    case "projects":
      return module.items
        .map((item) => [item.name, item.role].filter(Boolean).join(" / "))
        .filter(Boolean)
        .join("; ");
    case "education":
      return module.items
        .map((item) =>
          [item.school, item.degree, item.major].filter(Boolean).join(" / "),
        )
        .filter(Boolean)
        .join("; ");
    case "preferences":
      return [
        module.preferences.jobFunction,
        module.preferences.targetCity,
        module.preferences.salaryExpectation,
      ]
        .filter(Boolean)
        .join(" / ");
    case "custom":
      return `${module.module.name}: ${richTextToPlainText(module.module.content)}`.trim();
    default:
      return "";
  }
}

function diffResumeModule(
  before: ResumeModule,
  after: ResumeModule,
): ResumePatchFieldDiff[] {
  if (before.kind !== after.kind) {
    return [
      {
        after: summarizeResumeModule(after),
        before: summarizeResumeModule(before),
        kind: "changed",
        label: "模块类型",
        path: `${before.id}.kind`,
      },
    ];
  }

  switch (before.kind) {
    case "personal":
      if (after.kind !== "personal") {
        return [];
      }
      return diffPersonal(before.personal, after.personal);
    case "skills":
      if (after.kind !== "skills") {
        return [];
      }
      return diffStringList("skills", "技能", before.skills, after.skills);
    case "work":
      if (after.kind !== "work") {
        return [];
      }
      return diffItemList("work", before.items, after.items, diffWorkItem);
    case "projects":
      if (after.kind !== "projects") {
        return [];
      }
      return diffItemList(
        "projects",
        before.items,
        after.items,
        diffProjectItem,
      );
    case "education":
      if (after.kind !== "education") {
        return [];
      }
      return diffItemList(
        "education",
        before.items,
        after.items,
        diffEducationItem,
      );
    case "preferences":
      if (after.kind !== "preferences") {
        return [];
      }
      return [
        ...diffText(
          "preferences.jobFunction",
          "求职方向",
          before.preferences.jobFunction,
          after.preferences.jobFunction,
        ),
        ...diffText(
          "preferences.targetCity",
          "目标城市",
          before.preferences.targetCity,
          after.preferences.targetCity,
        ),
        ...diffText(
          "preferences.salaryExpectation",
          "薪资期望",
          before.preferences.salaryExpectation,
          after.preferences.salaryExpectation,
        ),
      ];
    case "custom":
      if (after.kind !== "custom") {
        return [];
      }
      return [
        ...diffText(
          "custom.name",
          "模块名称",
          before.module.name,
          after.module.name,
        ),
        ...diffRichTextLines(
          "custom.content",
          "自定义内容",
          before.module.content,
          after.module.content,
        ),
      ];
    default:
      return [];
  }
}

function diffPersonal(
  before: PersonalInfo,
  after: PersonalInfo,
): ResumePatchFieldDiff[] {
  return [
    ...diffText("personal.fullName", "姓名", before.fullName, after.fullName),
    ...diffText("personal.headline", "标题", before.headline, after.headline),
    ...diffText(
      "personal.avatarUrl",
      "头像",
      before.avatarUrl,
      after.avatarUrl,
    ),
    ...diffText("personal.email", "邮箱", before.email, after.email),
    ...diffText("personal.phone", "电话", before.phone, after.phone),
    ...diffText("personal.city", "城市", before.city, after.city),
    ...diffText(
      "personal.linkedin",
      "LinkedIn",
      before.linkedin,
      after.linkedin,
    ),
    ...diffText("personal.github", "GitHub", before.github, after.github),
    ...diffText(
      "personal.portfolio",
      "作品集",
      before.portfolio,
      after.portfolio,
    ),
  ];
}

function diffWorkItem(
  before: WorkItem,
  after: WorkItem,
  path: string,
): ResumePatchFieldDiff[] {
  return [
    ...diffText(`${path}.company`, "公司", before.company, after.company),
    ...diffText(`${path}.title`, "职位", before.title, after.title),
    ...diffText(
      `${path}.startDate`,
      "开始时间",
      before.startDate,
      after.startDate,
    ),
    ...diffText(`${path}.endDate`, "结束时间", before.endDate, after.endDate),
    ...diffRichTextLines(
      `${path}.description`,
      "工作描述",
      before.description,
      after.description,
    ),
    ...diffStringList(
      `${path}.skills`,
      "相关技能",
      before.skills,
      after.skills,
    ),
  ];
}

function diffProjectItem(
  before: ProjectItem,
  after: ProjectItem,
  path: string,
): ResumePatchFieldDiff[] {
  return [
    ...diffText(`${path}.name`, "项目名称", before.name, after.name),
    ...diffText(`${path}.role`, "角色", before.role, after.role),
    ...diffText(
      `${path}.startDate`,
      "开始时间",
      before.startDate,
      after.startDate,
    ),
    ...diffText(`${path}.endDate`, "结束时间", before.endDate, after.endDate),
    ...diffRichTextLines(
      `${path}.description`,
      "项目描述",
      before.description,
      after.description,
    ),
    ...diffStringList(
      `${path}.skills`,
      "相关技能",
      before.skills,
      after.skills,
    ),
  ];
}

function diffEducationItem(
  before: EducationItem,
  after: EducationItem,
  path: string,
): ResumePatchFieldDiff[] {
  return [
    ...diffText(`${path}.school`, "学校", before.school, after.school),
    ...diffText(`${path}.degree`, "学位", before.degree, after.degree),
    ...diffText(`${path}.major`, "专业", before.major, after.major),
    ...diffText(
      `${path}.startDate`,
      "开始时间",
      before.startDate,
      after.startDate,
    ),
    ...diffText(`${path}.endDate`, "结束时间", before.endDate, after.endDate),
    ...diffRichTextLines(
      `${path}.description`,
      "教育描述",
      before.description,
      after.description,
    ),
  ];
}

function diffItemList<TItem extends { id: string }>(
  basePath: string,
  before: TItem[],
  after: TItem[],
  diffItem: (
    before: TItem,
    after: TItem,
    path: string,
  ) => ResumePatchFieldDiff[],
): ResumePatchFieldDiff[] {
  const diffs: ResumePatchFieldDiff[] = [];
  const afterById = new Map(after.map((item) => [item.id, item] as const));
  const beforeById = new Map(before.map((item) => [item.id, item] as const));

  before.forEach((item, index) => {
    const next = afterById.get(item.id);
    const path = `${basePath}[${index}]`;

    if (!next) {
      diffs.push({
        after: "",
        before: stringifyItem(item),
        kind: "removed",
        label: "删除条目",
        path,
      });
      return;
    }

    diffs.push(...diffItem(item, next, path));
  });

  after.forEach((item, index) => {
    if (!beforeById.has(item.id)) {
      diffs.push({
        after: stringifyItem(item),
        before: "",
        kind: "added",
        label: "新增条目",
        path: `${basePath}[${index}]`,
      });
    }
  });

  return diffs;
}

function diffText(
  path: string,
  label: string,
  before: string | boolean | null | undefined,
  after: string | boolean | null | undefined,
): ResumePatchFieldDiff[] {
  const beforeText = String(before ?? "").trim();
  const afterText = String(after ?? "").trim();

  if (beforeText === afterText) {
    return [];
  }

  return [
    {
      after: afterText,
      before: beforeText,
      kind: beforeText ? (afterText ? "changed" : "removed") : "added",
      label,
      path,
    },
  ];
}

function diffStringList(
  path: string,
  label: string,
  before: string[],
  after: string[],
): ResumePatchFieldDiff[] {
  const beforeSet = new Set(before.map((item) => item.trim()).filter(Boolean));
  const afterSet = new Set(after.map((item) => item.trim()).filter(Boolean));
  const diffs: ResumePatchFieldDiff[] = [];

  beforeSet.forEach((item) => {
    if (!afterSet.has(item)) {
      diffs.push({
        after: "",
        before: item,
        kind: "removed",
        label,
        path: `${path}.${slug(item)}`,
      });
    }
  });

  afterSet.forEach((item) => {
    if (!beforeSet.has(item)) {
      diffs.push({
        after: item,
        before: "",
        kind: "added",
        label,
        path: `${path}.${slug(item)}`,
      });
    }
  });

  return diffs;
}

function diffRichTextLines(
  path: string,
  label: string,
  before: RichText | string,
  after: RichText | string,
): ResumePatchFieldDiff[] {
  const beforeLines = richTextToPlainText(before)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const afterLines = richTextToPlainText(after)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const max = Math.max(beforeLines.length, afterLines.length);
  const diffs: ResumePatchFieldDiff[] = [];

  for (let index = 0; index < max; index += 1) {
    const beforeLine = beforeLines[index] ?? "";
    const afterLine = afterLines[index] ?? "";

    if (beforeLine === afterLine) {
      continue;
    }

    diffs.push({
      after: afterLine,
      before: beforeLine,
      kind: beforeLine ? (afterLine ? "changed" : "removed") : "added",
      label,
      path: `${path}.line${index + 1}`,
    });
  }

  return diffs;
}

function getModuleTitle(module: ResumeModule) {
  const titles: Record<ResumeModule["kind"], string> = {
    custom: "自定义模块",
    education: "教育经历",
    personal: "个人信息",
    preferences: "求职方向",
    projects: "项目经历",
    skills: "技能",
    work: "工作经历",
  };

  return module.kind === "custom"
    ? module.module.name || titles.custom
    : titles[module.kind];
}

function stringifyItem(value: unknown) {
  return JSON.stringify(value);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-");
}

function stablePatchId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type {
  ApplyResumePatchResult,
  ResumeChangeLogEntry,
  ResumePatch,
  ResumePatchDiff,
  ResumePatchFieldDiff,
  ResumePatchModuleChange,
  ResumePatchModuleSnapshot,
  ResumePatchStatus,
};

export {
  acceptResumePatch,
  applyResumePatch,
  createResumeChangeLogFromPatchDecision,
  deriveResumePatchDiff,
  rejectResumePatch,
  summarizeResumeModule,
};
