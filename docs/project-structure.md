## 顶层边界

```txt
apps/web/src/
  App.tsx               # Vite SPA 路由装配和工作台 shell 组合
  main.tsx              # React 入口,只挂载全局 provider
  pages/                # 按路由/页面分文件夹
    login/  jobs-list/  job-detail/  profile/  ...
  components/           # 跨页面复用/复杂的组件
    workbench/  onboarding/  ai-chat/
  lib/                  # 跨页面工具、全局 store、多页共享的领域 API
    jobs/  resumes/

packages/               # 稳定领域边界(详见下文)
supabase/functions/     # Edge Functions(后端,见 architecture.md#backend)
dify/                   # dify工作流
```

## `src/pages`

每个路由级页面对应一个文件夹。推荐结构:

```txt
src/pages/profile/
  profile-page.tsx       # 页面入口(<page-name>-page.tsx)
  data.ts                # 仅本页或本页为主归属的逻辑/数据
  types.ts  utils.ts  supabase-profile.ts
  components/            # 仅本页使用的子组件
    profile-display.tsx  profile-drawer.tsx
```

- 仅服务单个页面的组件放该页 `components/`;页面独有的逻辑、样式、types、utils 放页面文件夹
  同级。
- 多个页面共享同一领域 API(如 jobs 列表 + 详情)时,放 `src/lib/<domain>/`,不要复制到每个
  页面。若某文件已被 2 个以上页面依赖,考虑迁到 `src/lib/<domain>/`。

## `src/components`

只放跨页面复用或者复杂组件。

- 允许:工作台 shell(`components/workbench/`)、被多页使用的业务 UI 块(如
  `components/onboarding/`、`components/ai-chat/`)、与共享组件强绑定的 mock/types。
- 禁止:把只服务单个页面的组件放进来;把页面级卡片/表单堆进 `components/workbench/`。

## `src/lib`

跨页面的基础能力和多页共享的领域模块。

- 允许:`utils.ts`、`router.ts`、`auth-store.ts` 等通用工具与全局 store;客户端配置与不绑定
  单一页面的 adapter;被多页共享的领域 API / types(如 `lib/jobs/`、`lib/resumes/`)。
- 不放:路由级页面入口;只服务单个页面的表单/卡片/展示组件。
- `workbench-store.ts` 暂留 `src/lib`,因为它横跨 onboarding、profile、resumes、jobs。

## `packages/*`

`packages/*` 是稳定领域边界。只有当类型/逻辑已被多个 app/package
使用,或明显属于稳定领域模型时,才放进来。

- `packages/domain`:简历、Profile、JD、匹配、patch 等稳定领域模型和纯领域函数(无 IO、无
  UI、无客户端依赖)。
- `packages/mock`:基于 MSW 的 Supabase 栈 mock(auth / postgrest / storage / functions),
  支撑无密钥的 fixture 模式本地开发。
- `packages/shared`:预留接缝,放真正跨包复用的非领域基础类型和 schema 工具。

其余稳定边界等到真正有跨 `app`/`package` 复用需求时再建,不预先堆空占位包——例如 AI Run
Trace 落地时新增的 `packages/ai` / `packages/db`(见
[AI-Trace全流程设计](../feature-spec/AI-Trace全流程设计.md))。

`packages/domain` 内部按领域分子目录,类型放 `types.ts`,纯函数按职责单独成文件:

```txt
packages/domain/src/
  resume/    # ResumeDocument、style、patch、AI 解析草稿和 normalize 函数
  profile/   # ProfileDraft 事实库类型
  job/       # JobDescription 与匹配报告
  index.ts   # 唯一公开出口,应用层不得深链内部路径
```

展示映射(中文 label、logo 派生)和本地 fixture 不进 `packages/domain`;fixture 跟随页面或
`lib/<domain>/` 归属。

## 命名规则

- 组件文件 kebab-case(`job-card.tsx`),组件名 PascalCase(`JobCard`)。
- 页面文件夹 kebab-case(`jobs-list/`、`resume-detail/`)。
- 本地 fixture/mock 暂命名 `mock-data.ts`;页面内纯函数命名 `utils.ts`,变多后再拆。
- 导入统一用 `@/pages/...`、`@/components/...`、`@/lib/...`。
