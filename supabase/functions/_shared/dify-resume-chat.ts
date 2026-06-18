/**
 * Dify resume_chat 适配层。
 *
 * 负责调用 Dify Chatflow 并把输出收敛为 ResumePatch。业务函数只消费
 * message + patch，不直接依赖 Dify 的响应形状。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import {
  coerceRichText,
  type ResumeDocument,
  type ResumeModule,
} from "./resume-normalize.ts";

const DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1";
const DEFAULT_DIFY_USER = "career-workbench-debug";

type DifyResumeChatStage = "config" | "chat_message" | "chat_output";

type DifyResumeChatInput = {
  conversationId?: string | null;
  document: ResumeDocument;
  prompt: string;
  resumeId: string;
  selectedModuleId?: string | null;
};

type ResumePatch = {
  changes: Array<{ data: ResumeModule; moduleId: string }>;
  createdAt: string;
  decidedAt?: string;
  description: string;
  evidenceRefs: string[];
  id: string;
  original: Array<{ data: ResumeModule; moduleId: string }>;
  riskNotes: string[];
  status: "pending" | "accepted" | "rejected";
  title: string;
};

type DifyResumeChatResult = {
  conversationId: string | null;
  message: string;
  messageId: string | null;
  patch: ResumePatch | null;
  provider: "dify";
  taskId: string | null;
  workflowRunId: string | null;
};

class DifyResumeChatError extends Error {
  details?: unknown;
  stage: DifyResumeChatStage;
  status: number;

  constructor(
    message: string,
    status: number,
    stage: DifyResumeChatStage,
    details?: unknown,
  ) {
    super(message);
    this.name = "DifyResumeChatError";
    this.status = status;
    this.stage = stage;
    this.details = details;
  }
}

async function runResumeChatWithDify(
  input: DifyResumeChatInput,
): Promise<DifyResumeChatResult> {
  const difyApiKey = Deno.env.get("DIFY_RESUME_CHAT_API_KEY")?.trim();

  if (!difyApiKey) {
    throw new DifyResumeChatError(
      "Missing DIFY_RESUME_CHAT_API_KEY",
      500,
      "config",
    );
  }

  const prompt = input.prompt.trim();

  if (!prompt) {
    throw new DifyResumeChatError("Prompt is required", 400, "chat_message");
  }

  const difyBaseUrl = normalizeBaseUrl(
    getEnv("DIFY_BASE_URL", DEFAULT_DIFY_BASE_URL),
  );
  const difyUser = getEnv("DIFY_USER", DEFAULT_DIFY_USER);
  const chatPayload = {
    conversation_id: input.conversationId ?? "",
    inputs: {
      current_resume_json: JSON.stringify(input.document),
      resume_id: input.resumeId,
      selected_module_id: input.selectedModuleId ?? "",
      selected_module_json: JSON.stringify(
        getSelectedModule(input.document, input.selectedModuleId) ?? null,
      ),
    },
    query: prompt,
    response_mode: "blocking",
    user: difyUser,
  };

  const chatResponse = await fetch(`${difyBaseUrl}/chat-messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${difyApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chatPayload),
  });
  const chatBody = await readResponseBody(chatResponse);

  if (!chatResponse.ok) {
    if (isNoPatchDifyRunFailure(chatBody)) {
      return {
        conversationId: input.conversationId ?? null,
        message:
          "请告诉我你希望修改简历的具体方向，例如压缩某段经历、更新城市，或移除无关技能。",
        messageId: null,
        patch: null,
        provider: "dify",
        taskId: null,
        workflowRunId: null,
      };
    }

    throw new DifyResumeChatError(
      "Dify chat message failed",
      502,
      "chat_message",
      {
        body: chatBody,
        status: chatResponse.status,
      },
    );
  }

  const output = extractResumeChatOutput(chatBody);
  const patch = output.changes.length > 0
    ? buildPatchFromOutput({
      document: input.document,
      output,
      prompt,
    })
    : null;

  return {
    conversationId: getString(chatBody, "conversation_id"),
    message: output.message ??
      (patch
        ? `我生成了 ${patch.changes.length} 个模块的修改建议。请先查看预览高亮和 Diff，再决定采纳或拒绝。`
        : "请告诉我你希望修改简历的具体方向。"),
    messageId: getString(chatBody, "message_id") ?? getString(chatBody, "id"),
    patch,
    provider: "dify",
    taskId: getString(chatBody, "task_id"),
    workflowRunId: output.workflowRunId,
  };
}

type ResumeChatOutput = {
  description?: string;
  evidenceRefs?: string[];
  message?: string;
  riskNotes?: string[];
  title?: string;
  changes: Array<{ data: Record<string, unknown>; moduleId: string }>;
  workflowRunId: string | null;
};

function extractResumeChatOutput(body: unknown): ResumeChatOutput {
  const answer = isRecord(body) ? body.answer : null;
  const candidates = getOutputCandidates(answer);

  for (const candidate of candidates) {
    const parsed = parseMaybeJson(candidate);

    if (!isRecord(parsed)) {
      continue;
    }

    const changes = extractChanges(parsed);

    if (Array.isArray(parsed.changes) || changes.length > 0) {
      return {
        changes,
        description: getString(parsed, "description") ?? undefined,
        evidenceRefs: getStringArray(
          parsed.evidenceRefs ?? parsed.evidence_refs,
        ),
        message: getString(parsed, "message") ?? getString(body, "answer") ??
          undefined,
        riskNotes: getStringArray(parsed.riskNotes ?? parsed.risk_notes),
        title: getString(parsed, "title") ?? undefined,
        workflowRunId: getString(parsed, "workflow_run_id"),
      };
    }

    const patch = isRecord(parsed.patch) ? parsed.patch : null;

    if (patch) {
      const patchChanges = extractChanges(patch);

      if (Array.isArray(patch.changes) || patchChanges.length > 0) {
        return {
          changes: patchChanges,
          description: getString(patch, "description") ??
            getString(parsed, "description") ??
            undefined,
          evidenceRefs: getStringArray(
            patch.evidenceRefs ?? patch.evidence_refs ?? parsed.evidenceRefs ??
              parsed.evidence_refs,
          ),
          message: getString(parsed, "message") ?? getString(body, "answer") ??
            undefined,
          riskNotes: getStringArray(
            patch.riskNotes ?? patch.risk_notes ?? parsed.riskNotes ??
              parsed.risk_notes,
          ),
          title: getString(patch, "title") ?? getString(parsed, "title") ??
            undefined,
          workflowRunId: getString(parsed, "workflow_run_id") ??
            getString(patch, "workflow_run_id"),
        };
      }
    }
  }

  throw new DifyResumeChatError(
    "Dify chat output is missing ResumePatch changes.",
    502,
    "chat_output",
    { body },
  );
}

function buildPatchFromOutput({
  document,
  output,
  prompt,
}: {
  document: ResumeDocument;
  output: ResumeChatOutput;
  prompt: string;
}): ResumePatch {
  const modulesById = new Map(
    document.modules.map((module) => [module.id, module]),
  );
  const changes = output.changes.map((change) => {
    const current = modulesById.get(change.moduleId);

    if (!current) {
      throw new DifyResumeChatError(
        "Dify patch points to a missing resume module.",
        502,
        "chat_output",
        { moduleId: change.moduleId },
      );
    }

    const data = coerceModuleRichText(mergeResumeModule(current, change.data));
    assertCompleteModule(data, change.moduleId);

    if (data.id !== change.moduleId || data.kind !== current.kind) {
      throw new DifyResumeChatError(
        "Dify patch module id or kind does not match the original module.",
        502,
        "chat_output",
        {
          currentKind: current.kind,
          moduleId: change.moduleId,
          proposedId: data.id,
          proposedKind: data.kind,
        },
      );
    }

    return { data, moduleId: change.moduleId };
  });

  return {
    changes,
    createdAt: new Date().toISOString(),
    description: output.description ??
      `根据“${prompt}”生成 AI 修改建议，只修改模块内容，不修改简历名称。`,
    evidenceRefs: output.evidenceRefs && output.evidenceRefs.length > 0
      ? output.evidenceRefs
      : ["当前简历正文中的原始模块内容", "用户本次输入的修改要求"],
    id: createId("resume-patch"),
    original: changes.map((change) => ({
      data: structuredClone(modulesById.get(change.moduleId)!),
      moduleId: change.moduleId,
    })),
    riskNotes: output.riskNotes && output.riskNotes.length > 0
      ? output.riskNotes
      : ["采纳前建议人工确认表达没有超出真实经历边界。"],
    status: "pending",
    title: output.title ?? "AI 修改建议",
  };
}

function extractChanges(value: Record<string, unknown>) {
  const rawChanges = value.changes ?? value.modules ?? value.nextModules;

  if (!Array.isArray(rawChanges)) {
    return [];
  }

  return rawChanges.map((item, index) => {
    if (!isRecord(item)) {
      throw new DifyResumeChatError(
        "Dify patch change must be an object.",
        502,
        "chat_output",
        { index, item },
      );
    }

    const moduleId = getString(item, "moduleId") ??
      getString(item, "module_id");
    const data = item.data ?? item.module;

    if (!moduleId) {
      throw new DifyResumeChatError(
        "Dify patch change is missing moduleId.",
        502,
        "chat_output",
        { index, item },
      );
    }

    if (!isRecord(data)) {
      throw new DifyResumeChatError(
        "Dify patch module data is incomplete.",
        502,
        "chat_output",
        {
          index,
          moduleId,
          reason: "data must be an object",
          receivedData: data,
        },
      );
    }

    return { data, moduleId };
  });
}

function getResumeModuleValidationError(value: unknown) {
  if (!isRecord(value)) {
    return "data must be an object";
  }

  if (typeof value.id !== "string" || value.id.trim().length === 0) {
    return "data.id is required";
  }

  if (typeof value.kind !== "string" || value.kind.trim().length === 0) {
    return "data.kind is required";
  }

  if (typeof value.visible !== "boolean") {
    return "data.visible must be boolean";
  }

  switch (value.kind) {
    case "personal":
      return isRecord(value.personal)
        ? null
        : "personal module requires personal object";
    case "preferences":
      return isRecord(value.preferences)
        ? null
        : "preferences module requires preferences object";
    case "education":
    case "work":
    case "projects":
      return Array.isArray(value.items)
        ? null
        : `${value.kind} module requires items array`;
    case "skills":
      return Array.isArray(value.skills) &&
          value.skills.every((skill) => typeof skill === "string")
        ? null
        : "skills module requires skills string array";
    case "custom":
      return isRecord(value.module)
        ? null
        : "custom module requires module object";
    default:
      return `unsupported module kind: ${value.kind}`;
  }
}

function assertCompleteModule(data: ResumeModule, moduleId: string) {
  const moduleError = getResumeModuleValidationError(data);

  if (moduleError) {
    throw new DifyResumeChatError(
      "Dify patch module data is incomplete.",
      502,
      "chat_output",
      {
        moduleId,
        reason: moduleError,
        receivedData: data,
      },
    );
  }
}

function mergeResumeModule(
  current: ResumeModule,
  proposed: Record<string, unknown>,
): ResumeModule {
  const base = {
    ...current,
    ...proposed,
    id: current.id,
    kind: current.kind,
    visible: typeof proposed.visible === "boolean"
      ? proposed.visible
      : current.visible,
  };

  switch (current.kind) {
    case "personal":
      return {
        ...base,
        kind: "personal",
        personal: {
          ...current.personal,
          ...(isRecord(proposed.personal) ? proposed.personal : {}),
        },
      };
    case "preferences":
      return {
        ...base,
        kind: "preferences",
        preferences: {
          ...current.preferences,
          ...(isRecord(proposed.preferences) ? proposed.preferences : {}),
        },
      };
    case "skills":
      return {
        ...base,
        kind: "skills",
        skills: Array.isArray(proposed.skills)
          ? proposed.skills.filter((skill) => typeof skill === "string")
          : current.skills,
      };
    case "work":
      return {
        ...base,
        kind: "work",
        items: Array.isArray(proposed.items) ? proposed.items : current.items,
      };
    case "projects":
      return {
        ...base,
        kind: "projects",
        items: Array.isArray(proposed.items) ? proposed.items : current.items,
      };
    case "education":
      return {
        ...base,
        kind: "education",
        items: Array.isArray(proposed.items) ? proposed.items : current.items,
      };
    case "custom":
      return {
        ...base,
        kind: "custom",
        module: {
          ...current.module,
          ...(isRecord(proposed.module) ? proposed.module : {}),
        },
      };
    default:
      return current;
  }
}

function coerceModuleRichText(module: ResumeModule): ResumeModule {
  switch (module.kind) {
    case "education":
      return {
        ...module,
        items: module.items.map((item) => ({
          ...item,
          description: coerceRichText(item.description),
        })),
      };
    case "work":
      return {
        ...module,
        items: module.items.map((item) => ({
          ...item,
          description: coerceRichText(item.description),
        })),
      };
    case "projects":
      return {
        ...module,
        items: module.items.map((item) => ({
          ...item,
          description: coerceRichText(item.description),
        })),
      };
    case "custom":
      return {
        ...module,
        module: {
          ...module.module,
          content: coerceRichText(module.module.content),
        },
      };
    default:
      return module;
  }
}

function getOutputCandidates(value: unknown): unknown[] {
  if (!isRecord(value)) {
    return [value];
  }

  return [
    value,
    value.patch,
    value.result,
    value.output,
    value.text,
    value.answer,
  ];
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(withoutFence);
  } catch {
    return value;
  }
}

function isNoPatchDifyRunFailure(body: unknown) {
  if (!isRecord(body)) {
    return false;
  }

  return body.code === "invalid_param" &&
    typeof body.message === "string" &&
    body.message.includes("No valid module changes generated");
}

function getSelectedModule(
  document: ResumeDocument,
  selectedModuleId?: string | null,
) {
  return selectedModuleId
    ? document.modules.find((module) => module.id === selectedModuleId) ?? null
    : null;
}

function getString(value: unknown, key: string) {
  return isRecord(value) && typeof value[key] === "string" &&
      value[key].trim().length > 0
    ? value[key].trim()
    : null;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
    : undefined;
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getEnv(name: string, fallback: string) {
  return Deno.env.get(name)?.trim() || fallback;
}

async function readResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type { DifyResumeChatResult };
export { DifyResumeChatError, runResumeChatWithDify };
