# Career Workbench

**面向开发者的 AI 简历工作台:用「个人事实库 + 目标 JD」生成一份可追溯、不胡编的定制简历。**

[English](./README.md) · 中文

### 🔗 [在线体验](https://career-workbench.vercel.app) · [架构文档](./docs/architecture.md)

<img src="./docs/assets/job-match.png" alt="AI 职位匹配分析" width="860">

<img src="./docs/assets/resume-editor.png" alt="AI 简历助手与 Diff 审核" width="860">

<img src="./docs/assets/resume-ai.png" alt="结构化简历编辑器" width="860">

---

## 这是什么

按岗位反复改简历很枯燥,LLM 让它变快——但也会编造你没有的经历。Career Workbench 围绕
一个核心约束设计:**让 AI 有用,但不让它说谎。** 每一句生成内容都锚定在个人「事实库」上,
每一次匹配都给出证据,而不只是一个分数。

核心闭环:**上传简历 → 事实库 → 浏览职位 → AI 匹配(证据 / 缺口 / 风险)→ 生成定制简历 →
在编辑器里采纳/拒绝 AI 修改建议。**

## 🏗 架构一图流

```mermaid
flowchart LR
  UI["Web SPA<br/>React 19 · HeroUI v3"] -->|import| DM["@career-workbench/domain<br/>纯函数·有测试"]
  UI -->|"supabase-js · invoke()"| EF["Edge Functions (Deno)<br/>信任边界·密钥"]
  UI -->|"RLS 读取"| PG["Postgres<br/>按 auth.uid() RLS"]
  EF -->|"最小输入"| AI["Dify workflows<br/>解析·匹配·生成·对话"]
  EF -->|"结构化写入"| PG
```

浏览器从不直接调用 AI 服务。所有涉密或跨用户的操作都走 Edge Function。
**完整讲解 → [docs/architecture.md](./docs/architecture.md)。**

## 🧩 技术栈

**前端**

![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-SPA-646cff?logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white)
![HeroUI v3](https://img.shields.io/badge/HeroUI-v3-111827)
![Zustand](https://img.shields.io/badge/Zustand-state-443e38)
![assistant-ui](https://img.shields.io/badge/assistant--ui-chat-2563eb)
![Quill](https://img.shields.io/badge/Quill-editor-06c)

**后端 / AI**

![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)
![Edge Functions](https://img.shields.io/badge/Edge_Functions-Deno-000000?logo=deno&logoColor=white)
![Dify](https://img.shields.io/badge/Dify-workflows%20%2B%20chatflow-155EEF)
![Postgres](https://img.shields.io/badge/Postgres-RLS-4169e1?logo=postgresql&logoColor=white)

**工具链**

![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-f69220?logo=pnpm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tests-6e9f18?logo=vitest&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-format-f7b93e?logo=prettier&logoColor=black)
![Deno](https://img.shields.io/badge/Deno-toolchain-000000?logo=deno&logoColor=white)

## 🚀 快速开始

```bash
pnpm install
pnpm dev          # 仅前端 + 本地 fixture,无需任何密钥
```

`/` 是公开落地页。开箱即用的 fixture 模式(mock AI + 本地数据)让你无需配置 Supabase/Dify
即可浏览 UI。要跑完整链路(Supabase + Edge Functions + AI),见
**[development.md](./development.md)**。

```bash
pnpm check && pnpm test && pnpm build   # 验证
```

## 📚 文档

- [架构总览](./docs/architecture.md) —— 5 分钟工程视角导览
- [数据模型](./docs/architecture.md#data-model) · [后端架构](./docs/architecture.md#backend)
- [产品概览](./docs/product-overview.md) —— 做什么、刻意不做什么
- [本地开发与部署](./development.md)
- [功能规格(中文)](./feature-spec) —— 各功能深度设计

---

状态:MVP。核心闭环(上传 → Profile → 职位 → 匹配 → 生成 → 编辑)已端到端打通; AI Run Trace 与 PDF 导出进行中。
