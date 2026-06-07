# Supabase 脚手架

这个目录负责保存 Supabase 相关项目资产，用于免费额度优先、Edge Functions 优先的演示架构。

## 目录职责

- `migrations/`：数据库 schema、RLS policy、Storage bucket policy。
- `functions/`：Supabase Edge Functions，用于 admin-only 操作、Dify/AI 调用和写入侧工作流。
- `seed.sql`：schema 稳定后可选的 demo seed 数据。

## Dify 边界

Supabase 仍然是 Career Workbench 的产品侧主数据源。Dify 只作为 AI 编排服务，由 Edge Functions 在服务端调用。

- 前端不直接调用 Dify，不暴露 Dify API key。
- Edge Functions 读取最小必要输入，调用 Dify Workflow/Chatflow，再把结构化结果写回 Supabase。
- Dify 的 `workflow_run_id`、`conversation_id`、workflow key、版本、耗时和错误信息保存为外部运行引用。
- 简历文件优先保存在 Supabase Storage；如果 Dify 需要读取文件，只传短期 signed URL 或由 Edge Function 中转。
- 无 Dify 配置时必须能回到 mock provider，保证 GitHub demo 可运行。

## 当前状态

当前文件都是占位骨架。它们只定义后续边界，还没有连接真实 Supabase project、service role key、Auth 配置、Storage bucket 或 Dify API key。

等 Supabase project ref 和本地 CLI 流程确定后，再执行 `supabase init`。
