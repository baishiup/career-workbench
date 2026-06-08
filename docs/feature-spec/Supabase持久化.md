# Supabase 持久化

## 目标

Supabase 是 MVP 的云端持久化能力。第一阶段先保存用户、profile、职位和简历正文/样式；AI run、对话、修改日志和导出记录后续再补。

Supabase 是产品侧事实来源。Dify 只保存 AI 编排过程中的外部运行状态，本项目必须把可展示、可审计、可恢复的业务结果写回 Supabase。

## 范围

包含：

- Supabase Auth。
- 数据表设计。
- 基础 RLS。
- 本地开发 fixture fallback。
- MVP 简历正文和样式持久化。

不包含：

- 复杂团队权限。
- 多租户企业后台。
- 支付系统。
- 第一阶段不保存上传文件、不建简历版本历史、不建简历级 AI 对话、patch 或修改日志表。

## 规划数据对象

- User。
- Profile。
- ProfileVersion。
- Resume。
- JobDescription。
- MatchReport。
- AiRun。
- AiRunEvent。
- ExternalAiRun。
- ExportRecord。

## 用户、Profile 与简历层级

当前基础层级：

- `auth.users`：Supabase Auth 用户，不直接承载业务资料。
- `public.users`：业务侧用户基础信息，保存邮箱、姓名、头像和 onboarding 状态。
- `public.profiles`：求职 Profile，保存 `ProfileDraft`，通过 `user_id` 关联 `public.users.id`。
- `public.resumes`：简历正文和样式，保存 `ResumeDocument` 和 `ResumeStyleConfig`，通过 `user_id` 关联 `public.users.id`。

`public.profiles` 和 `public.resumes` 是同级业务数据，不能把求职 profile 数据混在用户基础信息表里。

## MVP 简历表

第一阶段只建 `resumes` 一张简历表，不建 `resume_files`、`resume_versions`、`resume_patches`、`resume_change_logs` 或 `resume_conversations`。

当前判断：

- 上传文件只作为一次性解析输入，不在产品侧长期保存文件路径。
- 生成文件也不单独建表，导出流程后续再设计。
- 简历当前版本就是主数据，暂不做版本回滚。
- AI patch、修改日志和对话最后再补，不阻塞正文和样式持久化。

`resumes` 关键字段：

- `id`。
- `user_id`：关联 `public.users.id`，RLS 使用 `auth.uid() = user_id`。
- `title`。
- `source_type`：`manual_created`、`manual_upload`、`ai_generated`、`target_job`。
- `status`：`draft`、`ready`、`archived`、`parse_failed`、`generation_failed`。
- `document_json`：保存 `ResumeDocument`。
- `style_json`：保存 `ResumeStyleConfig`。
- `ai_parsed_draft_json`：可选保存 `AIParsedResumeDraft`，只用于解析排错和用户确认，不是主数据。
- `source_context_json`：可选保存来源上下文，例如上传、目标职位或生成上下文。
- `created_at`。
- `updated_at`。

简历主数据只有 `document_json` 和 `style_json`。Dify 或其他 AI parser 的输出必须先转换成这两份结构后再进入主要编辑流。

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

后续关系要求：

- `AiRun` 是本项目统一 AI run 记录，`ExternalAiRun` 是第三方编排引用。
- `ResumeConversation` 和 `ResumeChangeLog` 必须关联本项目 `AiRun`，不能只依赖 Dify conversation。
- Dify 输出的 profile draft、match report、resume patch 必须写入对应业务表或待采纳表。

以上 AI Trace 相关表不属于第一阶段 `resumes` 表实施范围。

## 本地开发 fixture 策略

mock 数据只用于本地开发和迁移期验证，不作为产品角色、公开入口或长期主流程。

要求：

- 没有 Supabase env 时只保证本地页面和组件可调试。
- UI 明确显示当前是 mock/local/supabase 中哪种模式。
- mock 数据不包含真实隐私信息。
- 没有 Dify env 时可用 mock orchestrator 验证事件协议；集成环境应提示配置缺失。

## 验收标准

- 登录后简历数据可持久化。
- 刷新页面后 profile、职位和简历可恢复。
- 简历能保存 `document_json` 和 `style_json`。
- target job 简历的职位、profile 或 AI 来源先记录在 `source_context_json`，不强依赖外键。
- 本地开发 fixture 不影响 Supabase 主路径。
- Dify、AI Trace、对话、patch、修改日志和导出记录后续补齐。
