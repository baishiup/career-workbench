# AGENTS.md

Career Workbench 的项目级 AI Coding 规则入口。本文只放协作规则和目录边界；产品、技术和功能细节不要重复写在这里。

## 当前主目标

先把 Career Workbench 做成可演示、可解释的 AI 简历/JD 匹配工作台。

当前阶段优先级：

1. 保持 mock/demo 流程可运行。
2. 稳定文档和代码归属边界。
3. 小步实现一个 feature，不顺手扩到其他 feature。
4. 不接真实 Dify、Supabase 或上传链路，除非当前任务明确要求。

## 开发原则

- 先读现有代码和相关 docs，再改动。
- 默认只处理一个小目标。
- 优先最小可行修改，不做无关重构。
- 新增依赖必须能解释为什么现有工具不够。
- 不提交真实简历、手机号、邮箱、公司内部数据、`.env` 或 API key。
- 大改动先写计划；实现后给出验证命令。
- 复杂逻辑保留简短设计原因，避免逐行废话注释。

## 文档事实源

- `README.md`：项目定位、当前状态、启动命令、验证命令、演示路径。
- `docs/product.md`：用户、MVP 闭环、暂不做、产品风险。
- `docs/tech-stack.md`：技术选型、运行模式、前后端边界。
- `docs/mvp-roadmap.md`：阶段计划和验收标准。
- `docs/code-organization.md`：目录归属、抽组件规则、代码放置边界。
- `docs/feature-spec/*.md`：单个功能的行为、状态、失败、验收。
- `docs/feature-spec/AI-Trace全流程设计.md`：AI Run Trace、prompt/workflow key、事件协议、外部运行引用。

不要在多个文档维护同一段长说明。需要改产品边界时改 `docs/product.md`；需要改技术边界时改 `docs/tech-stack.md`；需要改目录规则时改 `docs/code-organization.md`。

## 代码归属规则

完整规则见 `docs/code-organization.md`。简要边界如下：

- `src/app/**/page.tsx`：路由装配、数据入口和页面布局组合，目标控制在 120 行以内。
- `src/components/ui`：纯 UI primitive，不允许业务名词、store、mock 数据或 route 逻辑。
- `src/components/workbench`：App shell、导航、工作台布局 surface 等跨 feature 工作台组件。
- `src/features/{profile,jobs,resumes,onboarding}`：业务组件、feature hooks、mock 数据、feature 类型。
- `src/lib`：跨 feature 的纯工具、客户端配置、全局 store。
- route 私有 `_components` 只放真正不复用、强绑定该 route 的小组件；同 feature 多页面共享时迁到 `src/features/*`。

## Spec 工作流

每轮开发只选择一个主 spec 或一个明确治理目标。跨 spec 依赖只记录为前置条件，不顺手实现。

任务拆分格式：

```txt
目标：
边界：
输入：
实现：
验收：
```

功能实现必须能回答：

- 用户可见行为是什么。
- 状态和数据边界在哪里。
- 失败状态怎么展示。
- 如何验证。

## AI 与数据边界

- 前端不直接调用 Dify，不持有 Dify key、模型 key 或 service role key。
- AI 输出先进入结构化结果、待采纳 patch、conversation message 或 run event，再进入业务对象。
- Dify 的 workflow/conversation/message id 只作为外部引用保存，不作为本系统主键。
- mock provider、Dify provider、OpenAI-compatible provider 必须共享统一事件协议。
- Prompt、workflow key、AI Run Trace 细节见 `docs/feature-spec/AI-Trace全流程设计.md`。

## 提交前检查

至少运行：

```bash
pnpm check
pnpm test
pnpm build
```

如果某个命令暂不可用，在交付说明里写清楚原因。

## Review Checklist

- 是否只处理当前目标。
- 是否符合对应 docs 的事实源。
- 是否把业务组件放在 `src/features/*`，没有塞进 `components/ui` 或 `lib`。
- 是否保留 mock/demo 可运行。
- 是否避免真实隐私数据和密钥。
- 是否有失败状态或清楚的后续边界。
- 是否提供可运行验证命令。
