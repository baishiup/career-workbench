# 任务 2：Admin 导入职位与 job_parse 解析

## 目标

管理员能手动创建、编辑、停用职位，并支持三种导入方式：手动填写表单、粘贴 JD 文本解析、上传职位截图解析。解析结果预填表单，人工确认后保存。

## 前置条件

- 任务 1（职位表已建，浏览链路已通）。

## 边界

- 不做链接自动抓取；原始链接字段由管理员手动填写。
- 截图解析用 Dify vision LLM 一步完成（读图 + 结构化输出），不引入独立 OCR 服务。
- 解析失败必须能降级为纯手动填写。
- 不做独立 admin 后台，入口放在现有工作台内按角色显隐。
- admin 判定用最小方案：`public.users` 加 `is_admin boolean`，手动在数据库置位。

## 输入

- 任务 1 的 `job_descriptions` 表。
- `docs/feature-spec/工作机会.md` 的导入方式 / 导入状态枚举。
- `dify/` 现有简历解析工作流，作为编排参考。
- `supabase/functions/_shared/dify-resume-parse.ts` 的 upload → run → 输出提取模式。

## 实现

分三层，同一任务内分阶段交付：

### A. admin 写权限 + 手动表单

- SQL：`users.is_admin` 字段；jobs 写策略改为 `is_admin` 用户可 insert / update。
- 职位创建 / 编辑表单：导入方式记 `manual_form`，导入状态记已解析；停用 = 状态字段切换。
- 普通用户隐藏入口，RLS 兜底拒绝写。

### B. Dify `job_parse` workflow + Edge Function

- workflow 开始节点两个可选输入：`jd_text`（段落）+ `jd_screenshots`（image file-list，支持多张应对长 JD），至少传一个。
- vision LLM 节点（temperature 0）输出 JSON：字段对齐 `job_descriptions` 表，外加 `parse_warnings`（截图被截断、薪资看不清等情况由模型标注）。
- Edge Function 调用 + 鉴权（仅 admin）：文本走 inputs，截图先经 Dify `/files/upload`（`type: "image"`）再引用；环境变量 `DIFY_JOB_PARSE_API_KEY`（简历解析用 `DIFY_RESUME_PARSE_API_KEY`，见 `supabase/.env.example`）。

### C. 表单接入解析

- 表单增加"粘贴 JD 解析"和"上传截图解析"入口，解析结果预填、人工校正后提交。
- `importMethod` 枚举：`manual_form` / `manual_text` / `screenshot`。
- `importStatus` 流转：已解析 / 待人工确认 / 解析失败可重试。
- `parse_warnings` 在人工确认界面可见。

## 验收

- admin 全流程可操作：创建、编辑、停用。
- 普通用户无入口，直接调 API 被 RLS 拒绝。
- 粘贴文本能预填表单；上传截图能预填表单。
- 截图模糊或信息缺失时 `parse_warnings` 在确认界面可见。
- Dify 失败时显示错误并可重试或转手动填写。
- 导入方式和导入状态正确落库，三种导入状态都能产生并正确展示。
