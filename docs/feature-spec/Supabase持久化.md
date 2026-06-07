# Supabase 持久化

## 目标

Supabase 是 MVP 的云端持久化能力，用于保存用户、profile、职位、简历、AI run、对话、修改日志和导出记录。

Supabase 是产品侧事实来源。Dify 只保存 AI 编排过程中的外部运行状态，本项目必须把可展示、可审计、可恢复的业务结果写回 Supabase。

## 范围

包含：

- Supabase Auth。
- 数据表设计。
- 基础 RLS。
- 本地 mock/demo fallback。
- 简历版本历史。

不包含：

- 复杂团队权限。
- 多租户企业后台。
- 支付系统。

## 核心数据对象

- User。
- Profile。
- ProfileVersion。
- Resume。
- ResumeVersion。
- ResumeConversation。
- ResumeChangeLog。
- JobDescription。
- MatchReport。
- AiRun。
- AiRunEvent。
- ExternalAiRun。
- ExportRecord。

## ExternalAiRun 字段

用于保存 Dify 或其他外部 AI 编排服务的运行引用。

- `id`。
- `user_id`。
- `orchestrator`：`mock`、`dify`、`openai-compatible`。
- `workflow_key`：例如 `resume_parse`、`job_match`、`resume_generate`、`resume_chat`。
- `workflow_version`。
- `external_run_id`：Dify `workflow_run_id`。
- `external_conversation_id`：Dify Chatflow conversation id。
- `status`：`pending`、`running`、`succeeded`、`failed`、`cancelled`。
- `input_summary`：脱敏后的输入摘要。
- `output_summary`：脱敏后的输出摘要。
- `error_message`。
- `duration_ms`。
- `created_at`。
- `updated_at`。

关系要求：

- `AiRun` 是本项目统一 AI run 记录，`ExternalAiRun` 是第三方编排引用。
- `ResumeConversation` 和 `ResumeChangeLog` 必须关联本项目 `AiRun`，不能只依赖 Dify conversation。
- Dify 输出的 profile draft、match report、resume patch 必须写入对应业务表或待采纳表。

## Mock fallback 策略

为了 GitHub 展示，必须保留无 Supabase 配置时的 mock/demo 模式。

要求：

- 没有 Supabase env 时仍能跑通主流程。
- UI 明确显示当前是 mock 模式。
- mock 数据不包含真实隐私信息。
- 没有 Dify env 时使用 mock orchestrator，不影响主流程演示。

## 验收标准

- 登录后数据可持久化。
- 刷新页面后 profile、职位、简历和日志可恢复。
- target job 简历能关联 job、profile version 和 AI run。
- 无 Supabase 配置时仍可演示主要流程。
- Dify 外部运行 ID 能从 AI Trace 追溯，但删除或更换 Dify 服务不影响本项目核心业务数据读取。
