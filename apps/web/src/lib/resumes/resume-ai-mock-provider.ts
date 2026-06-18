import {
  richTextToPlainText,
  textToRichText,
  type ResumeDocument,
  type ResumeModule,
  type ResumePatch,
} from "@career-workbench/domain";

type ResumeAiMockInput = {
  document: ResumeDocument;
  prompt: string;
  resumeId: string;
  selectedModuleId: string | null;
};

type ResumeAiMockResult = {
  message: string;
  patch: ResumePatch;
};

const weakSkillPattern = /jquery|legacy|photoshop|office|wordpress/i;

async function generateMockResumePatch({
  document,
  prompt,
  resumeId: _resumeId,
  selectedModuleId,
}: ResumeAiMockInput): Promise<ResumeAiMockResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 480));

  const instruction = prompt.trim();

  if (!instruction) {
    throw new Error("请输入你希望 AI 修改的内容。");
  }

  const targets = pickTargetModules(document, instruction, selectedModuleId);

  if (targets.length === 0) {
    throw new Error("没有找到可修改的简历模块。");
  }

  const changes = targets.map((module) => ({
    data: rewriteModule(module, instruction),
    moduleId: module.id,
  }));

  const patch: ResumePatch = {
    changes,
    createdAt: new Date().toISOString(),
    description: buildPatchDescription(
      instruction,
      changes.map((change) => change.data),
    ),
    evidenceRefs: [
      "当前简历正文中的原始模块内容",
      "用户本次输入的修改要求",
      "当前目标职位上下文",
    ],
    id: createId("resume-patch"),
    original: targets.map((module) => ({
      data: cloneModule(module),
      moduleId: module.id,
    })),
    riskNotes: [
      "这是一份基于当前简历内容和本次指令生成的建议，采纳前请确认事实准确。",
      "涉及量化成果或职责范围的表达，采纳前建议人工确认。",
    ],
    status: "pending",
    title: buildPatchTitle(instruction),
  };

  return {
    message: `我生成了 ${changes.length} 个模块的修改建议。请先查看预览高亮和 Diff，再决定采纳或拒绝。`,
    patch,
  };
}

function pickTargetModules(
  document: ResumeDocument,
  instruction: string,
  selectedModuleId: string | null,
) {
  const lowered = instruction.toLowerCase();

  if (/技能|skill|无关|移除|remove/.test(lowered)) {
    return document.modules.filter(
      (module) => module.kind === "skills" || module.kind === "work",
    );
  }

  if (selectedModuleId) {
    const selected = document.modules.find(
      (module) => module.id === selectedModuleId,
    );
    return selected ? [selected] : [];
  }

  const firstEditable = document.modules.find(
    (module) => module.kind !== "personal",
  );
  return firstEditable ? [firstEditable] : document.modules.slice(0, 1);
}

function rewriteModule(
  module: ResumeModule,
  instruction: string,
): ResumeModule {
  switch (module.kind) {
    case "personal":
      return {
        ...module,
        personal: {
          ...module.personal,
          headline: polishText(
            module.personal.headline || "Product-minded frontend engineer",
            instruction,
          ),
        },
      };
    case "skills": {
      const nextSkills = module.skills
        .filter((skill) => !weakSkillPattern.test(skill))
        .filter(Boolean);

      if (!nextSkills.some((skill) => /dashboard/i.test(skill))) {
        nextSkills.push("Dashboard");
      }

      return { ...module, skills: nextSkills };
    }
    case "work":
      return {
        ...module,
        items: module.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                description: textToRichText(
                  rewriteRichText(
                    item.description,
                    "Built hiring-focused dashboards with React and TypeScript",
                  ),
                ),
                skills: uniqueStrings([...item.skills, "Dashboard"]),
              }
            : item,
        ),
      };
    case "projects":
      return {
        ...module,
        items: module.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                description: textToRichText(
                  rewriteRichText(
                    item.description,
                    "Highlighted project outcomes that match the target role",
                  ),
                ),
              }
            : item,
        ),
      };
    case "education":
      return {
        ...module,
        items: module.items.map((item, index) =>
          index === 0
            ? {
                ...item,
                description: textToRichText(
                  rewriteRichText(
                    item.description,
                    "Emphasized coursework relevant to the role",
                  ),
                ),
              }
            : item,
        ),
      };
    case "custom":
      return {
        ...module,
        module: {
          ...module.module,
          content: textToRichText(
            rewriteRichText(
              module.module.content,
              "Refined this section for the target role",
            ),
          ),
        },
      };
    case "preferences":
      return module;
    default:
      return module;
  }
}

function rewriteRichText(
  value: Parameters<typeof richTextToPlainText>[0],
  fallbackLine: string,
) {
  const lines = richTextToPlainText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return fallbackLine;
  }

  const [first, ...rest] = lines;
  return [polishText(first, fallbackLine), ...rest].join("\n");
}

function polishText(value: string, instruction: string) {
  const cleaned = value.trim();
  const base =
    cleaned || "Frontend engineer with product-minded delivery experience";

  if (/压缩|简洁|short|concise/i.test(instruction)) {
    return base.replace(/，|,/g, " ").split(/\s+/).slice(0, 12).join(" ");
  }

  if (/风险|夸张|真实|risk/i.test(instruction)) {
    return `${base}（已保留事实边界）`;
  }

  return `${base}，突出与目标职位相关的业务结果`;
}

function buildPatchTitle(instruction: string) {
  if (/技能|skill|无关|移除|remove/i.test(instruction)) {
    return "移除弱相关技能并对齐目标职位";
  }

  if (/压缩|简洁|short|concise/i.test(instruction)) {
    return "压缩表达并保留关键信息";
  }

  if (/风险|夸张|真实|risk/i.test(instruction)) {
    return "降低夸张风险";
  }

  return "优化当前简历模块";
}

function buildPatchDescription(instruction: string, modules: ResumeModule[]) {
  const moduleNames = modules.map(getModuleName).join("、");
  return `根据“${instruction}”调整 ${moduleNames}，只修改模块内容，不修改简历名称。`;
}

function getModuleName(module: ResumeModule) {
  const names: Record<ResumeModule["kind"], string> = {
    custom: "自定义模块",
    education: "教育经历",
    personal: "个人信息",
    preferences: "求职方向",
    projects: "项目经历",
    skills: "技能",
    work: "工作经历",
  };

  return module.kind === "custom"
    ? module.module.name || names.custom
    : names[module.kind];
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function cloneModule(module: ResumeModule): ResumeModule {
  return structuredClone(module);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export { generateMockResumePatch };
export type { ResumeAiMockInput, ResumeAiMockResult };
