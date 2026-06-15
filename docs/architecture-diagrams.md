# 架构图（Mermaid）

> 用 Mermaid 描述项目的**数据逻辑**与**业务逻辑**。GitHub / VSCode（装 Mermaid 插件）/ 语雀等可直接渲染。
> 改逻辑时请顺手更新本文件，避免图过期。

---

## 一、数据逻辑：实体关系图（ER）

数据库表结构与外键关系。所有业务表都挂在 `users` 上（`users.id` 又外键到 Supabase 的 `auth.users`）。

```mermaid
erDiagram
    auth_users ||--|| users : "1:1 (id)"
    users ||--o| profiles : "拥有档案"
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
        timestamptz created_at
        timestamptz updated_at
    }

    profiles {
        uuid id PK
        uuid user_id FK
        jsonb profile_data "归一化后的求职者档案"
        timestamptz created_at
        timestamptz updated_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        text title
        text source_type "manual_created / ai 等"
        jsonb document_json "简历正文"
        jsonb style_json "排版样式"
        jsonb ai_parsed_draft_json "AI 解析原始草稿"
        jsonb source_context_json "来源/目标职位上下文"
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
        text remote_status "onsite/remote/hybrid"
        text job_type "full_time 等"
        text years_required
        text_array required_skills
        text_array preferred_skills
        text_array responsibilities
        text_array requirements
        text salary_range
        text summary
        text source_platform
        text source_url
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
        text status "pending/succeeded/failed"
        jsonb report_json "AI 叙述: evidence/gaps/risks/ai_note"
        timestamptz profile_snapshot_at "档案快照时间(判过期)"
        timestamptz job_snapshot_at "职位快照时间(判过期)"
        text external_run_id "Dify run id(仅调试)"
        text error_message
        timestamptz created_at
        timestamptz updated_at
    }
```

**要点**

- `match_reports` 每 `(user_id, job_id)` 唯一一行，重新分析就 upsert 覆盖，不留历史。
- 匹配**分数**由规则计算、不入库；`report_json` 只存 AI 的叙述（evidence / gaps / risks / ai_note）。
- 两个 `*_snapshot_at` 记录分析时档案/职位的 `updated_at`，用来判断报告是否过期。

---

## 二、业务逻辑：核心流程图

用户动作 → Edge Function → Dify 工作流（AI）→ 落库。

```mermaid
flowchart TD
    subgraph 客户端["前端 (apps/web)"]
        U1["新用户 Onboarding"]
        U2["简历列表上传"]
        U3["确认应用到档案"]
        U4["Admin 导入职位"]
        U5["点『AI 匹配分析』"]
        U6["生成定向简历"]
    end

    subgraph EF["Edge Functions (Deno)"]
        F1["complete-onboarding-with-resume"]
        F2["upload-resume"]
        F3["apply-resume-to-profile"]
        F4["job-parse (仅 admin)"]
        F5["job-match"]
        F6["resume-generate"]
    end

    subgraph Dify["Dify 工作流 (AI)"]
        D1["resume_parse"]
        D2["job_parse"]
        D3["job_match"]
        D4["resume_generate"]
    end

    subgraph DB["数据库 (Postgres)"]
        T1[(profiles)]
        T2[(resumes)]
        T3[(job_descriptions)]
        T4[(match_reports)]
    end

    %% Onboarding：解析后直接覆盖档案 + 建基础简历
    U1 --> F1 --> D1
    D1 --> F1
    F1 -->|覆盖| T1
    F1 -->|创建| T2

    %% 列表上传：只建简历草稿，不动档案
    U2 --> F2 --> D1
    D1 --> F2
    F2 -->|创建草稿| T2

    %% 用户确认：不再调 AI，读草稿归一化后写档案
    U3 --> F3
    F3 -->|读 ai_parsed_draft_json| T2
    F3 -->|更新| T1

    %% 职位导入：解析后返回草稿，admin 确认后前端直写
    U4 --> F4 --> D2
    D2 --> F4
    F4 -.返回结构化草稿.-> U4
    U4 -->|确认后直写 RLS=admin| T3

    %% 匹配分析：先 upsert pending，调 AI，写回报告
    U5 --> F5
    F5 -->|读| T1
    F5 -->|读| T3
    F5 -->|upsert pending| T4
    F5 --> D3
    D3 --> F5
    F5 -->|写报告/快照/置 succeeded| T4

    %% 生成简历：聚合档案+JD+最新匹配报告 → AI → 落简历
    U6 --> F6
    F6 -->|读| T1
    F6 -->|读| T3
    F6 -->|读最新未过期报告| T4
    F6 --> D4
    D4 --> F6
    F6 -->|写| T2
```

**三条值得记住的设计**

1. **AI 成本只花一次**：`upload-resume` 解析后把原始结果存进 `resumes.ai_parsed_draft_json`；`apply-resume-to-profile` 用户确认时**不再调 AI**，直接读草稿归一化，确认动作可重复执行且结果一致。
2. **职位导入不落库在函数里**：`job-parse` 只解析返回草稿，真正保存由 admin 在前端确认后直写 `job_descriptions`（RLS 限 admin）。
3. **匹配是 on-demand 且幂等**：`job-match` 先写一行 `pending`，AI 成功后置 `succeeded` 并存双快照；`resume-generate` 会复用「最新未过期」的匹配报告。
