# Career Workbench

Career Workbench 是一个面向开发者求职场景的 AI 简历/JD 匹配与定制简历工作台。

## 当前状态

当前处于 Supabase 和 Dify 接入阶段：

- 已有 `pnpm workspace + Vite React` 骨架。
- 已有工作台导航、Onboarding、Jobs、Profile、Resumes 的页面骨架和本地开发 fixture。
- 部分本地状态仍使用 Zustand + localStorage，后续按 feature 迁到 Supabase 持久化。
- 已有 Supabase Auth 浏览器端接入骨架、Google 登录页和 `profiles` RLS SQL 草案。
- 登录后会远端校验 Supabase Auth user，并用 `public.profiles.has_completed_onboarding` 决定是否展示 onboarding。
- Dify、Supabase 业务表、SSE endpoint 和编辑器属于当前后续接入重点。

## 本地启动

```bash
pnpm install
pnpm dev
```

默认进入工作台，不做营销页。产品主路径以 Supabase 登录和业务持久化为目标；mock/fixture 只用于本地开发阶段。

运行模式约定：

```bash
VITE_APP_MODE=mock
VITE_APP_MODE=local
VITE_APP_MODE=supabase
```

Supabase 登录配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

无 Supabase env 时只保留本地开发 fixture，方便调试 UI；配置完整后，业务页面会先检查 Supabase session，未登录会跳转 `/login`。

## Google 登录接入

1. Google Cloud Console：创建或选择项目，配置 OAuth consent screen，创建 Web application 类型的 OAuth 2.0 Client ID。
2. Google OAuth redirect URI 填 Supabase 回调地址，通常是 `https://<project-ref>.supabase.co/auth/v1/callback`。
3. Supabase Dashboard：Authentication -> Providers -> Google，填入 Google Client ID 和 Client Secret 并启用。
4. Supabase Dashboard：Authentication -> URL Configuration，本地 `Site URL` 可填 `http://localhost:5173`，Redirect URLs 加 `http://localhost:5173/**`；部署后加正式域名。
5. Supabase Dashboard SQL Editor：执行 `supabase/sql/profiles_auth_setup.sql`，创建或升级 `public.profiles` 和 RLS policy。
6. 本地创建或更新 `apps/web/.env.local`，填入 `VITE_APP_MODE=supabase`、`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。

登录状态由 Supabase session 管理，不在业务表维护 token 字段。`Authentication -> Users` 里的 `auth.users` 是认证系统用户；业务侧使用 `public.profiles` 做用户资料和 onboarding 状态，后续业务表用 `user_id` / `profiles.id` 关联用户，访问控制交给 RLS 的 `auth.uid()`。

页面初始化会调用 `supabase.auth.getUser()` 远端验证当前 token，并读取或创建当前用户自己的 `public.profiles` 行。`has_completed_onboarding=false` 时进入 `/onboarding`；用户完成或跳过 onboarding 后更新为 `true`，后续刷新直接进入 Jobs。

AI 编排模式约定：

```bash
AI_ORCHESTRATOR=mock
AI_ORCHESTRATOR=dify
AI_ORCHESTRATOR=openai-compatible
```

`mock` 只用于本地开发和 provider 契约验证；集成环境应优先使用 `dify`。

## 验证命令

```bash
pnpm check
pnpm test
pnpm build
```

`packages/*` 仍有部分脚手架占位命令，后续按 feature 补充真实测试。

## 本地验证路径

1. 打开应用，进入工作台。
2. 如果启用了 Supabase Auth，先通过 `/login` 使用 Google 登录。
3. 完成 onboarding，或跳过并进入 Jobs。
4. 查看 Profile 和本地开发 fixture 简历列表。
5. 在 Jobs 列表筛选职位。
6. 进入职位详情，查看结构化 JD 和当前匹配分析占位。
7. 后续阶段再接入 target resume 生成、AI Trace 和编辑器。

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

- 面试官/访客角色或公开 mock 入口。
- 生产级多用户数据运营。
- 完整生产级 Dify 写入链路。
- 完整生产级 Supabase 业务数据写入链路。
- 普通用户上传职位。
- 自动投递、职位爬取、Chrome 插件。
- 复杂模板市场。
