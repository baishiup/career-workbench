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
- ExportRecord。

## 用户、Profile 与简历层级

当前基础层级：

- `auth.users`：Supabase Auth 用户，不直接承载业务资料。
- `public.users`：业务侧用户基础信息，保存邮箱、姓名、头像和 onboarding 状态。
- `public.profiles`：求职 Profile，保存 `ProfileDraft`，通过 `user_id` 关联 `public.users.id`。
- `public.resumes`：简历正文和样式，保存 `ResumeDocument` 和 `ResumeStyleConfig`，通过 `user_id` 关联 `public.users.id`。

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
- `document_json`：保存 `ResumeDocument`。
- `style_json`：保存 `ResumeStyleConfig`。
- `ai_parsed_draft_json`：可选保存 `AIParsedResumeDraft`，只用于解析排错和用户确认，不是主数据。
- `source_context_json`：可选保存来源上下文，例如上传、目标职位或生成上下文。
- `created_at`。
- `updated_at`。

简历主数据只有 `document_json` 和 `style_json`。Dify 或其他 AI parser 的输出必须先转换成这两份结构后再进入主要编辑流。

## MatchReport 表

`match_reports` 保存职位详情页按需生成的 AI 叙事分析，属于职位匹配阶段实施，不在第一阶段 `resumes` 范围内。匹配分数由代码规则实时计算，不持久化；匹配机制见《工作机会》spec。

关键字段：

- `id`。
- `user_id`：关联 `public.users.id`，RLS 使用 `auth.uid() = user_id`。
- `job_id`：关联职位表；职位表建表是前置条件，字段清单见《工作机会》spec。
- `status`：`pending`、`succeeded`、`failed`。
- `report_json`：evidence、gaps、risks、aiNote 叙事，不含分数。
- `profile_snapshot_at`：生成时 `profiles.updated_at` 快照，用于过期判断。
- `job_snapshot_at`：生成时职位 `updated_at` 快照，用于过期判断。
- `external_run_id`：可空 text，记录 Dify `workflow_run_id`，仅排错用，不建外键。
- `error_message`。
- `created_at`。
- `updated_at`。

约束：`unique (user_id, job_id)`，重新分析时 upsert 覆盖，不保留分析历史。

## 外部 AI 运行引用

MVP 不建 `ExternalAiRun` 表。需要追溯 Dify 运行时，业务表以字符串记录外部 run id（例如 `match_reports.external_run_id`），排错时回 Dify 后台查日志。

后续关系要求：

- `AiRun` 是本项目统一 AI run 记录；完整 AI Trace 阶段再评估是否需要独立的外部运行引用表。
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
- AI 叙事分析写入 `match_reports`，并能按 profile / 职位快照时间判断是否过期。
- 本地开发 fixture 不影响 Supabase 主路径。
- Dify、AI Trace、对话、patch、修改日志和导出记录后续补齐。
