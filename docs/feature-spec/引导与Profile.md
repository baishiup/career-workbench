# 引导与 Profile

## 目标

用户首次进入产品时必须先建立 profile。Profile 是个人事实库，后续 AI 只能基于 profile 和用户上传简历中的证据改写。

## 路径 A：上传简历解析

流程：

1. 用户上传 PDF/Word 简历。
2. 文件先保存到 Supabase Storage，并创建 `resume_file` 上传记录。
3. `complete-resume-upload` Edge Function 调用 Dify 简历解析 Workflow，提取文本和结构化信息。
4. 系统写入待确认 profile draft，并保存 Dify 外部运行引用。
5. 用户检查并修正解析结果。
6. 保存为 profile v1，同时生成一份 base resume。

降级流程：

- 没有 Dify 配置时使用 mock parser。
- Dify 解析失败时标记 `parse_failed`，允许用户下载原文件、查看错误摘要并切到手动填写。
- Dify 返回低置信度字段时必须进入待确认状态，不能直接写入事实库。

要求：

- 上传简历只用于 profile 建立、匹配和简历生成。
- 解析结果必须允许用户确认，不直接当成最终事实。
- 解析失败时允许切到手动填写。
- 如果 Dify 需要读取文件，只传短期 signed URL 或由 Edge Function 中转，不把永久文件 URL 暴露给第三方。
- 解析运行必须保存 `workflow_run_id`、workflow key、耗时、输入摘要、输出摘要和错误信息。

## 路径 B：手动填写 Profile

流程：

1. 用户进入 Profile 页面。
2. 按模块填写个人信息、教育、工作、项目、技能、求职偏好。
3. 保存后进入工作机会或简历页面。

当前前端 MVP：

- Profile 页面按 Personal、Education、Work Experience、Skills 顺序展示。
- 每个模块右侧提供编辑入口，点击后打开右侧抽屉表单。
- Education 和 Work Experience 支持多条记录，并可在抽屉内拖拽调整展示顺序。
- Skills 表单支持标签添加、删除、建议下拉和回车创建新标签。
- 当前保存仅更新本地页面状态，不写入 Supabase，不生成 ProfileVersion。
- Demo seed 数据必须脱敏，不能把真实手机号、邮箱或私人简历内容写入仓库。

## Profile 字段

基础信息：

- 姓名。
- 当前 title/headline。
- 邮箱。
- 手机。
- 所在城市。
- 目标地区。
- 个人网站。
- GitHub。
- LinkedIn。
- 其他作品链接。

求职偏好：

- 目标岗位方向。
- 岗位类型：全职、合同、兼职、实习。
- 工作模式：远程、混合、现场。
- 目标地区。
- 期望行业。
- 期望薪资范围。
- 可入职时间。
- 工作授权状态。
- 是否需要签证支持。

教育经历：

- 学校。
- 学历。
- 专业。
- 开始时间。
- 结束时间。
- 所在地。
- 描述或补充说明。

工作经历：

- 公司。
- 职位。
- 所在地。
- 开始时间。
- 结束时间。
- 是否当前在职。
- 公司/产品背景。
- 职责概述。
- bullet 列表。
- 使用技术。
- 业务结果。
- 可公开证据链接。
- 不允许 AI 夸大的边界。

项目经历：

- 项目名称。
- 角色。
- 时间范围。
- 项目背景。
- 技术栈。
- 核心职责。
- 关键难点。
- 结果和指标。
- GitHub/演示链接。
- 可用于哪些岗位方向。

技能：

- 技能分组。
- 熟练度。
- 使用年限。
- 关联经历或项目。
- 是否允许出现在简历中。

## 验收标准

- 没有 profile 的用户无法直接生成 target job 简历。
- 上传解析和手动填写都能生成 profile draft。
- 用户必须确认解析结果后才能保存为事实库。
- profile 更新后要形成版本记录。
- Dify 解析结果只能生成 draft，不能绕过用户确认直接成为 ProfileVersion。

前端 MVP 验收：

- Profile 页面能看到四个模块，顺序为 Personal、Education、Work Experience、Skills。
- 点击任一模块编辑按钮会打开对应右侧抽屉，Update 后主展示区立即反映修改。
- Education 和 Work Experience 的记录可通过拖拽改变顺序。
- Skills 输入已有建议时可点击选择；没有建议时可按 Enter 创建新标签。
