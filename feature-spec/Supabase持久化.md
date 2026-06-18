# Supabase 持久化

_状态:🟡 部分实现 —— 用户/Profile/职位/简历/匹配已落库;AI run、对话、修改日志、导出未建表_

## 目标

Supabase 是 MVP 的云端持久化能力,也是**产品侧事实源**。第一阶段先保存用户、profile、职位
和简历正文/样式;AI run、对话、修改日志和导出记录后续再补。Dify 只保存 AI 编排过程中的外部
运行状态;可展示、可审计、可恢复的业务结果必须写回 Supabase。

## 边界

包含:Supabase Auth、数据表设计、基础 RLS、本地开发 fixture fallback、MVP 简历正文和样式
持久化。

不包含:复杂团队权限、多租户企业后台、支付系统。第一阶段不保存上传文件,不建简历版本历史、
简历级 AI 对话、patch 或修改日志表。

## 用户可见行为

- 登录后简历数据持久化;刷新页面后 profile、职位和简历可恢复。
- 没有 Supabase env 时只保证本地页面和组件可调试;UI 明确显示当前是 mock/local/supabase
  哪种模式。

## 数据与状态边界

规划数据对象:User、Profile、ProfileVersion、Resume、JobDescription、MatchReport、AiRun、
AiRunEvent、ExportRecord。

### 用户、Profile 与简历层级

- `auth.users`:Supabase Auth 用户,不直接承载业务资料。
- `public.users`:业务侧用户基础信息(邮箱、姓名、头像、onboarding 状态)。
- `public.profiles`:求职 Profile,保存 `ProfileDraft`,`user_id` 关联 `public.users.id`。
- `public.resumes`:简历正文和样式,保存 `ResumeDocument` 和 `ResumeStyleConfig`。

### `resumes` 表(MVP 只建这一张简历表)

第一阶段不建 `resume_files`、`resume_versions`、`resume_patches`、`resume_change_logs`、
`resume_conversations`。判断:上传文件只作一次性解析输入、不长期保存路径;生成文件不单独
建表,导出后续设计;简历当前版本即主数据,暂不做版本回滚;AI patch/日志/对话最后补,不阻塞
正文与样式持久化。

关键字段:`id`、`user_id`(RLS `auth.uid() = user_id`)、`title`、`source_type`
(`manual_created`/`manual_upload`/`ai_generated`/`target_job`)、`document_json`
(`ResumeDocument`)、`style_json`(`ResumeStyleConfig`)、`ai_parsed_draft_json`(可选,只用于
解析排错和用户确认,非主数据)、`source_context_json`(可选来源上下文)、`created_at`、
`updated_at`。简历主数据只有 `document_json` 和 `style_json`;AI parser 输出必须先转成这两份
结构再进入主编辑流。

### `match_reports` 表

职位详情页按需生成的 AI 叙事分析,属职位匹配阶段实施。关键字段:`id`、`user_id`、`job_id`、
`status`(`pending`/`succeeded`/`failed`)、`report_json`(evidence/gaps/risks/aiNote,含
AI 给的 `matchScore`)、`profile_snapshot_at`、`job_snapshot_at`、`external_run_id`(可空,
记录 Dify `workflow_run_id`,仅排错,不建外键)、`error_message`、`created_at`、`updated_at`。
约束 `unique (user_id, job_id)`,重新分析时 upsert 覆盖,不留历史。匹配机制见
[工作机会](./工作机会.md)。

### 外部 AI 运行引用

MVP 不建 `ExternalAiRun` 表;需追溯 Dify 运行时,业务表以字符串记录外部 run id(如
`match_reports.external_run_id`),排错时回 Dify 后台查日志。后续:`AiRun` 是本项目统一 AI
run 记录;`ResumeConversation` 和 `ResumeChangeLog` 必须关联本项目 `AiRun`,不能只依赖 Dify
conversation;Dify 输出的 profile draft、match report、resume patch 必须写入对应业务表或待
采纳表。以上 AI Trace 相关表不属第一阶段范围(见 [AI-Trace全流程设计](./AI-Trace全流程设计.md))。

## 失败与降级

本地开发 fixture 策略:mock 数据只用于本地开发和迁移期验证,不作为产品角色、公开入口或长期
主流程。

- 没有 Supabase env 时只保证本地页面和组件可调试。
- mock 数据不含真实隐私信息。
- 没有 Dify env 时可用 mock orchestrator 验证事件协议;集成环境应提示配置缺失。

## 验收

- 登录后简历数据可持久化;刷新后 profile、职位和简历可恢复。
- 简历能保存 `document_json` 和 `style_json`。
- target job 简历的职位/profile/AI 来源先记录在 `source_context_json`,不强依赖外键。
- AI 叙事分析写入 `match_reports`,并能按 profile/职位快照时间判断是否过期。
- 本地开发 fixture 不影响 Supabase 主路径。
- Dify、AI Trace、对话、patch、修改日志和导出记录后续补齐。

## 相关

- [工作机会](./工作机会.md) · [简历编辑器](./简历编辑器.md) · [简历列表](./简历列表.md) ·
  [AI-Trace全流程设计](./AI-Trace全流程设计.md)
- 数据表与 RLS 全貌见 [data-model.md](../docs/architecture.md#data-model)。
