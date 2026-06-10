# 任务 5：match_reports 表 + job_match 叙事分析

## 目标

详情页可触发 AI 叙事分析（evidence / gaps / risks / aiNote），结果持久化、可复用，Profile 或职位更新后提示重新分析。

## 前置条件

- 任务 4（规则分作为工作流输入）。

## 边界

- AI 不打分，分数始终来自规则。
- 不建 `ExternalAiRun` 表。
- 每用户每职位一条，upsert 覆盖，不留分析历史。

## 输入

- 任务 4 的规则匹配分。
- `profiles.updated_at` 与职位 `updated_at`（过期判断依据）。
- `docs/feature-spec/Supabase持久化.md` 的 MatchReport 表字段清单。

## 实现

- `supabase/sql/match_reports_setup.sql`：按字段清单建表，`unique(user_id, job_id)`，RLS owner-only。
- Dify `job_match` workflow：只产叙事 JSON。
- Edge Function：校验 → 创建 pending → 调 Dify → 写 `report_json` + 双快照 + `external_run_id` → succeeded / failed。
- 详情页 UI：
  - 无报告时显示"运行分析"按钮。
  - 有报告且未过期时直接展示。
  - 快照过期时展示旧报告 + "重新分析"按钮，次级描述说明 Profile 或职位已更新。
  - 失败态可重试。

## 验收

- 对照 `docs/feature-spec/工作机会.md` 验收条款：复用、过期提示、失败时规则分仍可见且可重试。
- 同一 (user, job) 重复分析后表中只有一行记录。
