# 免费额度与边缘架构

## 目标

让演示项目尽量不依赖自建后台服务，并尽可能控制在常见第三方服务的免费额度内。

本文只定义部署方式和代码边界，不定义完整数据表结构。

## 目标结构

```txt
career-workbench/
  apps/
    web/                 # 面向用户的 Career Workbench
    admin/               # 预留空目录，后续需要时再实现

  packages/
    shared/              # 共享类型和 schema
    resume/              # 简历领域契约
    ai/                  # prompt 契约、mock provider、输出 schema
    db/                  # Supabase client / repository 边界

  supabase/
    migrations/          # Postgres schema、RLS、Storage policy
    functions/           # 用 Edge Functions 替代 apps/api
```

## 服务拆分

| 区域 | 服务 | 说明 |
|---|---|---|
| 用户端应用 | Vercel Hobby / Cloudflare Pages | 部署 `apps/web` 的 Vite 静态产物。 |
| Admin 应用 | 后续再定 | 现在保持 `apps/admin` 为空；只有内部流程需要独立应用时再实现。 |
| 数据库 | Supabase Free | 用 Postgres 保存用户、Profile、简历、职位、匹配结果、AI trace。 |
| Auth | Supabase Free | 负责用户登录和 admin 权限控制。 |
| 文件存储 | Supabase Storage | 保存上传的简历和生成的导出文件。 |
| 后端逻辑 | Supabase Edge Functions | 负责 signed upload URL、上传完成确认、调用 Dify、写入业务结果。 |
| AI 编排 | Dify Workflow / Chatflow | 负责简历解析、匹配分析、生成和简历级对话。 |
| AI fallback | 默认 mock / OpenAI-compatible | 无 Dify 配置时保持 demo 可跑；真实模型调用必须加 allowlist 和 rate limit。 |

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

## 后续 Admin 简历上传流程

```txt
apps/admin or apps/web/admin
  -> create-upload-url Edge Function
  -> 浏览器直传 Supabase Storage
  -> complete-resume-upload Edge Function
  -> 创建或更新 Postgres resume_file / resume 记录
  -> 调用 Dify resume-parse Workflow，或标记为 parsing_pending
  -> 用户确认 profile draft 后写入 ProfileVersion 和 base ResumeVersion
```

MVP 里文件不要经过前端托管层的 serverless function。浏览器直传 Supabase Storage 可以避开 request payload 限制，也能让架构更简单。

当前脚手架状态：`apps/admin` 故意保持为空。本文只保留未来边界。

## Dify 调用边界

Dify 是 AI 编排层，不是 Career Workbench 的业务主库。

Edge Function 调 Dify 时遵守：

- 只从 Supabase 读取本次任务需要的最小输入。
- 优先传结构化文本；必须传文件时使用短期有效的 signed URL 或受控中转。
- Dify 返回的结果必须落回 Supabase：profile draft、match report、resume patch、conversation message、run event。
- 保存 `workflow_run_id`、`conversation_id`、输入摘要、输出摘要、错误、耗时和版本信息。
- UI 不直接调用 Dify API，不暴露 Dify API key。

隐私取舍：

- GitHub/demo 默认走 mock，不发送真实简历。
- 小范围 MVP 可以用 Dify Cloud 验证流程。
- 真实私有用户数据规模化前，需要评估自托管 Dify 或切回自建 AI adapter。

## Supabase Edge Functions

当前占位函数：

- `create-upload-url`
- `complete-resume-upload`
- `run-match-analysis`
- `generate-resume-version`

实现规则：

- 不要在浏览器代码里暴露 service role key。
- 执行高权限操作前必须校验 Supabase Auth 和 admin role。
- Storage bucket 默认保持私有。
- 所有对外暴露的表都必须开启 RLS。
- 公开演示默认使用 mock AI。
- 接入 Dify 或真实 AI 前先加用户级和 admin 级 rate limit。

## 免费额度风险控制

- 默认使用 `AI_ORCHESTRATOR=mock`。
- Dify 配置缺失时自动降级到 mock。
- 上传文件限制保持较小，例如演示简历限制在 5-10 MB。
- Dify/真实 AI 只对 allowlist 账号开放，直到隐私和计费边界稳定。
- 只保存 sample/demo 数据，不保存私有真实简历。
- 没有真实必要前，不做 OCR、服务端浏览器渲染和批处理任务。

## 部署说明

前端托管平台只部署已经实现的 Vite 静态应用：

```bash
pnpm --filter @career-workbench/web build
```

Supabase 负责后端资产：

```bash
supabase db push
supabase functions deploy create-upload-url
supabase functions deploy complete-resume-upload
supabase functions deploy run-match-analysis
supabase functions deploy generate-resume-version
```

这些是后续部署目标，不是当前脚手架必须执行的命令。
