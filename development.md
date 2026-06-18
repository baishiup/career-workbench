# 开发与部署

这个文件描述 Career Workbench 怎么开发、验证和部署。当前先用一份根目录文档维护事实源;如果
后面部署链路变复杂,再拆成 `development/` 下的 `mock.md`、`local.md`、`remote.md` 或
`deployment.md`。

## 前置条件

- Node + pnpm(workspace 包管理器)
- Supabase CLI + Docker(本地完整栈需要)
- 一个 Supabase 项目(线上验证或正式部署需要)
- 一个带 [`dify/`](./dify) 中 workflow 的 Dify 账号(真实 AI 需要;mock 模式不需要)

## 运行模式

项目当前按 `VITE_APP_MODE` 与 `VITE_SUPABASE_*` 区分环境。日常开发优先从 mock 模式开始;
需要验证真实登录、数据库、Edge Functions 时再切 local 或 remote。

| 模式   | 命令                          | 前端                 | 后端                                  | AI                         | 适合场景                       |
| ------ | ----------------------------- | -------------------- | ------------------------------------- | -------------------------- | ------------------------------ |
| Mock   | `pnpm dev` 或 `pnpm dev:mock` | Vite + MSW + fixture | 内存 mock                             | mock provider              | UI 开发、公开 demo、无密钥预览 |
| Local  | `pnpm dev:local`              | Vite                 | 本地 Supabase + 本地 Edge Functions   | 读取 `supabase/.env.local` | 完整链路调试、函数联调         |
| Remote | `pnpm dev:remote`             | Vite                 | 线上 Supabase + 已部署 Edge Functions | 线上 Supabase secrets      | 接近线上环境的验证             |

### Mock 模式

Mock 模式是默认的低摩擦入口,不需要真实 Supabase 或 Dify 密钥。

```bash
pnpm install
pnpm dev
```

根目录 `pnpm dev` 等同于 `pnpm dev:mock`。`apps/web/vite.config.ts` 会在 `--mode mock` 时注入
默认 mock env,因此即使没有本机 `apps/web/.env.mock`,CI/Vercel 也能稳定构建 mock 版本。本机
可以保留 ignored 的 `apps/web/.env.mock` 覆盖默认值,但不要依赖它作为公开部署前置条件。

启动时 `apps/web/src/main.tsx` 会先启动 `@career-workbench/mock` 的 MSW Service Worker,再渲染
应用,因此 auth、PostgREST、Storage、Functions 等请求都会落到 mock 层。

公开 Vercel demo 也优先使用 mock 构建,避免真实简历、JD、Dify key 或 Supabase 项目被暴露:

```bash
pnpm --filter @career-workbench/web build:mock
```

输出目录是 `apps/web/dist`。

### Local 模式

Local 模式用于验证完整栈:本地 Supabase、Edge Functions、前端和真实/模拟 AI provider 的组合。

```bash
cp supabase/.env.example supabase/.env.local
# 填入 Dify key 后:
pnpm dev:local
```

`pnpm dev:local` 是仓库约定入口,会启动 Supabase 本地栈、Edge Functions 和 Web。不要临时拼一组
`supabase start`、`supabase functions serve`、`vite` 命令,除非是在定位脚本本身的问题。

Local 模式的 Web 环境变量放在 `apps/web/.env.local`:

```bash
VITE_APP_MODE=supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local-anon-or-publishable-key>
```

Edge Functions 的密钥放在 `supabase/.env.local`。每个 Dify workflow 使用独立 key:

```bash
DIFY_RESUME_PARSE_API_KEY=    # 简历解析(upload-resume / complete-onboarding-with-resume)
DIFY_JOB_PARSE_API_KEY=       # job_parse(admin 职位导入)
DIFY_JOB_MATCH_API_KEY=       # job_match(AI 匹配叙事)
DIFY_RESUME_GENERATE_API_KEY= # resume_generate(target-job 简历)
DIFY_RESUME_CHAT_API_KEY=     # resume_chat chatflow(编辑器 AI 对话)
DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_USER=career-workbench-debug
```

缺少必要 key 时,Edge Functions 应该以 `config` 阶段错误失败,不要静默降级成看似成功。

### Remote 模式

Remote 模式用于本地前端连接线上 Supabase,适合验证线上 RLS、Auth、数据和已部署 Edge Functions。

```bash
pnpm dev:remote
```

`pnpm dev:remote` 会读取本机 ignored 的 `apps/web/.env.remote`。这个文件只能放浏览器可公开的
变量,例如 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`;Dify key、service role key
等密钥只允许放在 Supabase Edge Functions secrets。

## Supabase 与 Auth

Google 登录配置步骤:

1. Google Cloud Console 创建 OAuth consent screen 和 Web application 类型 OAuth Client。
2. OAuth redirect URI 填 Supabase 回调:
   `https://<project-ref>.supabase.co/auth/v1/callback`。
3. Supabase Dashboard -> Authentication -> Providers -> Google,填入 Client ID 与 Secret 并启用。
4. Supabase Dashboard -> Authentication -> URL Configuration:
   - 本地 `Site URL`: `http://localhost:5173`
   - 本地 Redirect URLs: `http://localhost:5173/**`
   - 部署后加正式域名
5. 数据库 schema 通过 [`supabase/migrations/`](./supabase/migrations) 管理;不要再手动维护第二套建表脚本。

session 由 Supabase 管理;业务表不维护 token 字段。`auth.users` 是认证身份,
`public.profiles` 承载用户资料和 onboarding 状态,访问控制交给 RLS 的 `auth.uid()`。

如需导入职位,把你的账号设置为 admin。普通用户没有导入入口。

## 验证

提交前至少跑:

```bash
pnpm check
pnpm test
pnpm build
```

`pnpm check` 会覆盖 Web、domain、mock 的 TypeScript 检查;`packages/shared` 当前为空包,只保留
显式 no-op。`pnpm test` 当前主要覆盖 `packages/domain` 的 Vitest 领域逻辑;Web 与 mock 还没有
单测时会输出 no-op,不要把它理解成已有 UI/handler 测试覆盖。

Edge Functions 有独立 Deno 工具链:

```bash
pnpm functions:check
pnpm functions:lint
pnpm functions:fmt:check
```

UI 改动后,再手动冒烟 Jobs、Resumes、Profile、Onboarding、Login,确认顶部导航和主工作台壳没有回退。

## 本地运维命令

本地 Edge Functions 统一走仓库脚本:

```bash
pnpm functions:serve:local
pnpm functions:restart:local
pnpm functions:status:local
```

这些脚本约定:

- pidfile: `.cache/supabase-functions-local.pid`
- log: `.cache/supabase-functions-local.log`
- 默认健康检查: `http://127.0.0.1:54321/functions/v1/resume-generate`

检查其他函数可临时覆盖:

```bash
SUPABASE_FUNCTIONS_HEALTH_URL=http://127.0.0.1:54321/functions/v1/job-match pnpm functions:status:local
```

## 核心流程冒烟

想确认改动没有破坏核心闭环,按这条路径走一遍:

1. 打开应用进入工作台;如果启用 Supabase Auth,先经 `/login` 登录。
2. 完成 onboarding,上传简历解析进 profile;或跳过进入 Jobs。
3. 在 Resumes 上传简历,确认解析,应用到 profile;验证重命名、删除、格式校验。
4. 打开简历编辑器,修改内容或样式,保存,刷新确认是否持久化。
5. Admin 在 `/jobs` 导入职位,编辑或停用;普通用户不应看到导入入口。
6. 筛选职位,查看匹配指示。
7. 进入职位详情,查看结构化 JD,触发 AI 匹配分析,查看报告。
8. 修改 profile 后确认旧报告标记为过期,并可重新分析。
9. 基于最新匹配报告生成 target-job 简历,确认它出现在 Resumes 列表。

## 部署

部署分三块:静态 SPA、Supabase 项目(Postgres + Auth)、Edge Functions。

### Mock Vercel 部署

当前公开 demo 优先用 mock 形式部署:

```bash
pnpm install --frozen-lockfile
pnpm --filter @career-workbench/web build:mock
```

Vercel 配置建议:

- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @career-workbench/web build:mock`
- Output Directory: `apps/web/dist`
- 不设置真实 Supabase/Dify 密钥

后续可以用根目录 `vercel.json` 固化这些配置。

### Supabase 项目

在 Supabase 创建项目后,用 CLI 应用 [`supabase/migrations/`](./supabase/migrations)。baseline
migration 已包含业务表、RLS policy、admin helper、Storage bucket policy;后续 schema 变更继续
新增 migration。

然后按上文配置 Google 登录和正式域名 Redirect URLs。

### Edge Functions

仓库脚本要求显式传入目标项目,避免误部署到写死的个人 project:

```bash
SUPABASE_PROJECT_REF=<your-ref> pnpm functions:deploy
```

只部署单个函数:

```bash
SUPABASE_PROJECT_REF=<your-ref> pnpm functions:deploy job-match
```

远程环境在 Supabase Dashboard -> Edge Functions -> Secrets 设置 Dify key,变量名与
[`supabase/.env.example`](./supabase/.env.example) 保持一致。

### 真实 Supabase 前端部署

如果要让前端连接线上 Supabase,使用普通生产构建:

```bash
pnpm --filter @career-workbench/web build
```

托管到 Vercel、Netlify 或 Cloudflare Pages 时,设置构建期 env:

```bash
VITE_APP_MODE=supabase
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

### 部署后检查

- 正式域名已加入 Supabase Auth redirect URLs。
- demo 数据不包含真实简历、真实 JD、真实用户隐私。
- 公开 demo 优先用只读或低权限 demo 账号,不要开放无约束注册。
- README 里的 Live Demo 链接已更新。
- 隐私边界仍符合 [`docs/product-overview.md`](./docs/product-overview.md)。
