# Dify workflows

每个 workflow 在 Dify 里是独立 App，API Key 不能混用。Edge Functions 环境变量约定：

| 变量                           | 对应 workflow   | 使用方                                             |
| ------------------------------ | --------------- | -------------------------------------------------- |
| `DIFY_RESUME_PARSE_API_KEY`    | 简历附件解析    | `upload-resume`、`complete-onboarding-with-resume` |
| `DIFY_JOB_PARSE_API_KEY`       | job_parse       | `job-parse`（仅 admin）                            |
| `DIFY_JOB_MATCH_API_KEY`       | job_match       | `job-match`（登录用户）                            |
| `DIFY_RESUME_GENERATE_API_KEY` | resume_generate | `resume-generate`（登录用户）                      |
| `DIFY_RESUME_CHAT_API_KEY`     | resume_chat     | `resume-chat`（登录用户）                          |
| `DIFY_BASE_URL`                | —               | 所有 Dify 调用共用，默认 `https://api.dify.ai/v1`  |
| `DIFY_USER`                    | —               | Dify API 的 `user` 字段，本地调试标识              |
| `DIFY_RESUME_INPUT_NAME`       | 简历附件解析    | workflow 开始节点文件输入名，默认 `resume_file`    |

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

## resume_generate.yml

工作机会任务 6 的定制简历生成 workflow，基于 Profile、结构化 JD 和最新 match report 叙事输出一份可进入编辑器的 `ResumeDocument`。

编排：

- 开始节点三个必填输入：`profile_json`（ProfileDraft JSON 字符串）、`job_json`（结构化 JD JSON 字符串）、`match_report_json`（match report JSON 字符串，含 report_json 与报告引用）。
- 单个 Gemini LLM 节点（`temperature: 0`，关闭 thinking）只基于 Profile 事实重排和改写简历表达，不虚构经历、公司、项目、学历、指标。
- Structured Output 限定 `ResumeDocument` 的最低形状：`title`、`locale`、`target`、`sections`。后端会补齐 `target.jobId/company/title` 并再次做运行时校验。
- Code 节点兜底解析 code fence，并把最终 JSON 放到 `text` 输出。

接入方式：

1. 在 Dify 导入 `dify/resume_generate.yml`，发布后拿到该 app 的 API Key。
2. 在 Supabase Edge Functions 配置 `DIFY_RESUME_GENERATE_API_KEY`（与其他 workflow 的 key 分开）。
3. 后端入口是 `supabase/functions/resume-generate`，职位详情页在最新匹配报告可用时触发；结果写入 `public.resumes`，`source_type=target_job`。

验证方式：

1. 在 Dify 调试界面填入一组 Profile / JD / match report JSON，确认输出是 `ResumeDocument`，不是 markdown 或纯文本。
2. 故意让 match report 里的 gaps 变化，确认 summary/skills/work bullets 会围绕缺口做真实补证据表达。
3. 故意传入 Profile 里没有的技能或项目，确认 workflow 不会凭空添加事实。

## 简历附件解析 gemini.yml

简历附件解析 workflow 的 Gemini 变体，和 optimized 版同契约：输入 `resume_file`，输出 `text`（`schema_version: "resume.parse.v1"` 的 `AIParsedResumeDraft` JSON）。

编排：文档提取器 → 文本预处理 Code 节点 → Gemini LLM（`gemini-2.5-flash-lite`）→ 输出归一化 Code 节点。与 optimized 版（DeepSeek）互为可替换的模型选项，切换时只需在 Dify 各自发布并更新 `DIFY_RESUME_PARSE_API_KEY` 指向的 App。

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

## resume_chat Chatflow

简历编辑器 AI 对话使用 Dify Chatflow，通过 `supabase/functions/resume-chat` 调用，不从前端直接访问 Dify。

配置文件：[`dify/resume_chat.yml`](./resume_chat.yml)。

输入约定：

- `query`：用户本轮修改要求。
- `inputs.current_resume_json`：当前 `ResumeDocument` JSON 字符串。
- `inputs.resume_id`：当前简历 ID。
- `inputs.selected_module_id`：可选的模块上下文 ID。
- `inputs.selected_module_json`：可选的模块上下文 JSON 字符串。

输出约定：Chatflow 的 `answer` 需要包含可解析 JSON，推荐形状：

```json
{
  "shouldCreatePatch": true,
  "message": "我生成了 1 个模块的修改建议。请先查看预览高亮和 Diff，再决定采纳或拒绝。",
  "title": "压缩表达并保留关键信息",
  "description": "根据用户要求调整工作经历，只修改模块内容，不修改简历名称。",
  "changes": [
    {
      "moduleId": "module-personal",
      "data": {
        "id": "module-personal",
        "kind": "personal",
        "visible": true,
        "personal": {
          "city": "杭州"
        }
      }
    }
  ],
  "evidenceRefs": ["当前简历正文中的原始模块内容", "用户本次输入的修改要求"],
  "riskNotes": ["采纳前建议人工确认表达没有超出真实经历边界。"]
}
```

`data` 可以只包含被修改的字段。Dify Code 节点和 Edge Function 都会用当前简历里的原模块合并成完整 `ResumeModule`，所以模型不需要重写头像、联系方式等未修改字段。后端会忽略 Dify 返回的 `original`，始终用当前简历里的模块快照补齐 `ResumePatch.original`，并校验 `changes[].moduleId`、`data.id`、`data.kind` 与原模块一致。

如果用户只是寒暄、测试或没有提出明确可执行的简历修改要求，Chatflow 应返回：

```json
{
  "shouldCreatePatch": false,
  "message": "请告诉我你希望修改简历的具体方向，例如压缩某段经历或移除无关技能。",
  "title": "需要补充修改要求",
  "description": "本轮没有生成简历修改建议。",
  "changes": [],
  "evidenceRefs": ["用户本次输入的修改要求"],
  "riskNotes": []
}
```

此时 Edge Function 返回 `patch: null`，前端只展示 assistant 文本，不锁定内容 tab，也不创建修改日志。

接入方式：

1. 在 Dify 导入 `dify/resume_chat.yml`，发布后拿到该 app 的 API Key。
2. 在 Supabase Edge Functions 配置 `DIFY_RESUME_CHAT_API_KEY`。
3. 前端入口是简历编辑器 AI 助手；未配置 key 时本地开发会回退到 mock provider。
