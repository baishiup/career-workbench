# @career-workbench/mock

纯 mock 运行 / 部署能力。用 [MSW](https://mswjs.io/)（Mock Service Worker）在**网络层**拦截
`@supabase/supabase-js` 发出的所有请求（REST / Auth / Functions / Storage），背后接一套带
localStorage 持久化的内存数据库，让 web 应用在**没有任何后端**的情况下也能完整跑起来，
并能直接 `vite build` 成纯静态站部署（Vercel / Netlify / GitHub Pages）。

## 为什么是网络层拦截

真实的 `supabase-js`、`auth-store`、各 feature 的 API mapper 全部**原样执行** —— mock 与真实
模式走同一条代码路径，保真度最高，不会出现「mock 跑通但真实挂掉」。这也是相比手写假 client
的关键优势。

## 怎么用

```bash
pnpm --filter @career-workbench/web dev:mock     # 本地以纯 mock 模式开发
pnpm --filter @career-workbench/web build:mock   # 产出纯静态包，无需后端
```

`apps/web/vite.config.ts` 会在 `--mode mock` 时注入默认 mock env(`VITE_APP_MODE=mock` 等),
因此 CI/Vercel 不需要本机 `.env.mock` 也能构建。`apps/web/src/main.tsx` 在渲染前
`await startMockWorker()` 启动 Service Worker；非 mock 构建里这段是动态 import，会被打成独立
chunk，不会进主包。

> 首次接入需要 worker 脚本：`cd apps/web && pnpm exec msw init public --save`，
> 它会把 `public/mockServiceWorker.js` 拷好（已纳入版本库，正常无需重跑）。

## 拦截范围

| Supabase 能力        | 路径                   | 实现                                                                                                                                      |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Postgres (PostgREST) | `*/rest/v1/:table`     | 通用协议模拟器：`eq`/`cs`/`order`/`limit`、`single` vs `maybeSingle`、`head`+count、insert/upsert/update/delete + `return=representation` |
| Auth (GoTrue)        | `*/auth/v1/*`          | 任意账号登录为同一个固定 mock 用户，回标准扁平 session                                                                                    |
| Edge Functions       | `*/functions/v1/:name` | 7 个函数：job-match / resume-generate 真实落库，其余回对齐类型的占位响应                                                                  |
| Storage              | `*/storage/v1/*`       | 上传存内存 Map，`getPublicUrl` 的 GET 回内存二进制（当前会话有效）                                                                        |

handler 用 `*/...` 通配主机，因此与 `VITE_SUPABASE_URL` 具体取值解耦。

## 数据与持久化

- 种子数据见 [`src/db/seed.ts`](src/db/seed.ts)：一个已完成 onboarding 的 admin 用户、一份从
  Profile 派生的简历、3 条职位、1 条 demo 匹配报告。
- 写操作落内存并同步到 `localStorage`（key `career-workbench:mock-db:v1`），刷新 / 重开不丢；
  每个访客一份独立数据。seed 结构变更时 bump 该 key 版本即可丢弃旧快照。
- `resetMockDatabase()` 清空本地写入、恢复到 seed。

## 测试 / Node

`@career-workbench/mock/node` 导出基于 `msw/node` 的 `server`，可在单测里 `server.listen()`。
