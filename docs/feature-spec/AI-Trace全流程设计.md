# AI Trace 全流程设计

## 目标

AI Trace 是 Career Workbench 的 AI 协作证据链，不是普通 debug log。它要让用户和开发调试视图都能看清楚：

- 这次 AI 任务为什么开始。
- 输入了哪些业务上下文。
- 使用了哪个 prompt、Dify workflow 或 fallback provider。
- 中间经历了哪些 step、delta、patch、report 和错误。
- 最终生成了什么业务对象。
- 用户采纳、拒绝或手动修改了哪些内容。

第一版先把流程、数据模型和事件协议规划清楚。真实 Dify API、Supabase migration、前端 Trace 面板和开发 mock runner 可以在后续实现阶段分开落地。

## 范围

本设计覆盖四类 AI 任务：

- `resume_parse`：上传简历后解析为 profile draft 或 profile version。
- `match_analysis`：对比 JD 与 profile/resume，生成匹配分析。
- `resume_generation`：为目标 JD 生成 target job 简历版本。
- `resume_chat`：围绕某份简历和 section 进行多轮修改建议。

本设计不覆盖：

- 复杂富文本编辑器实现。
- 真实职位爬取或自动投递。
- Dify workflow 内部节点的具体 prompt 编排细节。

## 核心原则

- Career Workbench 拥有业务状态；Dify 只负责 AI 编排和结构化输出。
- Dify 不能直接修改 `ResumeVersion`，只能返回建议、报告或候选 patch。
- 所有 AI 输出先进入 trace，再转换为业务对象。
- 所有业务对象都必须能反查 `ai_run_id`。
- Dify 的 `workflow_run_id`、`conversation_id`、`message_id` 只作为外部引用保存，不作为本系统主键。
- mock provider、Dify provider、OpenAI-compatible provider 必须共享同一套事件协议。
- 普通用户看到业务化时间线；开发调试模式可以看到完整 trace、外部 ID、输入输出摘要和错误。

## 总体流程

```mermaid
sequenceDiagram
  actor User as 用户
  participant UI as Web UI
  participant API as Project API / Edge Function
  participant DB as Supabase / Postgres
  participant AI as AI Orchestrator
  participant Dify as Dify Workflow / Chatflow

  User->>UI: 触发 AI 任务
  UI->>API: 提交 taskType 和业务上下文
  API->>DB: 创建 AiRun(status=created)
  API->>DB: 写入 AiRunEvent(run.started)
  API->>AI: 调用统一 orchestrator
  AI->>Dify: 调用 workflow 或 chatflow
  AI-->>API: 返回 step / stream / final result
  API->>DB: 持续写入 AiRunEvent
  API->>DB: 写入 ExternalAiRun
  API->>DB: 写入 MatchReport / ResumePatch / ResumeVersion
  API->>DB: 更新 AiRun(status=completed 或 failed)
  API-->>UI: 推送统一事件或返回结果
  UI->>User: 展示 Trace、AI 回复、patch 和修改日志
  User->>UI: 采纳 / 拒绝 / 手动编辑
  UI->>API: 提交采纳 / 拒绝 / 手动编辑
  API->>DB: 写入 ResumeChangeLog 并关联 AiRun
```

## 职责边界

### Web UI

- 收集用户触发动作和当前业务上下文。
- 展示 AI run 进度、对话、patch、修改日志和 Trace 面板。
- 不直接调用 Dify。
- 不持有 Dify key、模型 key 或 service role key。
- 普通模式显示业务摘要，开发调试模式显示完整 trace。

### 前端开发 mock runner

当前 `apps/web` 是 Vite 静态前端，不承载服务端 API 路由。轻量、本地开发或 mock provider 适合先放在前端 mock 层：

- 本地 mock AI run。
- 开发 trace fixture 回放。
- 非敏感 fixture 读取。

前端 mock 层不保存长期敏感数据，不持有 Dify key、模型 key 或生产 service role key。

### Supabase Edge Function

适合承载需要保密 key 或持久化事务的 AI 任务：

- 创建 `ai_runs`。
- 调用 Dify Workflow / Chatflow。
- 写入 `ai_run_events`、`external_ai_runs` 和业务结果。
- 处理 Dify 失败、超时和重试。
- 用 service role 在 RLS 边界内完成受控写入。

### packages/ai

负责 AI 编排的代码边界：

- 统一事件类型。
- Dify client。
- mock provider。
- OpenAI-compatible fallback adapter。
- prompt/workflow registry。
- Dify 输出到业务 artifact 的解析和校验。

### packages/resume

负责简历业务对象：

- `ResumeVersion` 数据契约。
- `ResumePatch` 和 section 定位。
- `ResumeChangeLog` 事件类型。
- patch 采纳、拒绝和手动编辑的业务规则。

### packages/db

负责数据库访问边界：

- `AiRunRepository`。
- `AiRunEventRepository`。
- `ExternalAiRunRepository`。
- `ResumeConversationRepository`。
- `ResumePatchRepository`。
- `ResumeChangeLogRepository`。
- `MatchReportRepository`。

## AiRun 生命周期

`AiRun` 是一次 AI 任务的主记录。

状态：

- `created`：系统已收到任务，尚未开始调用 provider。
- `running`：任务正在执行，本地 step 或外部 workflow 已开始。
- `waiting_external`：等待 Dify 或外部 provider 返回结果。
- `completed`：任务成功完成，业务 artifact 已保存。
- `failed`：任务失败，错误摘要和已发生事件已保存。
- `cancelled`：用户或系统取消，保留取消前事件。

状态转换：

```txt
created -> running -> waiting_external -> completed
created -> running -> failed
created -> running -> waiting_external -> failed
created -> running -> cancelled
```

`failed` 不等于无记录。失败时也必须保存：

- 用户输入摘要。
- 已选 profile/job/resume 上下文摘要。
- provider。
- prompt/workflow key。
- Dify 外部 ID，如果已经获得。
- 错误类型和可读错误摘要。
- 失败前已发生的事件。

## 统一事件协议

所有 provider 都输出同一套事件。前端、SSE、Trace 面板和数据库只依赖统一事件，不依赖 Dify 节点结构。

事件类型：

- `run.started`：AI run 开始。
- `step.started`：某个业务步骤开始。
- `step.delta`：流式文本、阶段进度或中间观察。
- `artifact.patch`：产生可审阅的简历 patch。
- `artifact.report`：产生结构化报告，例如 match report。
- `step.completed`：某个业务步骤完成。
- `run.completed`：AI run 完成。
- `run.failed`：AI run 失败。

最小事件字段：

```txt
eventId:
runId:
eventType:
sequence:
stepKey:
title:
summary:
payload:
createdAt:
```

约束：

- `sequence` 在同一个 `runId` 内单调递增。
- `payload` 保存结构化数据，不保存不可控的大段原始隐私文本。
- `summary` 用于 UI 和日志快速展示。
- `artifact.patch` 必须能关联 `resume_patch_id` 或可转换为 `ResumePatch`。
- `artifact.report` 必须能关联 `match_report_id` 或可转换为 `MatchReport`。

## Dify Workflow / Chatflow 映射

| 业务任务 | taskType | Dify 类型 | workflow key | 主要输出 | Career Workbench 写入 |
|---|---|---|---|---|---|
| 简历解析 | `resume_parse` | Workflow + Document Extractor | `resume.profile.normalize.v1` | profile draft、证据来源 | `ProfileVersion` draft、`AiRun`、`AiRunEvent`、`ExternalAiRun` |
| JD 解析 | `match_analysis` 前置步骤 | Workflow | `job.jd.parse.v1` | 结构化 JD 要求 | `JobDescription` structured fields、`AiRunEvent` |
| 匹配分析 | `match_analysis` | Workflow | `match.report.generate.v1` | 匹配分数、缺口、风险、证据 | `MatchReport`、`AiRun`、`AiRunEvent`、`ExternalAiRun` |
| 定制简历生成 | `resume_generation` | Workflow | `resume.tailor.generate.v1` | target resume draft、生成理由 | `ResumeVersion`、`ResumeChangeLog`、`AiRun`、`AiRunEvent`、`ExternalAiRun` |
| 简历修改建议 | `resume_chat` | Chatflow | `resume.suggestion.review.v1` | 自然语言回复、结构化 patch | `ResumeConversation`、`ResumePatch`、`AiRun`、`AiRunEvent`、`ExternalAiRun` |

Dify 输出要求：

- 优先 JSON schema 输出。
- 每个输出必须包含业务对象类型、摘要、风险提示和证据引用。
- Chatflow 可以返回自然语言回复，但 patch 必须结构化。
- Dify 返回的外部 ID 必须写入 `external_ai_runs`。

## 数据模型规划

以下是建模设计，不代表本阶段立即创建 migration。

### ai_runs

一次 AI 任务的主记录。

关键字段：

```txt
id
user_id
task_type
status
orchestrator
provider
model_name
workflow_key
prompt_version
profile_version_id
job_description_id
resume_id
resume_version_id
input_summary
result_summary
error_code
error_summary
started_at
completed_at
created_at
updated_at
```

索引建议：

- `(user_id, created_at desc)`
- `(task_type, status)`
- `(resume_version_id, created_at desc)`
- `(job_description_id, created_at desc)`

### ai_run_events

AI run 的事件时间线。

关键字段：

```txt
id
ai_run_id
sequence
event_type
step_key
title
summary
payload_json
created_at
```

索引建议：

- `(ai_run_id, sequence)`

### external_ai_runs

Dify 或其他 provider 的外部运行引用。

关键字段：

```txt
id
ai_run_id
orchestrator
provider
workflow_key
workflow_run_id
conversation_id
message_id
external_status
request_id
raw_metadata_json
created_at
updated_at
```

索引建议：

- `(ai_run_id)`
- `(workflow_run_id)`
- `(conversation_id)`
- `(message_id)`

### resume_conversations

简历级 AI 对话记录。

关键字段：

```txt
id
resume_id
resume_version_id
ai_run_id
user_id
role
content
section_id
quick_prompt_key
dify_conversation_id
dify_message_id
created_at
```

### resume_patches

AI 生成但尚未必然采纳的结构化修改建议。

关键字段：

```txt
id
resume_id
resume_version_id
ai_run_id
conversation_id
section_id
status
original_summary
next_text
evidence_refs_json
risk_notes_json
confidence
created_at
decided_at
```

`status`：

- `pending`
- `accepted`
- `rejected`
- `superseded`

### resume_change_logs

用户可见的修改日志。

关键字段：

```txt
id
resume_id
resume_version_id
ai_run_id
resume_patch_id
actor
change_type
section_id
before_summary
after_summary
source_refs_json
created_at
```

`actor`：

- `user`
- `ai`
- `system`

`change_type`：

- `ai_generated_initial`
- `ai_suggested_patch`
- `user_accepted_patch`
- `user_rejected_patch`
- `user_manual_edit`
- `user_reordered_section`
- `user_changed_style`
- `user_exported_resume`

### match_reports

JD 与 profile/resume 的匹配分析结果。

关键字段：

```txt
id
user_id
job_description_id
profile_version_id
resume_version_id
ai_run_id
score
summary
strengths_json
gaps_json
risk_notes_json
evidence_refs_json
created_at
```

## 业务对象归属

- `match_analysis` 成功后写入 `MatchReport`，并通过 `ai_run_id` 反查 trace。
- `resume_generation` 成功后写入新的 `ResumeVersion`，同时写入 `ResumeChangeLog(change_type=ai_generated_initial)`。
- `resume_chat` 成功后先写入 `ResumeConversation` 和 `ResumePatch(status=pending)`。
- 用户采纳 patch 后：
  - 更新 `ResumePatch(status=accepted)`。
  - 修改 `ResumeVersion` 对应 section。
  - 写入 `ResumeChangeLog(change_type=user_accepted_patch)`。
- 用户拒绝 patch 后：
  - 更新 `ResumePatch(status=rejected)`。
  - 写入 `ResumeChangeLog(change_type=user_rejected_patch)`。
  - 不修改 `ResumeVersion` 正文。
- 用户手动编辑后：
  - 修改 `ResumeVersion` 对应 section。
  - 写入 `ResumeChangeLog(change_type=user_manual_edit)`。
  - 如果编辑源自某个 AI patch，可以保留 `resume_patch_id`。

## Resume Chat 完整链路

一次 AI 简历修改从点击按钮到写入修改日志的对象流：

1. 用户在 Resume 页面选择 section，输入修改要求。
2. UI 提交 `resume_chat` 请求，包含 `resume_id`、`resume_version_id`、`section_id`、用户输入、目标 JD 摘要和可用 evidence refs。
3. API / Edge Function 创建 `AiRun(status=created, task_type=resume_chat)`。
4. 写入 `AiRunEvent(run.started)`。
5. 调用 `resume.suggestion.review.v1` Chatflow。
6. 获得 Dify `conversation_id`、`message_id` 后写入 `ExternalAiRun`。
7. 将 Dify 回复转换为：
   - `ResumeConversation(role=assistant)`。
   - `ResumePatch(status=pending)`。
   - `AiRunEvent(artifact.patch)`。
8. 更新 `AiRun(status=completed)`，写入 `run.completed`。
9. UI 显示 AI 回复、patch 摘要、证据来源、风险提示和采纳/拒绝按钮。
10. 用户采纳后写入 `ResumeChangeLog(user_accepted_patch)`；拒绝后写入 `ResumeChangeLog(user_rejected_patch)`。

## 失败处理

Dify 或 fallback provider 失败时：

- `AiRun.status` 更新为 `failed`。
- 写入 `AiRunEvent(run.failed)`。
- 保存 `error_code` 和用户可读的 `error_summary`。
- 已经获得的 `workflow_run_id`、`conversation_id`、`message_id` 仍写入 `ExternalAiRun`。
- 用户输入写入 `ResumeConversation(role=user)`，避免用户丢失上下文。
- 不创建已完成业务结果。
- 如果失败前已经产生 pending patch，必须标记为 `superseded` 或保留为 pending 并显示“生成未完成”的风险状态。

用户可见降级：

- 允许重试同一上下文。
- 允许切换手动编辑。
- Trace 面板显示失败阶段和错误摘要。

## 前端 Trace 视图

### 普通用户视图

Resume 页面展示：

- AI 对话列表。
- pending patch 卡片。
- 采纳/拒绝状态。
- 修改日志时间线。
- 每条日志可跳到对应 section。

描述使用业务语言，例如：

- “AI 根据 ThriveCart JD 生成了 Summary 修改建议。”
- “你拒绝了 Experience section 的一条建议。”
- “你手动修改了 Skills section。”

### Debug / 面试视图

Trace 面板展示：

- `runId`。
- `taskType`。
- `status`。
- `workflowKey`。
- `promptVersion`。
- `orchestrator`。
- `provider`。
- Dify 外部 ID。
- 输入摘要。
- 输出摘要。
- 事件时间线。
- 关联业务对象 ID。
- 错误摘要。

该视图用于解释全栈链路、AI 编排、SSE、持久化和人工审核闭环。

## 反查路径

从 resume section 反查 AI run：

```txt
resume_version_id + section_id
-> resume_change_logs
-> resume_patch_id / ai_run_id
-> ai_runs
-> ai_run_events / external_ai_runs
```

从 Dify workflow run id 找回业务对象：

```txt
workflow_run_id
-> external_ai_runs
-> ai_runs
-> match_reports / resume_patches / resume_versions / resume_change_logs
```

从 match report 找回输入上下文：

```txt
match_report.ai_run_id
-> ai_runs
-> profile_version_id + job_description_id + resume_version_id
-> ai_run_events
```

## Mock 与真实 Dify 的一致性

mock provider 必须模拟真实 provider 的关键边界：

- 创建 `AiRun`。
- 输出统一事件。
- 生成 `artifact.patch` 或 `artifact.report`。
- 写入同样形状的 `AiRunEvent`。
- 使用同样的 `workflow_key` 和 `prompt_version`。
- 返回可被前端采纳/拒绝的 pending patch。

真实 Dify provider 只替换 provider 调用层，不改变 UI、数据库事件协议和业务对象归属。

## 后续实现拆分

建议按以下顺序实现：

1. 类型与事件协议：在 `packages/ai` 和 `packages/resume` 定义共享契约。
2. mock trace runner：不依赖 Dify，先跑通事件和业务 artifact。
3. Supabase schema：创建 `ai_runs`、`ai_run_events`、`external_ai_runs`、`resume_conversations`、`resume_patches`、`resume_change_logs`、`match_reports`。
4. Dify adapter：接入 Workflow / Chatflow，转换为统一事件。
5. API / SSE endpoint：把 run 事件推给前端并持久化。
6. 前端 Trace 面板：展示普通用户时间线和 Debug 视图。
7. Resume patch 采纳/拒绝流程：连接 patch、section、change log 和 trace。

## 验收标准

规划完成后，后续实现者必须能从本文回答：

- 一次 AI 简历修改从点击按钮到写入修改日志，中间经过哪些对象。
- Dify 返回失败时系统保存什么。
- 用户拒绝 AI patch 后 trace 和 change log 怎么记录。
- 如何从某个 resume section 反查对应 AI run。
- 如何从 Dify workflow run id 找回本项目业务对象。
- mock provider 和真实 Dify provider 如何共享同一套事件协议。
