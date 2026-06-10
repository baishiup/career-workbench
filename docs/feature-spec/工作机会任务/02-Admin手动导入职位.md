# 任务 2：Admin 手动导入职位

## 目标

管理员能手动创建、编辑、停用职位。

## 前置条件

- 任务 1（职位表已建，浏览链路已通）。

## 边界

- 只做手动表单；不做链接抓取、截图 OCR、AI 解析。
- 不做独立 admin 后台，入口放在现有工作台内按角色显隐。
- admin 判定用最小方案：`public.users` 加 `is_admin boolean`，手动在数据库置位。

## 输入

- 任务 1 的 `job_descriptions` 表。
- `docs/feature-spec/工作机会.md` 的导入方式 / 导入状态枚举。

## 实现

- SQL：`users.is_admin` 字段；jobs 写策略改为 `is_admin` 用户可 insert / update。
- 职位创建 / 编辑表单：导入方式记 `manual_text` / `manual_form`，导入状态记已解析；停用 = 状态字段切换。
- 普通用户隐藏入口，RLS 兜底拒绝写。

## 验收

- admin 全流程可操作：创建、编辑、停用。
- 普通用户无入口，直接调 API 被 RLS 拒绝。
- 导入方式和导入状态正确落库。
