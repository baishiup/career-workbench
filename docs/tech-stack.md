# 技术栈与架构边界

## 文档边界

本文只维护技术选型、运行模式、前后端边界和验证策略。

- 产品范围见 `docs/product.md`。
- 目录归属见 `docs/project-structure.md`。
- AI Trace 事件和数据模型见 `docs/feature-spec/AI-Trace全流程设计.md`。

## 选型原则

- 优先 JavaScript/TypeScript。
- MVP 必须能本地开发、可验证、可部署。
- 技术点服务产品闭环，不做孤立 demo。
- mock/fixture 只服务本地开发和 provider 契约测试，不作为产品主路径。
- Supabase 是 MVP 持久化目标；Dify 是优先 AI 编排层；OpenAI-compatible adapter 是 fallback。

## 当前技术栈

- pnpm workspace。
- Vite + React SPA。
- React 19 + TypeScript strict。
- Tailwind CSS v4。
- HeroUI v3 组件体系。
- lucide-react 图标。
- Zustand 本地状态。
- Supabase Auth、Postgres、Edge Functions（Deno）。
- Dify Workflow（简历解析、job_parse、job_match、resume_generate，清单见 `dify/README.md`）。
- `streamdown` 与 `@streamdown/*` 当前是预留依赖，源码尚未接入。

计划引入但当前未实现：

- Dify Chatflow（简历级 AI 对话）。
- Supabase Storage（当前上传文件只作为一次性解析输入，不落盘）。
- TipTap / ProseMirror 简历编辑器（当前为 HeroUI 表单编辑器 + DOM 预览）。

Streamdown 预留用途：

- 后续用于 AI streaming response 的 Markdown 渲染。
- 使用场景包括 AI 对话、AI Rewrite、Trace 输出、代码块、Mermaid、公式和 CJK 文本。
- UI 框架迁移或清理依赖时，不把 `streamdown` 归类为 HeroUI、Antd、Base UI 或 shadcn 的替代对象，也不要随 UI 框架清理误删。

## 目标结构

```txt
apps/web
  Vite React SPA
  React UI
  local dev fixture workflow

packages/ai
  Dify client
  mock provider
  OpenAI-compatible adapter
  prompt/workflow registry
  unified AI event contract

packages/domain
  profile/resume/JD domain model
  match scoring
  resume patch/change-log contracts

packages/db
  Supabase client and repositories

packages/shared
  shared schemas and utilities
```

当前 `packages/domain` 已承载真实领域模型（resume/profile/job 类型、规则匹配分、normalize 函数）并有单元测试；`packages/ai`、`packages/db`、`packages/shared` 仍是占位。只有稳定跨边界代码才应放入。

## 运行模式

当前实现：运行模式由 Supabase env 是否存在决定。

- 无 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` 时只保证本地开发 fixture 可用。
- 配置完整后业务页面走 Supabase session 和持久化主路径。
- AI 编排固定走 Dify：每个 workflow 一个独立 API Key，由对应 Edge Function 读取（见 `dify/README.md`）；缺 key 时 Edge Function 返回 `config` 阶段错误。

规划中的显式模式开关（`VITE_APP_MODE=mock|local|supabase`、`AI_ORCHESTRATOR=mock|dify|openai-compatible`）当前代码尚未读取，等 mock provider 契约测试落地时再接：

- 无 Dify 或模型 key 时可用 mock provider 做契约测试；集成环境应明确提示配置缺失。
- UI 要能显示当前是 mock/local/supabase 中哪种模式。

## 前端边界

- 页面只访问本项目 API、mock 数据或 Supabase client。
- 组件不直接调用 Dify 或模型 API。
- prompt 不写散在 UI 组件里。
- 业务组件放在 `src/pages/*` 或 `src/components/*`；HeroUI 基础组件优先从 `@heroui/react` 直接导入。
- 跨页面的工作台外壳和少量共享样式 helper 放在 `src/components/workbench`。
- Vite 路由装配层只做页面组合，具体规则见 `docs/project-structure.md`。

## 后端与 API 边界

第一阶段不创建独立 `apps/api`。

当前 `apps/web` 是 Vite 静态前端，不承载服务端 API 路由。轻量本地开发能力先放在前端 mock/provider 层：

- 本地 mock AI run。
- 开发 trace fixture 回放。
- 非敏感 fixture 读取。

需要保密 key、高权限写入或持久化事务时，优先放到 Supabase Edge Functions：

- 接收上传文件并受控中转给 AI provider。
- 调用 Dify Workflow / Chatflow。
- 写入 AI run、event、外部运行引用、业务结果。

## Dify 边界

Dify 是 AI 编排层，不是业务主库。

- 前端不直接调用 Dify。
- Edge Functions 读取最小必要输入后调用 Dify。
- 每个 Dify workflow 对应独立 App 和 API Key，命名见 `supabase/.env.example` 与 `dify/README.md`（如 `DIFY_RESUME_PARSE_API_KEY`、`DIFY_JOB_PARSE_API_KEY`）。
- Dify 输出必须转成结构化业务结果或待采纳 patch。
- Dify 的 `workflow_run_id`、`conversation_id`、`message_id` 只保存为外部引用。
- Dify 不能直接修改 `ResumeVersion`。

## 数据层

MVP 数据层分两步：

1. 本地开发期：mock/fixture 数据 + Zustand localStorage。
2. 完整 MVP：Supabase 保存用户、Profile、职位、简历、AI run、对话、修改日志和导出记录。

当前进度：用户、Profile、职位、匹配报告、简历正文/样式已落 Supabase（`users` / `profiles` / `job_descriptions` / `match_reports` / `resumes`）；AI run、对话、修改日志和导出记录未建表。表结构事实源见 `docs/feature-spec/Supabase持久化.md`。

关键枚举约定：

- Resume source：`manual_created`、`manual_upload`、`ai_generated`、`target_job`。
- Job import method：`manual_form`、`manual_text`、`screenshot`（链接不自动抓取，`source_url` 仅作元数据手动填写）。
- Change actor：`user`、`ai`、`system`。
- AI orchestrator：`mock`、`dify`、`openai_compatible`。
- AI run status：`created`、`running`、`waiting_external`、`completed`、`failed`、`cancelled`。

## 测试策略

当前阶段至少运行：

```bash
pnpm check
pnpm test
pnpm build
```

已有：`packages/domain` 的规则匹配分与匹配报告过期判断单元测试（vitest）。

后续按风险补充：

- AI adapter mock 测试。
- JD parse 解析契约测试。
- resume patch schema 测试。
- Profile 表单和 Jobs 筛选交互测试。
