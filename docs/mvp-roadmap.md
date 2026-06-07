# MVP 路线图

本文只维护阶段计划和验收标准。产品边界见 `docs/product.md`，技术边界见 `docs/tech-stack.md`。

## 阶段 0：文档与治理

目标：锁定产品方向、目录归属、文档事实源和 AI Coding 协作边界。

交付物：

- `AGENTS.md`
- `README.md`
- `docs/product.md`
- `docs/tech-stack.md`
- `docs/code-organization.md`
- `docs/feature-spec/*.md`

验收：

- 文档边界清楚，不多处维护同一段长说明。
- 后续实现者能判断代码应该放在哪里。
- AI agent 能按一个 spec 或一个治理目标小步推进。

## 阶段 1：项目脚手架

目标：创建可运行的 Vite React 前端项目骨架，并保留后续接入 Supabase/Dify 的工程边界。

交付物：

- `pnpm workspace`。
- `apps/web`。
- TypeScript、Tailwind、lint/typecheck/build 命令。
- 工作台 shell 和基础导航。
- mock 数据和基础类型。

验收：

- `pnpm install` 可安装依赖。
- `pnpm dev` 可启动本地页面。
- `pnpm check`、`pnpm test`、`pnpm build` 有明确状态。
- 首页是工作台雏形，不是营销页。

## 阶段 2：静态工作流

目标：不接真实 AI 和数据库，先用本地状态跑通主流程。

交付物：

- Onboarding 静态流程。
- Profile mock 数据和编辑。
- Jobs 列表和职位详情。
- 匹配分析 mock 结果。
- Resumes 列表和来源字段。
- AI Run Trace mock 事件入口。

验收：

- 用户能从 onboarding 进入 Jobs。
- 用户能维护 Profile。
- 用户能筛选职位并进入详情。
- 简历列表能区分上传简历和生成简历。
- 所有交互先用本地状态完成。

## 阶段 3：AI 编排与统一事件

目标：打通 mock provider、Dify provider、OpenAI-compatible fallback 的统一事件边界。

交付物：

- `AI_ORCHESTRATOR=mock|dify|openai-compatible`。
- Dify Workflow / Chatflow client。
- mock provider。
- 统一事件 endpoint。
- AI run、外部运行引用、对话和 patch 的写入路径。

验收：

- 无 Dify key 和模型 key 时可用 mock provider。
- 有 Dify 配置时可调用真实 Workflow/Chatflow。
- Dify 无 streaming 时，也能展示步骤状态和最终结果。
- 失败时有可读错误状态。
- 简历 patch 能进入修改日志。

## 阶段 4：简历编辑器

目标：让生成结果可编辑、可对比、可预览。

交付物：

- TipTap / ProseMirror 编辑器。
- resume section 数据结构。
- Preview、AI Rewrite、Editor、Style 工作流。
- Compare to original。
- 简历级 AI 对话和修改日志展示。

验收：

- 用户能编辑生成的简历。
- 编辑内容能同步到预览。
- AI 建议在采纳前不直接覆盖简历版本。
- 修改日志能解释最终简历如何形成。

## 阶段 5：Supabase MVP 持久化

目标：把核心数据迁移到 Supabase，形成可部署 MVP。

交付物：

- Supabase Auth。
- profile、job、resume、AI run、external run、conversation、change log 表。
- Edge Functions 承接 Dify API 调用。
- mock/demo fallback。

验收：

- 用户登录后数据可持久化。
- 刷新后 profile、职位、简历和日志可恢复。
- AI run 能关联外部 workflow/chatflow ID。
- 无 Supabase 配置时仍可演示主流程。

## 阶段 6：Admin 职位导入

目标：把工作机会导入变成真实后台能力。

交付物：

- Admin 粘贴 JD 文本或职位链接。
- Admin 上传职位截图。
- JD 解析和结构化职位生成。
- 导入状态管理。

验收：

- 普通用户不能上传职位。
- Admin 能创建、编辑、停用职位。
- 外部来源失败时可降级为手动文本或截图导入。

## 阶段 7：GitHub 展示完善

目标：把项目整理成高质量作品集 repo。

交付物：

- 完整 README。
- 架构图和核心流程图。
- 截图或演示 GIF。
- sample 数据。
- 技术取舍说明。

验收：

- clone 后能用 mock provider 跑通主要流程。
- 面试时能解释全栈链路、AI 编排、编辑器和 Supabase 数据链路。
