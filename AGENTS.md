# 核心开发原则

## 通用开发原则

- **可测试性**：编写可测试的代码，组件应保持单一职责
- **DRY 原则**：避免重复代码，提取共用逻辑到单独的函数或类
- **代码简洁**：保持代码简洁明了，遵循 KISS 原则（保持简单直接）
- **命名规范**：使用描述性的变量、函数和类名，反映其用途和含义
- **注释文档**：为复杂逻辑添加注释
- **风格一致**：遵循项目或语言的官方风格指南和代码约定
- **利用生态**：优先使用成熟的库和工具，避免不必要的自定义实现
- **架构设计**：考虑代码的可维护性、可扩展性和性能需求
- **版本控制**：编写有意义的提交信息，保持逻辑相关的更改在同一提交中
- **异常处理**：正确处理边缘情况和错误，提供有用的错误信息

## 响应语言

- 始终使用中文回复用户

## 事实源:先看对应文档

具体规则不写在本文,改哪类东西就看对应事实源:

| 要做什么                                       | 看哪里                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| 了解架构、设计决策、**工程规范**               | [docs/architecture.md](docs/architecture.md)                       |
| 代码放哪、目录归属                             | [docs/project-structure.md](docs/project-structure.md)             |
| 数据表、列、RLS                                | [docs/architecture.md#data-model](docs/architecture.md#data-model) |
| 后端 Edge Functions、Dify、流程                | [docs/architecture.md#backend](docs/architecture.md#backend)       |
| 产品边界、闭环、风险                           | [docs/product-overview.md](docs/product-overview.md)               |
| 运行、验证、运维、部署                         | [development.md](development.md)                                   |
| 单个功能的行为/状态/验收,以及**spec 协作流程** | [feature-spec/](feature-spec/)                                     |
| Dify workflow 清单与 key 约定                  | [dify/README.md](dify/README.md)                                   |

原则:不要在多个文档维护同一段长说明;改某类边界就改它对应的唯一事实源。

## 工作方式

- **一次一个 spec。** 每轮开发只选一个主 spec 或一个明确治理目标;跨 spec 依赖只记为前置条件,
  不顺手实现。spec 的标准结构与协作流程见 [feature-spec/README.md](feature-spec/README.md)。
- **提交前**至少跑 `pnpm check && pnpm test && pnpm build`;命令不可用时在交付说明里写清原因。
  完整运维/验证命令见 [development.md](development.md)。
- **Review 自检:** 是否只处理当前目标 · 是否符合对应 docs 的事实源 · 是否避免真实隐私数据和
  密钥 · 是否有失败状态或清楚的后续边界 · 是否提供可运行的验证方式。
