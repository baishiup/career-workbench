# 代码组织规则

本文是 Career Workbench 的代码归属唯一事实源。后续新增或搬迁代码时，优先按本文判断文件放在哪里。

## 目标

- 页面文件只负责路由装配和布局组合。
- 基础 UI、工作台 shell、业务 feature、跨 feature 工具边界清楚。
- 本地 fixture/mock 数据、业务类型、业务组件跟随 feature 归属，避免散落在 `components/workbench`、`lib` 或 route 私有目录。
- 后续 AI agent 可以根据路径规则做小步修改，不靠猜。

## 顶层边界

```txt
apps/web/src/
  App.tsx               # Vite SPA 路由装配和工作台 shell 组合
  main.tsx              # React 入口，只挂载全局 provider
  components/
    workbench/          # 跨 feature 工作台组件
  features/
    jobs/               # Jobs 业务代码
    onboarding/         # Onboarding 业务代码
    profile/            # Profile 业务代码
    resumes/            # Resumes 业务代码
  lib/                  # 跨 feature 工具、客户端配置、全局 store
```

## `src/App.tsx` 与路由装配

`src/App.tsx` 负责 Vite SPA 的路由装配和顶层布局组合，不负责沉淀业务组件。

允许放：

- 顶层 route switch。
- 工作台 shell 组合。
- onboarding / jobs / resumes / profile 等页面级 feature 的装配。
- 少量只在当前 route 使用、不会复用的小组件。

要求：

- `App.tsx` 保持装配层定位；如果路由逻辑继续增长，应拆到 `src/lib/router.ts` 或专门的 route 配置。
- 业务卡片、筛选器、表单步骤、详情面板迁到 `src/features/*/components`。
- 本地 fixture/mock 数据放到对应 feature，不放在路由装配层。
- route 私有小组件只用于真正强绑定当前 route 的展示状态。

## 基础 UI 组件

基础 UI 组件优先从 `@heroui/react` 直接导入，不再维护 shadcn/base-ui 风格的 `src/components/ui` primitive 目录。

允许：

- 在 feature 页面或组件中直接使用 HeroUI 的 Button、Chip、Card、Table、Drawer、Toast、Input 等组件。
- 在 `src/components/workbench` 沉淀只服务工作台 shell 的共享组件或样式 helper。
- 为了保持顶部导航等既有视觉，使用少量原生元素封装，但不得重新引入 Antd、Base UI 或 shadcn。

禁止：

- 重新创建 `src/components/ui` 作为业务组件或 shadcn primitive 堆放目录。
- 把 `job`、`resume`、`profile`、`match` 等业务组件放入 `src/components/workbench`。
- 引入本地 fixture/mock 数据到跨 feature 组件。

## `src/components/workbench`

放跨 feature 的工作台外壳。

允许：

- 顶部导航、侧边导航、工作台 layout surface。
- 跨页面复用的工作台样式 token 或 className helper。

不放：

- Jobs/Profile/Resume 的业务卡片。
- 表单字段 schema。
- AI run、prompt、JD、简历等领域逻辑。

## `src/features`

业务代码按 feature 聚合。

推荐结构：

```txt
src/features/jobs/
  components/
  mock-data.ts
  types.ts
  utils.ts

src/features/profile/
  components/
  data.ts
  types.ts
  utils.ts
```

放在 feature 内的代码：

- 业务组件。
- 本地 fixture/mock 数据。
- feature 类型。
- feature hooks。
- 只服务当前 feature 的格式化、筛选、映射函数。

如果两个 feature 都需要同一段领域类型或规则，先确认它是否真的稳定；稳定后再迁到 `packages/*` 或 `src/lib`，不要提前抽象。

## `src/lib`

只放跨 feature 的基础能力。

允许：

- `utils.ts` 这种通用工具。
- 全局 store。
- 客户端配置。
- 不绑定单一 feature 的 adapter。

不放：

- 页面组件。
- Jobs/Profile/Resume 的本地 fixture/mock 数据。
- 只服务单一 feature 的表单、筛选、卡片。

当前 `workbench-store.ts` 暂时保留在 `src/lib`，因为它横跨 onboarding、profile、resumes、jobs。随着 Supabase 接入，按 feature 逐步拆成更明确的数据边界。

## `packages/*`

`packages/*` 是未来稳定领域边界，不是早期代码临时垃圾桶。

- `packages/ai`：AI provider、Dify client、prompt/workflow registry、统一事件协议。
- `packages/resume`：简历、Profile、JD、匹配、patch 等稳定领域模型。
- `packages/db`：Supabase client、repository、数据库边界。
- `packages/shared`：跨包共享类型和 schema。

只有当类型或逻辑已经被多个 app/package 使用，或者明显属于稳定领域模型时，才放入 `packages/*`。

## 类型文件注释规则

领域类型文件顶部必须用简短注释说明文件核心作用和边界，例如这个文件负责什么、不负责什么。

导出的 `type` 必须有类型级注释，说明它的业务含义或使用边界。字段级注释只在字段容易误用、存在兼容历史、格式约束或业务规则时添加；字段名已经自解释时不要重复注释。

## 抽组件原则

优先抽出：

- 单个文件超过 250 行且包含多个 UI 区块。
- 同一 feature 多个页面复用的组件。
- 有独立状态、独立事件或独立视觉结构的区块。
- 业务含义清楚的卡片、筛选器、详情面板、表单步骤。

暂不抽出：

- 只用一次且少于 40 行的小展示片段。
- 为了“看起来架构好”而抽出的空壳组件。
- 尚未稳定的跨 feature 抽象。

## 命名规则

- 组件文件使用 kebab-case：`job-card.tsx`。
- 组件名使用 PascalCase：`JobCard`。
- feature 内本地 fixture/mock 数据暂命名为 `mock-data.ts`。
- feature 内纯函数命名为 `utils.ts`，只有变多后再拆细。
- 跨 feature 导入统一使用 `@/features/...`、`@/components/...`、`@/lib/...`。

## 结构检查

改动后至少检查：

```bash
rg -n "antd|@base-ui/react|components/ui|shadcn|class-variance-authority" apps/web/src apps/web/package.json
pnpm check
pnpm test
pnpm build
```

如果重新出现 `components/ui` 或旧 UI 依赖，应优先判断是否偏离 HeroUI 组件体系。
