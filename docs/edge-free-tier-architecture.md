# 免费额度与边缘架构

## 目标

让 MVP 尽量不依赖自建后台服务，并尽可能控制在常见第三方服务的免费额度内。

本文只定义部署方式和代码边界，不定义完整数据表结构。

## 目标结构

```txt
career-workbench/
  apps/
    web/                 # 面向用户的 Career Workbench
    admin/               # 预留空目录，后续需要时再实现

  packages/
    shared/              # 共享类型和 schema
    domain/              # 简历/Profile/JD 领域模型与匹配规则
    ai/                  # prompt 契约、mock provider、输出 schema
    db/                  # Supabase client / repository 边界

  supabase/
    migrations/          # Postgres schema、RLS、Storage policy
    functions/           # 用 Edge Functions 替代 apps/api
```

## 服务拆分

| 区域        | 服务                            | 说明                                                                           |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------ |
| 用户端应用  | Vercel Hobby / Cloudflare Pages | 部署 `apps/web` 的 Vite 静态产物。                                             |
| 数据库      | Supabase Free                   | 用 Postgres 保存用户、Profile、简历、职位、匹配结果、AI trace。                |
| Auth        | Supabase Free                   | 负责用户登录和 admin 权限控制。                                                |
| 文件存储    | Supabase Storage                | 后续保存生成的导出文件；上传原始简历文件第一阶段不长期保存。                   |
| 后端逻辑    | Supabase Edge Functions         | 负责接收上传文件、调用 Dify、写入业务结果。                                    |
| AI 编排     | Dify Workflow / Chatflow        | 负责简历解析、匹配分析、生成和简历级对话。                                     |
| AI fallback | 本地 mock / OpenAI-compatible   | 无 Dify 配置时用于开发和契约测试；真实模型调用必须加 allowlist 和 rate limit。 |

## 为什么一开始不做 `apps/api`

脚手架阶段不需要一个常驻的 API 服务。大部分后端能力可以先交给 Supabase：

- Auth session 和用户身份。
- Postgres 持久化。
- 私有 Storage bucket。
- 用 Edge Functions 处理高权限写入、Dify API 调用和 AI run 持久化。

只有出现真实需求后再增加 `apps/api`：

- 长时间运行的解析任务。
- 后台队列。
- 高 CPU 的 OCR 处理。
- 需要更复杂编排的 provider webhook。
- 需要和前端独立扩缩容。

## 后续简历上传流程

```txt
apps/web
  -> upload-resume / complete-onboarding-with-resume Edge Function
  -> Edge Function 中转 PDF 给 Dify resume-parse Workflow（DIFY_RESUME_PARSE_API_KEY）
  -> 写入 profiles / resumes，或返回 profile candidate 等待用户确认
```

## Admin 职位导入流程

```txt
apps/web（admin）
  -> job-parse Edge Function（DIFY_JOB_PARSE_API_KEY）
  -> Dify job_parse Workflow（JD 文本和/或职位截图，vision 一步解析）
  -> 前端导入表单预填 + 人工确认
  -> 直接写 job_descriptions（RLS 限 is_admin）
```

MVP 里先不做 signed upload URL 和 resume_files 表。只有文件需要长期保存、支持大文件或异步解析时，再重新设计 Storage 直传流程。

## Dify 调用边界

Dify 是 AI 编排层，不是 Career Workbench 的业务主库。

Edge Function 调 Dify 时遵守：

- 只从 Supabase 读取本次任务需要的最小输入。
- 优先传结构化文本；必须传文件时使用 Edge Function 受控中转。
- Dify 返回的结果必须落回 Supabase：profile draft、match report、resume patch、conversation message、run event。
- 保存 `workflow_run_id`、`conversation_id`、输入摘要、输出摘要、错误、耗时和版本信息。
- UI 不直接调用 Dify API，不暴露 Dify API key。

隐私取舍：

- 本地开发 fixture 默认走 mock，不发送真实简历。
- 小范围 MVP 可以用 Dify Cloud 验证流程。
- 真实私有用户数据规模化前，需要评估自托管 Dify 或切回自建 AI adapter。

## Supabase Edge Functions

当前实现函数：

- `upload-resume`：简历列表上传入口，接收 PDF、调用 Dify、创建 `resumes`，返回 `profile_candidate`，不覆盖 Profile。
- `complete-onboarding-with-resume`：Onboarding 上传入口，接收 PDF 和 preferences，调用 Dify，覆盖 `profiles.profile_data`，创建 base resume，并完成 onboarding。
- `apply-resume-to-profile`：用户确认后，把某份 resume 保存的 `ai_parsed_draft_json` 重新归一化并覆盖 Profile。
- `job-parse`：admin 粘贴 JD 文本或上传职位截图，调用 Dify `job_parse` workflow，返回结构化职位草稿供导入表单预填（不落库）。

当前共享代码：

- `_shared/cors.ts`：CORS 与 JSON response helper。
- `_shared/auth.ts`：Supabase Auth 校验；`job-parse` 额外检查 `users.is_admin`。
- `_shared/resume-normalize.ts`：Edge Function 到 `packages/domain` 归一化逻辑的桥接。
- `_shared/dify-resume-parse.ts`：简历 Dify 文件上传、Workflow 调用和 `AIParsedResumeDraft` 提取（`DIFY_RESUME_PARSE_API_KEY`）。
- `_shared/dify-job-parse.ts`：职位 JD 解析 Dify 调用和 `JobParseDraft` 提取（`DIFY_JOB_PARSE_API_KEY`）。

Dify 环境变量（见 `supabase/.env.example`）：每个 workflow 独立 key；`DIFY_BASE_URL`、`DIFY_USER` 共用。旧名 `DIFY_API_KEY` 已改为 `DIFY_RESUME_PARSE_API_KEY`。

已删除未实现的空壳函数。后续只有在对应业务真正开始实施时，再新增函数：

- JD 匹配分析（`DIFY_JOB_MATCH_API_KEY`）。
- 定向简历生成（`DIFY_RESUME_GENERATE_API_KEY`）。

实现规则：

- 不要在浏览器代码里暴露 service role key。
- 执行高权限操作前必须校验 Supabase Auth 和 admin role。
- Storage bucket 默认保持私有。
- 所有对外暴露的表都必须开启 RLS。
- 本地开发默认使用 mock AI。
- 接入 Dify 或真实 AI 前先加用户级和 admin 级 rate limit。

## 免费额度风险控制

- 默认使用 `AI_ORCHESTRATOR=mock`。
- Dify 配置缺失时，本地开发可降级到 mock；集成环境应提示配置缺失。
- 上传文件限制保持较小，例如简历限制在 5-10 MB。
- Dify/真实 AI 只对 allowlist 账号开放，直到隐私和计费边界稳定。
- 本地 fixture 只保存 sample 数据，不保存私有真实简历。
- 没有真实必要前，不做独立 OCR 服务、服务端浏览器渲染和批处理任务（职位截图走 Dify vision，不算独立 OCR）。

## 部署说明

前端托管平台只部署已经实现的 Vite 静态应用：

```bash
pnpm --filter @career-workbench/web build
```

Supabase 负责后端资产：

```bash
supabase db push
supabase functions deploy upload-resume
supabase functions deploy complete-onboarding-with-resume
supabase functions deploy apply-resume-to-profile
supabase functions deploy job-parse
```

Dify workflow 导入与 API Key 配置见 [dify/README.md](../dify/README.md)；本地 env 模板见 [supabase/.env.example](../supabase/.env.example)。

后续新增 Edge Function 后，再补充对应部署命令。
