# AI 对话与修改日志

## 目标

每份简历都必须保存自己的 AI 对话和修改日志。日志不仅用于调试，也要成为用户可见的产品体验。

AI 对话与修改日志不是孤立功能，必须接入 [AI Trace 全流程设计](./AI-Trace全流程设计.md)。每条 AI 回复、patch、采纳、拒绝和手动编辑都要能追溯到对应的 `AiRun`，并能在 Trace 面板中看到输入摘要、Dify 外部 ID、事件过程和输出摘要。

## AI 对话

对话记录包括：

- 用户输入。
- AI 回复。
- 快捷 prompt。
- AI 生成的 patch。
- 用户是否采纳。
- 关联的 resume section。
- Dify `conversation_id`。
- Dify `workflow_run_id` 或 `message_id`。
- 关联的 `ai_run_id`。
- 关联的 pending `resume_patch_id`，如果该回复产生了结构化 patch。

## Dify Chatflow 边界

简历级对话优先通过 Dify Chatflow 实现，但产品侧必须保存完整业务语义。

调用流程：

1. 前端把用户输入、当前 resume section、可用 profile evidence 和目标 JD 上下文发送给本项目 API 或 Edge Function。
2. Edge Function 调用 Dify Chatflow。
3. Dify 返回自然语言回复和结构化 patch。
4. 系统把回复写入 `ResumeConversation`，把 patch 写入待采纳状态。
5. 用户采纳、拒绝或手动编辑后，再写入 `ResumeChangeLog`。

Trace 写入流程：

1. API 或 Edge Function 先创建 `AiRun(task_type=resume_chat)`。
2. 写入 `AiRunEvent(run.started)` 和必要的 step 事件。
3. 调用 Dify Chatflow 后，把 `conversation_id`、`message_id`、`workflow_run_id` 写入 `ExternalAiRun`。
4. Dify 返回 patch 时，写入 `AiRunEvent(artifact.patch)` 和 `ResumePatch(status=pending)`。
5. 任务完成或失败时，写入 `run.completed` 或 `run.failed`，并更新 `AiRun.status`。

要求：

- 前端不直接调用 Dify，也不保存 Dify key。
- Dify 只产生建议，不直接修改 `ResumeVersion`。
- patch 必须包含目标 section、原文摘要、新文本、来源证据、风险提示和置信度。
- Dify 出错时保留用户输入和错误摘要，允许用户重试或切换手动编辑。
- mock provider、Dify provider 和 OpenAI-compatible provider 必须输出同一套事件协议。

## 修改日志

日志事件类型：

- AI 生成初版。
- AI 修改建议。
- 用户接受建议。
- 用户拒绝建议。
- 用户手动编辑文本。
- 用户拖拽排序。
- 用户修改样式。
- 用户导出简历。

每条修改日志至少要能关联：

- `resume_id`。
- `resume_version_id`。
- `section_id`，如果变更作用于具体 section。
- `ai_run_id`，如果变更来自 AI 任务。
- `resume_patch_id`，如果变更来自 AI patch。
- `actor`：`user`、`ai` 或 `system`。
- 修改前摘要、修改后摘要和证据来源。

采纳 AI patch 时：

- 更新 `ResumePatch.status=accepted`。
- 修改 `ResumeVersion` 对应 section。
- 写入 `ResumeChangeLog(change_type=user_accepted_patch)`。

拒绝 AI patch 时：

- 更新 `ResumePatch.status=rejected`。
- 不修改 `ResumeVersion` 正文。
- 写入 `ResumeChangeLog(change_type=user_rejected_patch)`。

## 展示原则

- 在 AI 对话列表中穿插显示关键修改事件。
- 用户能从日志跳到对应简历区域。
- 日志记录原文、修改后文本、来源 profile 字段和触发者。
- 日志不能只存在于后台，必须成为用户可见的 AI 感来源。
- Dify 外部 ID 不需要暴露给普通用户，但必须能在 AI Trace 或调试视图中查看。
- 普通用户看到业务化时间线；开发调试模式能展开完整 `AiRun`、事件时间线和 Dify 外部引用。

## 失败状态

Dify 或 fallback provider 失败时：

- 保留用户输入，不让用户丢失刚才的修改要求。
- 写入 `AiRunEvent(run.failed)` 和可读错误摘要。
- 如果已经获得 Dify 外部 ID，需要写入 `ExternalAiRun`。
- 不创建已完成的 `ResumeChangeLog`。
- 如果已经产生未完成 patch，要标记为 `superseded` 或显示为风险状态，避免误采纳。
- UI 提供重试或切换手动编辑。

## 验收标准

- 每份 target job 简历都有独立对话和日志。
- AI patch、手动编辑、样式修改和导出都能形成日志。
- 日志能定位到具体 section。
- 用户能看到原文、改后内容和触发者。
- Dify Chatflow 回复和本地修改日志能通过同一个 resume version 关联起来。
- 每条 AI 对话、patch、采纳和拒绝都能反查对应 `AiRun`。
- Dify 失败时能在对话列表和 Trace 面板看到失败阶段、错误摘要和可重试状态。
