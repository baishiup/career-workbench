# 本地运维入口

这个文档记录 Codex/人工都应该优先使用的本地操作命令，避免临时拼接
`pkill`、`pgrep`、`nohup` 等容易出错的进程命令。

## 前端格式化

```bash
pnpm format:check
pnpm format
```

- 前端、脚本、Markdown 默认走 Prettier。
- `supabase/functions` 继续走 Deno formatter：

```bash
pnpm functions:fmt:check
```

## Supabase Edge Functions

前台调试：

```bash
pnpm functions:serve:local
```

后台重启并健康检查：

```bash
pnpm functions:restart:local
```

查看本地状态：

```bash
pnpm functions:status:local
```

脚本约定：

- pidfile: `.cache/supabase-functions-local.pid`
- log: `.cache/supabase-functions-local.log`
- 默认健康检查地址:
  `http://127.0.0.1:54321/functions/v1/resume-generate`

如需检查其他函数，可临时覆盖：

```bash
SUPABASE_FUNCTIONS_HEALTH_URL=http://127.0.0.1:54321/functions/v1/job-match pnpm functions:status:local
```

## 线上函数部署

`resume-generate` 固定使用当前项目 ref：

```bash
pnpm functions:deploy:resume-generate
```

部署后确认：

```bash
supabase functions list --project-ref divotulntpbfiufzhtzn
```
