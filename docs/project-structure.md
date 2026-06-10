# 代码组织规则

本文是 Career Workbench 的代码归属唯一事实源。后续新增或搬迁代码时，优先按本文判断文件放在哪里。

## 目标

- 页面文件只负责路由装配和布局组合。
- 基础 UI、工作台 shell、页面、共享组件、跨页工具边界清楚。
- 页面独有的组件和逻辑内聚在页面文件夹；跨页面复用的才上浮。
- 后续 AI agent 可以根据路径规则做小步修改，不靠猜。

## 顶层边界

```txt
apps/web/src/
  App.tsx               # Vite SPA 路由装配和工作台 shell 组合
  main.tsx              # React 入口，只挂载全局 provider
  pages/                # 按路由/页面分文件夹
    login/
    jobs-list/
    job-detail/
    profile/
    ...
  components/           # 跨页面复用的组件
    workbench/
    onboarding/
    ai-chat/
  lib/                  # 跨页面工具、全局 store、多页共享的领域 API
    jobs/
    resumes/
```

## `src/App.tsx` 与路由装配

`src/App.tsx` 负责 Vite SPA 的路由装配和顶层布局组合，不负责沉淀业务组件。

允许放：

- 顶层 route switch。
- 工作台 shell 组合。
- 从 `src/pages/*` 导入页面组件做装配。
- 少量只在当前 route 使用、不会复用的小组件。

要求：

- `App.tsx` 保持装配层定位；如果路由逻辑继续增长，应拆到 `src/lib/router.ts` 或专门的 route 配置。
- 业务卡片、筛选器、表单步骤、详情面板迁到对应 `src/pages/<page>/components/`。
- 页面级 fixture/mock、types、utils 放在该页面文件夹，不放在路由装配层。

## `src/pages`

每个路由级页面对应一个文件夹。

推荐结构：

```txt
src/pages/profile/
  profile-page.tsx       # 页面入口
  data.ts                # 仅本页或本页为主归属的逻辑/数据
  types.ts
  utils.ts
  supabase-profile.ts
  components/            # 仅本页使用的子组件
    profile-display.tsx
    profile-drawer.tsx

src/pages/resume-detail/
  resume-detail-page.tsx
  components/
    resume-form-editor.tsx
    resume-ai-chat-tab.tsx
```

页面组织规则：

- 路由级页面入口命名为 `<page-name>-page.tsx` 或语义等价的 kebab-case。
- 仅服务单个页面的组件放在该页面的 `components/`。
- 页面独有的业务逻辑、样式、types、utils 放在页面文件夹同级。
- 多个页面共享同一领域 API（如 jobs 列表 + 详情）时，放到 `src/lib/<domain>/`，不要复制到每个页面。

其它页面可以引用某个页面的 `data.ts` / `types.ts`，但应优先确认该文件是否真的是共享归属；若已被 2 个以上页面依赖，考虑迁到 `src/lib/<domain>/`。

## `src/components`

只放跨页面复用的组件。

允许：

- 工作台 shell：`components/workbench/`。
- 被多个页面使用的业务 UI 块，如 `components/onboarding/onboarding-aside.tsx`、`components/ai-chat/ai-chat-panel.tsx`。
- 与共享组件强绑定的 mock/types，可放在同一目录，如 `components/ai-chat/types.ts`。

禁止：

- 把只服务单个页面的组件放进 `src/components/`。
- 重新创建 `src/components/ui` 作为 shadcn primitive 堆放目录。
- 把 job/resume/profile 的页面级卡片、表单直接堆进 `components/workbench/`。

## 基础 UI 组件

基础 UI 组件优先从 `@heroui/react` 直接导入，不再维护 shadcn/base-ui 风格的 `src/components/ui` primitive 目录。

允许：

- 在页面或组件中直接使用 HeroUI 的 Button、Chip、Card、Table、Drawer、Toast、Input 等组件。
- 在 `src/components/workbench` 沉淀只服务工作台 shell 的共享组件或样式 helper。
- 为了保持顶部导航等既有视觉，使用少量原生元素封装，但不得重新引入 Antd、Base UI 或 shadcn。

## `src/lib`

放跨页面的基础能力和多页共享的领域模块。

允许：

- `utils.ts`、`router.ts`、`auth-store.ts` 等通用工具与全局 store。
- 客户端配置与不绑定单一页面的 adapter。
- 被多个页面共享的领域 API / types，如 `lib/jobs/`、`lib/resumes/`。

不放：

- 路由级页面入口。
- 只服务单个页面的表单、卡片、展示组件。

当前 `workbench-store.ts` 暂时保留在 `src/lib`，因为它横跨 onboarding、profile、resumes、jobs。

## `packages/*`

`packages/*` 是未来稳定领域边界，不是早期代码临时垃圾桶。

- `packages/ai`：AI provider、Dify client、prompt/workflow registry、统一事件协议。
- `packages/domain`：简历、Profile、JD、匹配、patch 等稳定领域模型和纯领域函数（无 IO、无 UI、无客户端依赖）。
- `packages/db`：Supabase client、repository、数据库边界。
- `packages/shared`：跨包共享的非领域基础类型和 schema 工具。

只有当类型或逻辑已经被多个 app/package 使用，或者明显属于稳定领域模型时，才放入 `packages/*`。

`packages/domain` 内部按领域分子目录，每个领域目录里类型放 `types.ts`，纯函数按职责单独成文件：

```txt
packages/domain/src/
  resume/    # ResumeDocument、style、patch、AI 解析草稿和 normalize 函数
  profile/   # ProfileDraft 事实库类型
  job/       # JobDescription 与导入/远程/用工枚举
  index.ts   # 唯一公开出口，应用层不得深链内部路径
```

展示映射（中文 label、logo 派生）和本地 fixture 不进 `packages/domain`；fixture 跟随页面或 `lib/<domain>/` 归属。

## 类型文件注释规则

领域类型文件顶部必须用简短注释说明文件核心作用和边界，例如这个文件负责什么、不负责什么。

导出的 `type` 必须有类型级注释，说明它的业务含义或使用边界。字段级注释只在字段容易误用、存在兼容历史、格式约束或业务规则时添加；字段名已经自解释时不要重复注释。

## 抽组件原则

优先抽出：

- 单个文件超过 250 行且包含多个 UI 区块。
- 同一页面或多个页面复用的组件。
- 有独立状态、独立事件或独立视觉结构的区块。
- 业务含义清楚的卡片、筛选器、详情面板、表单步骤。

暂不抽出：

- 只用一次且少于 40 行的小展示片段。
- 为了“看起来架构好”而抽出的空壳组件。
- 尚未稳定的跨页面抽象。

## 命名规则

- 组件文件使用 kebab-case：`job-card.tsx`。
- 组件名使用 PascalCase：`JobCard`。
- 页面文件夹使用 kebab-case：`jobs-list/`、`resume-detail/`。
- 本地 fixture/mock 数据暂命名为 `mock-data.ts`。
- 页面内纯函数命名为 `utils.ts`，只有变多后再拆细。
- 导入统一使用 `@/pages/...`、`@/components/...`、`@/lib/...`。

## 结构检查

改动后至少检查：

```bash
rg -n "antd|@base-ui/react|components/ui|shadcn|class-variance-authority" apps/web/src apps/web/package.json
pnpm check
pnpm test
pnpm build
```

如果重新出现 `components/ui` 或旧 UI 依赖，应优先判断是否偏离 HeroUI 组件体系。
