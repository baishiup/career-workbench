# 引导与 Profile

_状态:✅ 已实现_

## 目标

用户首次进入产品时必须先建立 profile。Profile 是个人**事实库**,后续 AI 只能基于 profile
和用户上传简历中的证据改写。

## 边界

- 上传的简历只用于 profile 建立、匹配和简历生成。
- Onboarding 上传解析结果可以直接覆盖 Profile;简历列表上传必须允许用户确认。
- 解析失败时允许切到手动填写。
- 如果 Dify 需要读取文件,第一阶段由 Edge Function 中转,不把永久文件 URL 暴露给第三方。
- 本地 fixture 数据必须脱敏,不写入真实手机号、邮箱或私人简历内容。
- **前置依赖:** Profile 持久化依赖 `public.profiles`(见 [Supabase持久化](./Supabase持久化.md))。

## 用户可见行为

### 路径 A:上传简历解析

1. 用户上传 PDF/Word 简历。
2. `complete-onboarding-with-resume` Edge Function 受控中转 PDF 给 Dify 简历解析 Workflow,
   不长期保存文件。
3. Dify 返回 `AIParsedResumeDraft` 后,系统归一化:`AIParsedResumeDraft → ProfileDraft →
ResumeDocument`。
4. Onboarding 场景解析成功后直接写入 `profiles.profile_data`,并创建一份 base resume。
5. 简历列表上传场景用 `upload-resume`,只创建 resume 和 profile candidate;用户确认后再调
   `apply-resume-to-profile` 覆盖 Profile。

### 路径 B:手动填写 Profile

1. 用户进入 Profile 页面,按模块填写个人信息、教育、工作、项目、技能、求职偏好。
2. 保存后进入工作机会或简历页面。

页面交互(当前 MVP):

- Profile 页面按 Personal、Education、Work Experience、Skills 顺序展示;每个模块右侧有编辑
  入口,点击打开右侧抽屉表单。
- Education 和 Work Experience 支持多条记录,可在抽屉内拖拽调整展示顺序。
- Skills 表单支持标签添加、删除、建议下拉和回车创建新标签。

## 数据与状态边界

- 事实源是 `public.profiles.profile_data`(保存 `ProfileDraft`)。完整 `ProfileVersion`
  随版本历史表后续落地。
- 解析运行须保存 `workflow_run_id`、workflow key、耗时、输入摘要、输出摘要和错误信息。
- Dify 解析结果只能生成 draft,不能绕过用户确认直接成为 ProfileVersion。

Profile 字段:

- **基础信息:** 姓名、当前 title/headline、邮箱、手机、所在城市、目标地区、个人网站、
  GitHub、LinkedIn、其他作品链接。
- **求职偏好:** 目标岗位方向、岗位类型(全职/合同/兼职/实习)、工作模式(远程/混合/现场)、
  目标地区、期望行业、期望薪资范围、可入职时间、工作授权状态、是否需要签证支持。
- **教育经历:** 学校、学历、专业、起止时间、所在地、描述。
- **工作经历:** 公司、职位、所在地、起止时间、是否在职、公司/产品背景、职责概述、bullet
  列表、使用技术、业务结果、可公开证据链接、不允许 AI 夸大的边界。
- **项目经历:** 名称、角色、时间范围、背景、技术栈、核心职责、关键难点、结果指标、
  GitHub/演示链接、可用于哪些岗位方向。
- **技能:** 分组、熟练度、使用年限、关联经历或项目、是否允许出现在简历中。

## 失败与降级

- 没有 Dify 配置时,本地开发可用 parser fixture 验证 UI 和数据契约。
- Dify 解析失败时保留错误摘要,允许用户切到手动填写。
- 简历列表上传场景中,Dify 返回低置信度字段时,必须由用户确认后才覆盖 Profile。

## 验收

- 没有 profile 的用户无法直接生成 target job 简历。
- 上传解析和手动填写都能生成 profile draft;用户必须确认解析结果后才能保存为事实库。
- profile 更新后要形成版本记录;Dify 解析结果只能是 draft,不能绕过确认成为 ProfileVersion。
- 前端 MVP:Profile 页能看到四个模块(顺序 Personal、Education、Work Experience、Skills);
  点编辑按钮打开对应抽屉,Update 后主展示区立即反映;Education/Work Experience 可拖拽改序;
  Skills 有建议可点选、无建议可按 Enter 新建。

## 相关

- [Supabase持久化](./Supabase持久化.md) · [简历列表](./简历列表.md) · [工作机会](./工作机会.md)
- 后端流程见 [backend.md](../docs/architecture.md#backend)
