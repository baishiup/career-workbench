# Supabase

这个目录保存 Career Workbench 的 Supabase 资产:数据库 schema、RLS policy、Storage 配置和
Edge Functions。

## 目录职责

- `migrations/`：数据库 schema、RLS policy、Storage bucket policy。
- `functions/`：Supabase Edge Functions，用于 admin-only 操作、Dify/AI 调用和写入侧工作流。

## Dify 边界

Supabase 仍然是 Career Workbench 的产品侧主数据源。Dify 只作为 AI 编排服务，由 Edge Functions 在服务端调用。

- 前端不直接调用 Dify，不暴露 Dify API key。
- Edge Functions 读取最小必要输入，调用 Dify Workflow/Chatflow，再把结构化结果写回 Supabase。
- Dify 的 `workflow_run_id`、`conversation_id`、workflow key、版本、耗时和错误信息保存为外部运行引用。
- 简历文件优先保存在 Supabase Storage；如果 Dify 需要读取文件，只传短期 signed URL 或由 Edge Function 中转。
- 未配置 AI key 时,相关 Edge Function 必须返回清晰的配置错误,不能静默写入不可信结果。

## 当前状态

当前仓库已包含真实 Edge Functions 和可从空库重建的 baseline migration。运行、验证和部署入口见
[`../development.md`](../development.md)。
