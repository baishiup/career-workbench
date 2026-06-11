import type {
  ResumeChangeLog,
  ResumePatch,
  ResumePatchStatus,
} from "@career-workbench/domain";

import type {
  AiChatMessage,
  AiRunEventDemo,
  MockResumeChatResult,
  MockResumeChatRun,
} from "@/components/ai-chat/types";

const initialAiChatMessages: AiChatMessage[] = [
  {
    content:
      "我可以基于当前目标岗位和简历 section 给出修改建议。这个页面只跑 mock provider，用来调试对话、patch、修改日志和 Trace。",
    createdAt: "2026-06-09T09:00:00.000Z",
    id: "msg-assistant-intro",
    role: "assistant",
    status: "completed",
  },
];

const quickPrompts = [
  "把 Summary 改得更贴近 Senior Frontend Engineer JD",
  "把项目经历里的 AI 工作台表达得更像工程成果",
  "补一版英文远程协作和异步沟通表达",
];

function createSuccessfulResumeChatRun(input: string): MockResumeChatResult {
  const startedAt = new Date();
  const completedAt = addMilliseconds(startedAt, 720);
  const runId = buildId("mock-resume-chat");
  const patchId = buildId("patch");
  const userMessageId = buildId("msg-user");
  const assistantMessageId = buildId("msg-assistant");
  const createdAt = startedAt.toISOString();
  const completedAtValue = completedAt.toISOString();
  const patch = createResumePatch({
    aiRunId: runId,
    conversationId: "mock-conv-resume-chat-001",
    createdAt: completedAtValue,
    id: patchId,
    status: "pending",
  });

  return {
    assistantMessage: {
      aiRunId: runId,
      content: [
        "建议把 Summary 从泛泛描述改成更贴近 JD 的工程证据：",
        "",
        "- 先点明 `React + TypeScript` 的复杂产品经验。",
        "- 加入 AI 工作台、组件系统、调试闭环这些关键词。",
        "- 避免夸大 checkout / payment 经验，只写可迁移能力。",
        "",
        "我已经生成一条待审阅 patch，可以先在右侧检查证据和风险，再决定采纳或拒绝。",
      ].join("\n"),
      createdAt: completedAtValue,
      id: assistantMessageId,
      patchId,
      role: "assistant",
      status: "completed",
    },
    changeLog: {
      actor: "ai",
      afterSummary: "AI 生成了 Summary section 的改写建议，等待用户审阅。",
      aiRunId: runId,
      changeType: "ai_suggested_patch",
      createdAt: completedAtValue,
      id: buildId("log-ai-suggested"),
      resumePatchId: patchId,
      resumeVersionId: "resume-version-demo-thrivecart",
      resumeId: "resume-demo-thrivecart",
      sectionId: "summary",
      sourceRefs: patch.evidenceRefs,
    },
    patch,
    run: {
      completedAt: completedAtValue,
      events: createSuccessfulEvents({
        createdAt,
        input,
        patchId,
        runId,
      }),
      externalRef: {
        conversationId: "mock-conv-resume-chat-001",
        messageId: "mock-message-resume-chat-008",
        workflowRunId: "mock-workflow-run-resume-chat-008",
      },
      inputSummary: `用户要求: ${input}`,
      orchestrator: "mock",
      promptVersion: "resume-chat-demo.v1",
      provider: "mock",
      resultSummary: "生成 Summary section 的待审阅 ResumePatch。",
      runId,
      startedAt: createdAt,
      status: "completed",
      taskType: "resume_chat",
      workflowKey: "resume.suggestion.review.v1",
    },
    userMessage: {
      aiRunId: runId,
      content: input,
      createdAt,
      id: userMessageId,
      role: "user",
      status: "completed",
    },
  };
}

function createFailedResumeChatRun(input: string): MockResumeChatResult {
  const startedAt = new Date();
  const completedAt = addMilliseconds(startedAt, 430);
  const runId = buildId("mock-resume-chat-failed");
  const createdAt = startedAt.toISOString();
  const completedAtValue = completedAt.toISOString();
  const errorSummary = "mock provider 模拟 Dify Chatflow 超时，未产生 patch。";

  return {
    assistantMessage: {
      aiRunId: runId,
      content:
        "这次 mock 调用失败了，但用户输入已经保留。Trace 面板里可以看到 `run.failed` 和错误摘要；真实接入后这里应提供重试或切换手动编辑。",
      createdAt: completedAtValue,
      id: buildId("msg-assistant-failed"),
      role: "assistant",
      status: "failed",
    },
    run: {
      completedAt: completedAtValue,
      errorSummary,
      events: createFailedEvents({
        createdAt,
        errorSummary,
        input,
        runId,
      }),
      externalRef: {
        conversationId: "mock-conv-resume-chat-001",
        workflowRunId: "mock-workflow-run-timeout-001",
      },
      inputSummary: `用户要求: ${input}`,
      orchestrator: "mock",
      promptVersion: "resume-chat-demo.v1",
      provider: "mock",
      runId,
      startedAt: createdAt,
      status: "failed",
      taskType: "resume_chat",
      workflowKey: "resume.suggestion.review.v1",
    },
    userMessage: {
      aiRunId: runId,
      content: input,
      createdAt,
      id: buildId("msg-user-failed"),
      role: "user",
      status: "completed",
    },
  };
}

function createPatchDecisionLog({
  patch,
  status,
}: {
  patch: ResumePatch;
  status: Extract<ResumePatchStatus, "accepted" | "rejected">;
}): ResumeChangeLog {
  const isAccepted = status === "accepted";

  return {
    actor: "user",
    afterSummary: isAccepted
      ? "用户采纳了 Summary section 的 AI 改写建议。"
      : "用户拒绝了 Summary section 的 AI 改写建议。",
    aiRunId: patch.aiRunId,
    beforeSummary: patch.summary,
    changeType: isAccepted ? "user_accepted_patch" : "user_rejected_patch",
    createdAt: new Date().toISOString(),
    id: buildId(isAccepted ? "log-accepted" : "log-rejected"),
    resumePatchId: patch.id,
    resumeVersionId: patch.resumeVersionId,
    resumeId: patch.resumeId,
    sectionId: "summary",
    sourceRefs: patch.evidenceRefs,
  };
}

function createResumePatch({
  aiRunId,
  conversationId,
  createdAt,
  id,
  status,
}: {
  aiRunId: string;
  conversationId: string;
  createdAt: string;
  id: string;
  status: ResumePatchStatus;
}): ResumePatch {
  return {
    aiRunId,
    changes: [
      {
        beforeText:
          "多年全栈开发经验，熟悉前端工程化和 AI 工具开发，能快速交付复杂业务。",
        nextText:
          "Senior Frontend / Full-stack developer with deep React and TypeScript experience, focused on AI workbench, design-system-driven product surfaces, and traceable delivery workflows for complex SaaS teams.",
        operation: "replace_text",
        target: {
          blockId: "summary-block-001",
          fieldPath: "sections.summary.blocks[0].text",
          sectionId: "summary",
        },
      },
    ],
    confidence: 0.82,
    conversationId,
    createdAt,
    evidenceRefs: [
      {
        fieldPath: "profile.skills",
        label: "React / TypeScript / AI tools",
        sourceId: "profile-demo-current",
        sourceType: "profile",
      },
      {
        fieldPath: "job.requiredSkills",
        label: "Senior Frontend Engineer JD",
        sourceId: "job-thrivecart",
        sourceType: "job_description",
      },
    ],
    id,
    resumeId: "resume-demo-thrivecart",
    resumeVersionId: "resume-version-demo-thrivecart",
    riskNotes: [
      "不要写成已有 checkout / payment funnel 直接经验。",
      "英文 Summary 需要后续和整份简历语言保持一致。",
    ],
    status,
    summary: "将 Summary 改写为面向 Senior Frontend Engineer JD 的英文版本。",
  };
}

function createSuccessfulEvents({
  createdAt,
  input,
  patchId,
  runId,
}: {
  createdAt: string;
  input: string;
  patchId: string;
  runId: string;
}): AiRunEventDemo[] {
  return [
    event(
      runId,
      1,
      "run.started",
      "开始 AI 修改建议",
      `用户输入: ${input}`,
      createdAt,
    ),
    event(
      runId,
      2,
      "step.started",
      "读取业务上下文",
      "收集当前 resume section、profile evidence 和目标 JD 摘要。",
      createdAt,
      { stepKey: "context.collect" },
    ),
    event(
      runId,
      3,
      "step.delta",
      "生成候选表达",
      "mock provider 生成 Summary 改写思路。",
      createdAt,
      { stepKey: "provider.generate" },
    ),
    event(
      runId,
      4,
      "artifact.patch",
      "产生待审阅 patch",
      "ResumePatch 已创建，等待用户采纳或拒绝。",
      createdAt,
      { payload: { resumePatchId: patchId }, stepKey: "artifact.patch" },
    ),
    event(
      runId,
      5,
      "step.completed",
      "AI 回复完成",
      "自然语言回复和结构化 patch 已返回前端。",
      createdAt,
      { stepKey: "provider.generate" },
    ),
    event(
      runId,
      6,
      "run.completed",
      "AI run 完成",
      "mock resume_chat run completed。",
      createdAt,
    ),
  ];
}

function createFailedEvents({
  createdAt,
  errorSummary,
  input,
  runId,
}: {
  createdAt: string;
  errorSummary: string;
  input: string;
  runId: string;
}): AiRunEventDemo[] {
  return [
    event(
      runId,
      1,
      "run.started",
      "开始 AI 修改建议",
      `用户输入: ${input}`,
      createdAt,
    ),
    event(
      runId,
      2,
      "step.started",
      "调用 mock provider",
      "模拟 Dify Chatflow 调用阶段。",
      createdAt,
      { stepKey: "provider.call" },
    ),
    event(runId, 3, "run.failed", "AI run 失败", errorSummary, createdAt, {
      payload: { errorCode: "MOCK_PROVIDER_TIMEOUT" },
      stepKey: "provider.call",
    }),
  ];
}

function event(
  runId: string,
  sequence: number,
  eventType: AiRunEventDemo["eventType"],
  title: string,
  summary: string,
  createdAt: string,
  options?: { payload?: Record<string, unknown>; stepKey?: string },
): AiRunEventDemo {
  return {
    createdAt: addMilliseconds(
      new Date(createdAt),
      sequence * 90,
    ).toISOString(),
    eventId: `${runId}-event-${sequence}`,
    eventType,
    payload: options?.payload,
    runId,
    sequence,
    stepKey: options?.stepKey,
    summary,
    title,
  };
}

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}

function buildId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export {
  createFailedResumeChatRun,
  createPatchDecisionLog,
  createSuccessfulResumeChatRun,
  initialAiChatMessages,
  quickPrompts,
};
