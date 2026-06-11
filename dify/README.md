# Dify workflows

每个 workflow 在 Dify 里是独立 App，API Key 不能混用。Edge Functions 环境变量约定：

| 变量 | 对应 workflow | 使用方 |
| --- | --- | --- |
| `DIFY_RESUME_PARSE_API_KEY` | 简历附件解析 | `upload-resume`、`complete-onboarding-with-resume` |
| `DIFY_JOB_PARSE_API_KEY` | job_parse | `job-parse`（仅 admin） |
| `DIFY_JOB_MATCH_API_KEY` | job_match | `job-match`（登录用户） |
| `DIFY_BASE_URL` | — | 所有 Dify 调用共用，默认 `https://api.dify.ai/v1` |
| `DIFY_USER` | — | Dify API 的 `user` 字段，本地调试标识 |
| `DIFY_RESUME_INPUT_NAME` | 简历附件解析 | workflow 开始节点文件输入名，默认 `resume_file` |

本地配置：复制 [supabase/.env.example](../supabase/.env.example) 为 `supabase/.env.local` 并填入 key。远程 Supabase 在 Dashboard → Edge Functions → Secrets 使用相同变量名。

> 旧变量 `DIFY_API_KEY` 已更名为 `DIFY_RESUME_PARSE_API_KEY`。

## job_parse.yml

工作机会任务 2 的 JD 解析 workflow，把管理员粘贴的 JD 文本或职位截图解析成对齐 `public.job_descriptions` 的结构化字段。

编排：

- 开始节点两个可选输入：`jd_text`（paragraph，≤48,000 字符）+ `jd_screenshots`（image file-list，最多 5 张），后端保证至少传一个。
- 单个 Gemini vision LLM 节点（`temperature: 0`，关闭 thinking）一步完成读图 + 结构化输出，不依赖独立 OCR。
- Structured Output 用 Gemini 兼容 schema（缺失字段填 `""`），Code 节点校验 `remote_status` / `job_type` 枚举并把空字符串归一化为 `null`。
- 最终输出 `text`，JSON 包含 `schema_version: "job.parse.v1"`、职位字段和 `parse_warnings`（截图被截断、薪资看不清等模型自标注警告）。

接入方式：

1. 在 Dify 导入 `dify/job_parse.yml`，发布后拿到该 app 的 API Key。
2. 在 Supabase Edge Functions 配置 `DIFY_JOB_PARSE_API_KEY`（与简历解析的 key 分开）。
3. 后端入口是 `supabase/functions/job-parse`，仅 admin 可调用。

验证方式：

1. 在 Dify 调试界面只传 `jd_text`（粘贴一段完整 JD），确认输出 JSON 字段齐全。
2. 只传 1-2 张职位截图，确认 vision 解析可用，模糊或截断信息出现在 `parse_warnings`。
3. 同时传文本和截图，确认以文本为准、截图补充。

## job_match.yml

工作机会任务 5 的叙事匹配 workflow，基于 Profile、结构化 JD 和代码规则匹配结果输出 evidence / gaps / risks / ai_note 四类叙事。AI 不打分，分数始终来自规则计算。

编排：

- 开始节点三个必填输入：`profile_json`（ProfileDraft JSON 字符串）、`job_json`（结构化 JD JSON 字符串）、`rule_match_json`（规则匹配结果 JSON 字符串）。
- 单个 Gemini LLM 节点（`temperature: 0`，关闭 thinking）围绕规则结果生成叙事，Structured Output 限定 `schema_version: "job.match.v1"` 和四个叙事字段。
- Code 节点兜底解析 code fence 并把字段归一化成稳定形状（叙事列表只保留非空字符串）。
- 最终输出 `text`，JSON 不含任何分数或等级字段。

接入方式：

1. 在 Dify 导入 `dify/job_match.yml`，发布后拿到该 app 的 API Key。
2. 在 Supabase Edge Functions 配置 `DIFY_JOB_MATCH_API_KEY`（与其他 workflow 的 key 分开）。
3. 后端入口是 `supabase/functions/job-match`，登录用户从职位详情页触发；结果 upsert 进 `public.match_reports`，每用户每职位一行。

验证方式：

1. 在 Dify 调试界面填入一组 Profile / JD / 规则结果 JSON，确认输出只有叙事字段、没有分数。
2. 把规则结果中的 missingRequiredSkills 改成不同技能，确认 gaps 围绕缺失技能展开。
3. 故意传入空 Profile JSON，确认叙事不虚构经历（evidence 为空数组）。

## 简历附件解析.optimized.yml

这是从 `/Users/hongyuanqi/Downloads/简历附件解析.yml` 生成的优化版，目标是降低简历 PDF 解析的阻塞时间。

主要改动：

- 在 `文档提取器` 和 `LLM` 之间新增 `文本预处理` Code 节点。
- 预处理会清理空行、页码、连续重复行，并把传给 LLM 的文本限制在 18,000 字符以内。
- LLM 节点关闭 reasoning 输出配置，固定 `temperature: 0`、`top_p: 0.2`、`max_tokens: 4096`。
- Prompt 限制单条 bullet、项目数量、工作经历数量、skills 数量，避免输出过长。
- 保持后端契约不变：输入仍是 `resume_file`，最终输出仍是 `text`。

接入方式：

1. 在 Dify 导入 `dify/简历附件解析.optimized.yml`，发布后拿到该 app 的 API Key。
2. 在 `supabase/.env.local`（或远程 Secrets）配置 `DIFY_RESUME_PARSE_API_KEY`。

验证方式：

1. 在 Dify 导入 `dify/简历附件解析.optimized.yml`。
2. 用同一份 PDF 连续跑 3 次，和原 workflow 的运行时间取中位数对比。
3. 如果出现长简历信息遗漏，先把 Code 节点里的 `limit` 从 `18000` 调到 `24000`，再测试耗时。

预期效果：

- 对 1-2 页简历，主要减少 LLM 输入和无用 reasoning 等待。
- 对提取文本很脏或很长的 PDF，收益更明显。
- 如果 Dify 的耗时主要卡在文件上传或 Document Extractor，优化幅度会有限，需要再看 Dify 单次运行详情里的节点耗时。
