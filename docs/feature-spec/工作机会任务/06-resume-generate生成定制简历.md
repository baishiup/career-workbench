# 任务 6：resume_generate 生成 target job 简历

## 目标

从职位详情基于最新匹配报告生成 `target_job` 简历草稿，进入现有简历编辑器。

## 前置条件

- 任务 5（match_reports 叙事可用）。

## 边界

- 复用现有 `resumes` 表（`source_type = target_job`，职位上下文写 `source_context_json`）。
- 不建简历版本表。
- AI 对话、修改日志不在本任务。

## 输入

- 任务 5 的 `report_json`。
- `profiles.profile_data`。
- `packages/domain` 的 `ResumeDocument` 结构。

## 实现

- Dify `resume_generate` workflow：Profile + 结构化 JD + 叙事报告 → `ResumeDocument` JSON。
- Edge Function 落库（status: `draft` / `generation_failed`）。
- 无报告或报告过期时，前端引导先运行分析。
- 详情页"生成定制简历"入口 → 成功后跳转编辑器；失败态展示与重试。

## 验收

- 生成的简历出现在简历列表且类型为 `target_job`。
- `source_context_json` 含 `job_id` 和报告引用。
- 无报告时被引导先分析。
- 生成失败可重试。
