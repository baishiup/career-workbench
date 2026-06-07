# 技术栈与架构边界

## 文档边界

本文只维护技术选型、运行模式、前后端边界和验证策略。

- 产品范围见 `docs/product.md`。
- 目录归属见 `docs/code-organization.md`。
- 阶段计划见 `docs/mvp-roadmap.md`。
- AI Trace 事件和数据模型见 `docs/feature-spec/AI-Trace全流程设计.md`。

## 选型原则

- 优先 JavaScript/TypeScript。
- MVP 必须能本地开发、可演示、可部署。
- 技术点服务产品闭环，不做孤立 demo。
- 默认保留 mock/demo 模式，避免无密钥环境不可运行。
- Supabase 是 MVP 持久化目标；Dify 是优先 AI 编排层；OpenAI-compatible adapter 是 fallback。

## 当前技术栈

- pnpm workspace。
- Vite + React SPA。
- React 19 + TypeScript strict。
- Tailwind CSS v4。
- shadcn/ui 风格基础组件。
- lucide-react 图标。
- Zustand 本地状态。

计划引入但当前未实现：

- Dify Workflow / Chatflow。
- Supabase Auth、Postgres、Storage、Edge Functions。
- TipTap / ProseMirror 简历编辑器。

## 目标结构

```txt
apps/web
  Vite React SPA
  React UI
  local mock/demo workflow

packages/ai
  Dify client
  mock provider
  OpenAI-compatible adapter
  prompt/workflow registry
  unified AI event contract

packages/resume
  profile/resume/JD domain model
  match scoring
  resume patch/change-log contracts

packages/db
  Supabase client and repositories

packages/shared
  shared schemas and utilities
```

当前 `packages/*` 多数仍是占位，只有稳定跨边界代码才应放入。

## 运行模式

应用运行模式：

```bash
VITE_APP_MODE=mock
VITE_APP_MODE=local
VITE_APP_MODE=supabase
```

AI 编排模式：

```bash
AI_ORCHESTRATOR=mock
AI_ORCHESTRATOR=dify
AI_ORCHESTRATOR=openai-compatible
```

要求：

- 无 Supabase 配置时仍能跑 mock/demo。
- 无 Dify 或模型 key 时仍能跑 mock provider。
- UI 要能显示当前是 mock/local/supabase 中哪种模式。

## 前端边界

- 页面只访问本项目 API、mock 数据或 Supabase client。
- 组件不直接调用 Dify 或模型 API。
- prompt 不写散在 UI 组件里。
- 业务组件放在 `src/features/*`，基础组件放在 `src/components/ui`。
- Vite 路由装配层只做页面组合，具体规则见 `docs/code-organization.md`。

## 后端与 API 边界

第一阶段不创建独立 `apps/api`。

当前 `apps/web` 是 Vite 静态前端，不承载服务端 API 路由。轻量 demo 能力先放在前端 mock/provider 层：

- 本地 mock AI run。
- demo trace 回放。
- 非敏感 fixture 读取。

需要保密 key、高权限写入或持久化事务时，优先放到 Supabase Edge Functions：

- signed upload URL。
- 完成简历上传确认。
- 调用 Dify Workflow / Chatflow。
- 写入 AI run、event、外部运行引用、业务结果。

## Dify 边界

Dify 是 AI 编排层，不是业务主库。

- 前端不直接调用 Dify。
- Edge Functions 读取最小必要输入后调用 Dify。
- Dify 输出必须转成结构化业务结果或待采纳 patch。
- Dify 的 `workflow_run_id`、`conversation_id`、`message_id` 只保存为外部引用。
- Dify 不能直接修改 `ResumeVersion`。

## 数据层

MVP 数据层分两步：

1. 本地开发期：mock/fixture 数据 + Zustand localStorage。
2. 完整 MVP：Supabase 保存用户、Profile、职位、简历、AI run、对话、修改日志和导出记录。

关键枚举约定：

- Resume source：`manual_upload`、`target_job`。
- Job import method：`manual_text`、`job_url`、`screenshot`、`browser_extract`。
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

后续按风险补充：

- AI adapter mock 测试。
- JD parse / match scoring 单元测试。
- resume patch schema 测试。
- Profile 表单和 Jobs 筛选交互测试。
