# Career Workbench

Career Workbench 是一个面向开发者求职场景的 AI 简历/JD 匹配与定制简历工作台。

它不是招聘平台，也不是单纯的 AI API demo。项目目标是用一个真实求职工作流展示：Profile 事实库、JD 匹配、定制简历、AI 修改追踪、富文本编辑，以及可控的 AI Coding 工程过程。

## 当前状态

当前处于前端 mock/demo 阶段：

- 已有 `pnpm workspace + Vite React` 骨架。
- 已有工作台导航、Onboarding、Jobs、Profile、Resumes 的本地 mock 页面。
- 本地状态使用 Zustand + localStorage。
- 还没有真实 Supabase schema、Dify 调用、SSE endpoint 或编辑器实现。

## 本地启动

```bash
pnpm install
pnpm dev
```

默认进入工作台，不做营销页。当前主要依赖 mock 数据。

运行模式约定：

```bash
VITE_APP_MODE=mock
VITE_APP_MODE=local
VITE_APP_MODE=supabase
```

AI 编排模式约定：

```bash
AI_ORCHESTRATOR=mock
AI_ORCHESTRATOR=dify
AI_ORCHESTRATOR=openai-compatible
```

当前实现默认按 mock/demo 能力运行。

## 验证命令

```bash
pnpm check
pnpm test
pnpm build
```

`packages/*` 仍有部分脚手架占位命令，后续按 feature 补充真实测试。

## 演示路径

1. 打开应用，进入工作台。
2. 完成 onboarding，或跳过并进入 Jobs。
3. 查看 mock Profile 和本地简历列表。
4. 在 Jobs 列表筛选职位。
5. 进入职位详情，查看结构化 JD 和 mock 匹配分析。
6. 后续阶段再接入 target resume 生成、AI Trace 和编辑器。

## 文档入口

- [产品边界](./docs/product.md)
- [技术栈与架构边界](./docs/tech-stack.md)
- [代码组织规则](./docs/code-organization.md)
- [MVP 路线图](./docs/mvp-roadmap.md)
- [功能规格](./docs/feature-spec/)
- [AI Trace 全流程设计](./docs/feature-spec/AI-Trace全流程设计.md)
- [免费额度与边缘架构](./docs/edge-free-tier-architecture.md)
- [AI agent 协作规则](./AGENTS.md)

## 暂不做

完整产品边界见 `docs/product.md`。当前阶段明确不做：

- 真实用户数据和真实简历上传。
- 真实 Dify/Supabase 写入链路。
- 普通用户上传职位。
- 自动投递、职位爬取、Chrome 插件。
- 复杂模板市场。
