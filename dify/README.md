# Dify workflows

## 简历附件解析.optimized.yml

这是从 `/Users/hongyuanqi/Downloads/简历附件解析.yml` 生成的优化版，目标是降低简历 PDF 解析的阻塞时间。

主要改动：

- 在 `文档提取器` 和 `LLM` 之间新增 `文本预处理` Code 节点。
- 预处理会清理空行、页码、连续重复行，并把传给 LLM 的文本限制在 18,000 字符以内。
- LLM 节点关闭 reasoning 输出配置，固定 `temperature: 0`、`top_p: 0.2`、`max_tokens: 4096`。
- Prompt 限制单条 bullet、项目数量、工作经历数量、skills 数量，避免输出过长。
- 保持后端契约不变：输入仍是 `resume_file`，最终输出仍是 `text`。

验证方式：

1. 在 Dify 导入 `dify/简历附件解析.optimized.yml`。
2. 用同一份 PDF 连续跑 3 次，和原 workflow 的运行时间取中位数对比。
3. 如果出现长简历信息遗漏，先把 Code 节点里的 `limit` 从 `18000` 调到 `24000`，再测试耗时。

预期效果：

- 对 1-2 页简历，主要减少 LLM 输入和无用 reasoning 等待。
- 对提取文本很脏或很长的 PDF，收益更明显。
- 如果 Dify 的耗时主要卡在文件上传或 Document Extractor，优化幅度会有限，需要再看 Dify 单次运行详情里的节点耗时。
