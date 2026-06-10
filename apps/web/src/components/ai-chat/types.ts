import type { ResumeChangeLog, ResumePatch } from "@career-workbench/domain";

type AiChatMessageRole = "assistant" | "system" | "user";

type AiChatMessageStatus = "completed" | "failed" | "streaming";

type AiChatMessage = {
  aiRunId?: string;
  content: string;
  createdAt: string;
  id: string;
  patchId?: string;
  role: AiChatMessageRole;
  status?: AiChatMessageStatus;
};

type AiRunStatus = "completed" | "failed" | "running";

type AiRunEventType =
  | "artifact.patch"
  | "run.completed"
  | "run.failed"
  | "run.started"
  | "step.completed"
  | "step.delta"
  | "step.started";

type AiRunEventDemo = {
  createdAt: string;
  eventId: string;
  eventType: AiRunEventType;
  payload?: Record<string, unknown>;
  runId: string;
  sequence: number;
  stepKey?: string;
  summary: string;
  title: string;
};

type MockExternalAiRef = {
  conversationId?: string;
  messageId?: string;
  workflowRunId?: string;
};

type MockResumeChatRun = {
  completedAt?: string;
  errorSummary?: string;
  events: AiRunEventDemo[];
  externalRef?: MockExternalAiRef;
  inputSummary: string;
  orchestrator: "mock";
  promptVersion: string;
  provider: "mock";
  resultSummary?: string;
  runId: string;
  startedAt: string;
  status: AiRunStatus;
  taskType: "resume_chat";
  workflowKey: "resume.suggestion.review.v1";
};

type MockResumeChatResult = {
  assistantMessage: AiChatMessage;
  changeLog?: ResumeChangeLog;
  patch?: ResumePatch;
  run: MockResumeChatRun;
  userMessage: AiChatMessage;
};

export type {
  AiChatMessage,
  AiChatMessageRole,
  AiChatMessageStatus,
  AiRunEventDemo,
  AiRunEventType,
  AiRunStatus,
  MockExternalAiRef,
  MockResumeChatResult,
  MockResumeChatRun,
};
