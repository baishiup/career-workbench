# Career Workbench

Career Workbench 是一个面向开发者求职场景的 AI 简历/JD 匹配与定制简历工作台。

## 当前状态

MVP 核心闭环（上传简历 → Profile → 职位 → 匹配 → 生成定制简历）已接通：

- 已有 `pnpm workspace + Vite React` 骨架，HeroUI v3 + Tailwind CSS v4 工作台 UI 和本地开发 fixture。
- 部分本地状态仍使用 Zustand + localStorage，后续按 feature 迁到 Supabase 持久化。
- 已有 Supabase Auth、Google 登录、Profile/onboarding 持久化与 `profiles` RLS。
- 简历链路：上传解析（`upload-resume` / `complete-onboarding-with-resume`，Dify 解析）、确认覆盖 Profile（`apply-resume-to-profile`）、列表重命名/删除、编辑器修改 `document_json` / `style_json` 显式保存。
- 职位链路：职位表浏览、admin 职位导入与 `job-parse` Edge Function（Dify vision 解析 JD 文本/截图）。
- 匹配链路：规则匹配分由前端 `@career-workbench/domain` 实时计算；AI 叙事分析走 `job-match` Edge Function，结果写入 `match_reports` 并按快照判断过期。
- 生成链路：`resume-generate` Edge Function 基于 Profile + JD + 最新匹配报告生成 target job 简历。
- 尚未接入：简历编辑器 AI 对话（当前为 mock）、ResumePatch/修改日志、AI Run Trace、PDF 导出。

## 本地启动

```bash
pnpm install
pnpm dev
```

`/` 是公开落地页，展示产品功能并引导登录/进入工作台。产品主路径以 Supabase 登录和业务持久化为目标；mock/fixture 只用于本地开发阶段。

Supabase 登录配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

运行模式由 Supabase env 是否存在决定：无 `VITE_SUPABASE_*` 时只保留本地开发 fixture，方便调试 UI；配置完整后，业务页面会先检查 Supabase session，未登录会跳转 `/login`。（`VITE_APP_MODE` / `AI_ORCHESTRATOR` 是规划中的显式模式开关，当前代码尚未读取，见 `docs/tech-stack.md`。）

## Google 登录接入

1. Google Cloud Console：创建或选择项目，配置 OAuth consent screen，创建 Web application 类型的 OAuth 2.0 Client ID。
2. Google OAuth redirect URI 填 Supabase 回调地址，通常是 `https://<project-ref>.supabase.co/auth/v1/callback`。
3. Supabase Dashboard：Authentication -> Providers -> Google，填入 Google Client ID 和 Client Secret 并启用。
4. Supabase Dashboard：Authentication -> URL Configuration，本地 `Site URL` 可填 `http://localhost:5173`，Redirect URLs 加 `http://localhost:5173/**`；部署后加正式域名。
5. Supabase Dashboard SQL Editor：执行 `supabase/sql/profiles_auth_setup.sql`，创建或升级 `public.profiles` 和 RLS policy。
6. 本地创建或更新 `apps/web/.env.local`，填入 `VITE_APP_MODE=supabase`、`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。

登录状态由 Supabase session 管理，不在业务表维护 token 字段。`Authentication -> Users` 里的 `auth.users` 是认证系统用户；业务侧使用 `public.profiles` 做用户资料和 onboarding 状态，后续业务表用 `user_id` / `profiles.id` 关联用户，访问控制交给 RLS 的 `auth.uid()`。

页面初始化会调用 `supabase.auth.getUser()` 远端验证当前 token，并读取或创建当前用户自己的 `public.profiles` 行。`has_completed_onboarding=false` 时进入 `/onboarding`；用户完成或跳过 onboarding 后更新为 `true`，后续刷新直接进入 Jobs。

## Edge Functions 与 Dify 配置

本地联调 Edge Functions 时，复制 `supabase/.env.example` 为 `supabase/.env.local` 并填入 key。每个 Dify workflow 使用独立 API Key：

```bash
DIFY_RESUME_PARSE_API_KEY=    # 简历附件解析 workflow（upload-resume / complete-onboarding-with-resume）
DIFY_JOB_PARSE_API_KEY=       # job_parse workflow（admin 导入职位）
DIFY_JOB_MATCH_API_KEY=       # job_match workflow（AI 叙事匹配分析）
DIFY_RESUME_GENERATE_API_KEY= # resume_generate workflow（target job 简历生成）
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_USER=career-workbench-debug
```

`pnpm dev:local` 会同时启动 Supabase 本地栈、Edge Functions（读取 `supabase/.env.local`）和前端。远程部署时在 Supabase Dashboard → Edge Functions → Secrets 使用相同变量名。细节见 [dify/README.md](./dify/README.md)。

职位 admin 权限：执行 `supabase/sql/jobs_admin_setup.sql` 后，在数据库手动置位 `public.users.is_admin = true`。

## 验证命令

```bash
pnpm check
pnpm test
pnpm build
```

`packages/*` 仍有部分脚手架占位命令，后续按 feature 补充真实测试。
UI 迁移或页面改动后，至少额外检查 Jobs、Resumes、Profile、Onboarding 和 Login 的主要交互，确认顶部导航保持当前 Career Workbench 样式。

## 本地验证路径

1. 打开应用，进入工作台。
2. 如果启用了 Supabase Auth，先通过 `/login` 使用 Google 登录。
3. 完成 onboarding（上传简历解析到 Profile），或跳过并进入 Jobs。
4. 在 Resumes 页面上传简历，确认解析结果后「更新到 profile」；验证重命名、删除和格式校验。
5. 打开简历详情编辑器，修改内容/样式后点击「保存」，刷新确认修改已持久化。
6. Admin 账号：在 `/jobs` 导入职位（粘贴 JD 或上传截图解析预填），编辑/停用职位；普通用户无导入入口。
7. 在 Jobs 列表筛选职位，查看规则匹配分。
8. 进入职位详情，查看结构化 JD，触发 AI 叙事分析并查看匹配报告；修改 Profile 后确认报告提示过期可重新分析。
9. 在职位详情基于最新匹配报告生成 target job 简历，回到 Resumes 列表确认新简历。
10. 后续阶段再接入编辑器 AI 对话（ResumePatch）、修改日志和 AI Run Trace。

## 文档入口

- [产品边界](./docs/product.md)
- [技术栈与架构边界](./docs/tech-stack.md)
- [代码组织规则](./docs/project-structure.md)
- [本地运维入口](./docs/local-operations.md)
- [Dify workflows](./dify/README.md)
- [功能规格](./docs/feature-spec/)
- [AI Trace 全流程设计](./docs/feature-spec/AI-Trace全流程设计.md)
- [免费额度与边缘架构](./docs/edge-free-tier-architecture.md)
- [AI agent 协作规则](./AGENTS.md)

## 暂不做

完整产品边界见 `docs/product.md`。当前阶段明确不做：

- 面试官/访客角色或公开 mock 入口。
- 生产级多用户数据运营。
- 普通用户上传职位。
- 自动投递、职位爬取、Chrome 插件。
- 复杂模板市场。
