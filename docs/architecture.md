# 架构

**目录**

- [系统全景](#overview)
- [数据模型](#data-model)
- [后端(Edge Functions + Dify)](#backend)
- [工程规范](#conventions)

## 一段话讲清问题

求职者为不同岗位反复改同一份简历,LLM 让这件事变快——但也会编造你没有的经历。难点不在于
**生成**一份定制简历,而在于让生成的每一个字都**可追溯到候选人真实做过的事**,同时把 AI
花费控制在低位、并保证业务状态在重试下依然正确。整个项目就是围绕这个约束构建的。

<a id="overview"></a>

## 系统全景

```mermaid
flowchart LR
  subgraph client["Web (apps/web)"]
    UI["React 19 SPA<br/>HeroUI v3 · Tailwind v4"]
  end
  subgraph domain["@career-workbench/domain"]
    DM["纯领域模型<br/>简历 · profile · JD · patch · 匹配"]
  end
  subgraph edge["Supabase Edge Functions (Deno)"]
    EF["信任边界 = 全部后端<br/>持有密钥 · 调用 AI · 写库"]
  end
  subgraph ai["Dify (AI 编排)"]
    WF["5 个 workflow / chatflow<br/>解析 · job-parse · 匹配 · 生成 · 对话"]
  end
  subgraph db["Supabase Postgres"]
    PG["RLS 守护的表<br/>users · profiles · resumes · jobs · match_reports"]
  end

  UI -->|import| DM
  UI -->|"supabase-js + invoke()"| EF
  UI -->|"auth session / RLS 读取"| PG
  EF -->|"最小输入"| WF
  EF -->|"结构化写入"| PG
```

浏览器从不直接和 Dify 或任何模型对话。任何需要密钥、高权限写入或事务性结果的操作,都走
Edge Function——它们就是这个项目的全部后端(没有独立 `apps/api`)。浏览器只能看到自己 RLS
作用域内的行,以及本项目自己的 Edge 端点。

承重的是 `packages/domain`:简历/profile/JD 类型、简历 patch 引擎、匹配报告过期规则、归一化
函数,全部以**纯函数 + 单元测试**的形式放在这里。Web 应用和 Edge Functions 都依赖它,所以
同一套规则在网络两侧一致生效。目录结构见 [project-structure.md](./project-structure.md)。

<a id="data-model"></a>

## 数据模型

schema 很小——五张表——且每张业务表都挂在 `users` 上,`users` 与 Supabase 的 `auth.users`
1:1。访问控制**不**在应用代码里实现;它落在基于 `auth.uid()` 的 Row-Level Security 策略中。
浏览器持有一个 Supabase session,只能读写属于自己的行。

> schema 事实源:[`supabase/migrations/`](../supabase/migrations)。本节与线上真实列结构保持同步。

### 实体关系

```mermaid
erDiagram
    auth_users ||--|| users : "1:1 (id)"
    users ||--o| profiles : "拥有 profile"
    users ||--o{ resumes : "拥有简历"
    users ||--o{ match_reports : "发起匹配"
    job_descriptions ||--o{ match_reports : "被匹配"

    auth_users {
        uuid id PK "Supabase Auth"
    }

    users {
        uuid id PK "= auth.users.id"
        text email
        text full_name
        text avatar_url
        bool has_completed_onboarding
        bool is_admin
        timestamptz created_at
        timestamptz updated_at
    }

    profiles {
        uuid id PK
        uuid user_id FK
        jsonb profile_data "归一化后的事实库"
        timestamptz created_at
        timestamptz updated_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        text title
        text source_type "manual_created / manual_upload / ai_generated / target_job"
        jsonb document_json "简历正文(模块模型)"
        jsonb style_json "排版与样式"
        jsonb ai_parsed_draft_json "原始 AI 解析(可空)"
        jsonb source_context_json "来源 / target-job 上下文"
        timestamptz created_at
        timestamptz updated_at
    }

    job_descriptions {
        uuid id PK
        text company
        text title
        text logo_url
        text company_info
        text location
        text remote_status "onsite / remote / hybrid"
        text job_type "full_time / ..."
        text years_required
        text_array required_skills
        text_array preferred_skills
        text_array responsibilities
        text_array requirements
        text salary_range
        text summary
        text source_platform
        text source_url "仅元数据 —— 从不自动抓取"
        text imported_by
        bool is_active
        timestamptz posted_at
        timestamptz created_at
        timestamptz updated_at
    }

    match_reports {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        text status "pending / succeeded / failed"
        jsonb report_json "AI 叙事: matchScore / evidence / gaps / risks / aiNote"
        timestamptz profile_snapshot_at "分析时的 profile updated_at"
        timestamptz job_snapshot_at "分析时的 job updated_at"
        text external_run_id "Dify run id —— 仅调试引用"
        text error_message
        timestamptz created_at
        timestamptz updated_at
    }
```

### 各表说明

**`profiles` —— 事实库。** `profile_data` 是一份归一化后的 JSONB 文档(个人信息、工作、项目、
教育、技能、求职偏好、自定义模块),是 AI 被允许取材的**唯一事实源**。生成与匹配读取它,但
无权编造里面没有的经历。归一化过程是
[`@career-workbench/domain`](../packages/domain/src/resume/normalize.ts) 中的纯函数,有测试。

**`resumes` —— 内容与样式分离。** `document_json`(简历说了什么)与 `style_json`(它长什么样)
分开存储,这样编辑器可在不动内容的前提下换模板,AI 也能在不动排版的前提下改写内容。
`ai_parsed_draft_json` 缓存上传时的原始 AI 解析,因此确认进 profile 时不需要第二次 AI 调用。`source_type` 区分来源:`manual_created` · `manual_upload`
· `ai_generated` · `target_job`。

**`match_reports` —— 每对一行,upsert。** 每 `(user_id, job_id)` **恰好一行**,重新分析就
upsert 覆盖、不留历史。匹配分数和叙事都存在 `report_json`(由 AI 产出);两个 `*_snapshot_at`
列记录分析时 profile 与 job 的 `updated_at`,任一输入自快照以来变化即视为过期——这就是全部的
缓存失效策略,纯规则
[`isMatchReportStale`](../packages/domain/src/job/match-report.ts))。

**`job_descriptions` —— admin 导入,从不爬取。** JD 是结构化的(技能/职责/要求都是数组),因此
匹配可逐字段推理。`source_url` 是人工填写的元数据——链接从不被跟踪或爬取(数据来源边界见
[product-overview](./product-overview.md))。

### 访问控制

每张业务表都启用 RLS。模式统一:仅当某行的 `user_id` 等于 `auth.uid()` 时该行才可见、可写。
`job_descriptions` 额外加一个 admin 例外——写入要求 `users.is_admin = true`——因为职位是共享、
由 admin 维护的内容,而非按用户隔离的数据。建表、RLS 与 Storage policy 都在
[`supabase/migrations/`](../supabase/migrations) 中维护。

<a id="backend"></a>

## 后端(Edge Functions + Dify)

这个项目**没有独立的 `apps/api`**——Supabase Edge Functions(Deno)就是全部后端。每一次后端
请求都走同一条路径:

```
用户动作  →  Edge Function (Deno)  →  Dify workflow  →  Postgres
```

浏览器从不直接调用 Dify 或模型。Edge Functions 是信任边界——持有 API key、执行高权限写入,并把
松散的 AI 输出翻译成结构化业务结果。注意并非所有函数都调 AI:`apply-resume-to-profile` 是纯
归一化、不碰 AI。

### 函数与 workflow

每个 Dify app 有**自己**的 API key,由恰好一个 Edge Function 读取。缺 key 会以 `config` 阶段
错误**失败关闭**,而不是悄悄降级。

| Edge Function                     | Dify workflow           | 做什么                                          |
| --------------------------------- | ----------------------- | ----------------------------------------------- |
| `upload-resume`                   | `resume_parse`          | 解析上传简历 → 把原始草稿缓存到简历行           |
| `complete-onboarding-with-resume` | `resume_parse`          | 解析 → 覆盖 profile + 创建 base 简历(首次)      |
| `apply-resume-to-profile`         | ——(无 AI)               | 重读缓存草稿 → 归一化 → 写 profile              |
| `job-parse`                       | `job_parse`             | 解析粘贴的 JD / 截图 → 结构化草稿(仅 admin)     |
| `job-match`                       | `job_match`             | 读 profile + JD → 匹配叙事 → 写 `match_reports` |
| `resume-generate`                 | `resume_generate`       | profile + JD + 最新匹配报告 → target-job 简历   |
| `resume-chat`                     | `resume_chat`(chatflow) | 对话式简历编辑 → 给出用户采纳/拒绝的 patch      |

workflow 定义版本化存放在 [`dify/`](../dify);key 命名见
[`supabase/.env.example`](../supabase/.env.example) 与 [`dify/README.md`](../dify/README.md)。

### 端到端流程

```mermaid
flowchart TD
    subgraph client["Web (apps/web)"]
        U1["新用户 onboarding"]
        U2["简历列表上传"]
        U3["确认 → 应用到 profile"]
        U4["Admin 导入职位"]
        U5["点『AI 匹配分析』"]
        U6["生成 target-job 简历"]
    end

    subgraph EF["Edge Functions (Deno)"]
        F1["complete-onboarding-with-resume"]
        F2["upload-resume"]
        F3["apply-resume-to-profile"]
        F4["job-parse (admin)"]
        F5["job-match"]
        F6["resume-generate"]
    end

    subgraph Dify["Dify workflows (AI)"]
        D1["resume_parse"]
        D2["job_parse"]
        D3["job_match"]
        D4["resume_generate"]
    end

    subgraph DB["Postgres"]
        T1[(profiles)]
        T2[(resumes)]
        T3[(job_descriptions)]
        T4[(match_reports)]
    end

    U1 --> F1 --> D1 --> F1
    F1 -->|覆盖| T1
    F1 -->|创建 base| T2

    U2 --> F2 --> D1 --> F2
    F2 -->|创建草稿| T2

    U3 --> F3
    F3 -->|读 ai_parsed_draft_json| T2
    F3 -->|归一化 + 更新| T1

    U4 --> F4 --> D2 --> F4
    F4 -.结构化草稿.-> U4
    U4 -->|确认 → RLS=admin 写入| T3

    U5 --> F5
    F5 -->|读| T1
    F5 -->|读| T3
    F5 -->|upsert pending| T4
    F5 --> D3 --> F5
    F5 -->|写报告 + 快照 + succeeded| T4

    U6 --> F6
    F6 -->|读| T1
    F6 -->|读| T3
    F6 -->|读最新未过期报告| T4
    F6 --> D4 --> F6
    F6 -->|写| T2
```

<a id="conventions"></a>

## 工程规范

- **类型:** Web 应用与各 package 全链路 TypeScript **strict**。
- **测试:** 领域逻辑是纯函数且有单元测试(Vitest)——简历 patch 的 apply/accept、样式模板、
  匹配报告过期判断。后续按风险补 AI adapter mock、JD parse 契约、表单/筛选交互测试。
- **UI 组件:** 基础组件直接从 `@heroui/react` 导入;**不**重新引入 Antd / Base UI / shadcn,
  **不**维护 `src/components/ui` primitive 目录。只服务工作台 shell 的共享样式 helper 放
  `src/components/workbench`。
- **抽组件:** 单文件超 ~250 行且含多区块、跨页面复用、或有独立状态/事件/视觉结构时才抽;
  **不**为"看起来架构好"抽空壳组件,**不**抽尚未稳定的跨页面抽象。
- **类型注释:** 领域类型文件顶部用简短注释说明职责边界;导出的 `type` 必须有类型级注释;
  字段注释只在易误用、有兼容历史或格式/业务约束时加,字段名自解释就不重复。
- **兼容代码:** 项目未上线,默认不为旧草稿/历史 mock 保留冗余兼容层;删字段/改结构时同步清理
  类型、默认值、归一化、UI 和文档;确需保留的兼容逻辑必须有明确退出条件。
- **Edge Functions:** 走 Deno 工具链(`pnpm functions:check` / `:lint` / `:fmt:check`),
  不要用 Prettier 处理 `supabase/functions`。
- **提交前:** `pnpm check && pnpm test && pnpm build`;另用
  `rg -n "antd|@base-ui/react|components/ui|shadcn|class-variance-authority" apps/web/src`
  反查是否偏离 HeroUI 体系。命令细节见 [development.md](../development.md)。
- **文档:** 被当作事实源,与 schema 和代码保持同步(每个主题只有一个家)。
