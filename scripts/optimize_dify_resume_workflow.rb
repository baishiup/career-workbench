# frozen_string_literal: true

require "fileutils"
require "yaml"

source_path = ARGV.fetch(0)
target_path = ARGV.fetch(1)

workflow = YAML.safe_load(File.read(source_path), permitted_classes: [Symbol], aliases: true)
graph = workflow.fetch("workflow").fetch("graph")
nodes = graph.fetch("nodes")
edges = graph.fetch("edges")

start_id = "1776749897311"
extractor_id = "1780679045741"
preprocess_id = "1780681000000"
llm_id = "1776749928227"
end_id = "1776750335278"

preprocess_code = <<~JS
  function main({ raw_text }) {
    const source = String(raw_text || "");
    const normalized = source
      .replace(/\\u0000/g, "")
      .replace(/\\r\\n?/g, "\\n")
      .replace(/[ \\t]+/g, " ")
      .split("\\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^page\\s*\\d+\\s*(of\\s*\\d+)?$/i.test(line))
      .filter((line, index, lines) => index === 0 || line !== lines[index - 1])
      .join("\\n")
      .replace(/\\n{3,}/g, "\\n\\n")
      .trim();

    const limit = 18000;
    const cleaned = normalized.length > limit
      ? `${normalized.slice(0, 14000)}\\n\\n[TRUNCATED_BY_PREPROCESSOR]\\n\\n${normalized.slice(-3000)}`
      : normalized;

    return {
      cleaned_text: cleaned,
      original_chars: source.length,
      cleaned_chars: cleaned.length,
      truncated: normalized.length > limit
    };
  }
JS

preprocess_node = {
  "data" => {
    "code" => preprocess_code,
    "code_language" => "javascript",
    "desc" => "清洗 PDF 文本并限制 LLM 输入长度，降低解析耗时。",
    "outputs" => {
      "cleaned_text" => { "children" => nil, "type" => "string" },
      "original_chars" => { "children" => nil, "type" => "number" },
      "cleaned_chars" => { "children" => nil, "type" => "number" },
      "truncated" => { "children" => nil, "type" => "boolean" }
    },
    "selected" => false,
    "title" => "文本预处理",
    "type" => "code",
    "variables" => [
      {
        "value_selector" => [extractor_id, "text"],
        "variable" => "raw_text"
      }
    ]
  },
  "height" => 54,
  "id" => preprocess_id,
  "position" => { "x" => 382.0, "y" => 249.9 },
  "positionAbsolute" => { "x" => 382.0, "y" => 249.9 },
  "selected" => false,
  "sourcePosition" => "right",
  "targetPosition" => "left",
  "type" => "custom",
  "width" => 244
}

nodes.reject! { |node| node["id"] == preprocess_id }
nodes << preprocess_node

llm_node = nodes.fetch(nodes.index { |node| node["id"] == llm_id })
llm_data = llm_node.fetch("data")
llm_data["desc"] = "从预处理后的简历文本抽取结构化 JSON。"
llm_data.delete("reasoning_format")
llm_data.fetch("model")["completion_params"] = {
  "response_format" => "json_object",
  "temperature" => 0,
  "top_p" => 0.2,
  "max_tokens" => 4096
}

system_prompt = <<~PROMPT
  你是一个严格的简历信息抽取器。只从输入文本中抽取明确出现的信息，不推测、不补全、不润色。

  输出要求：
  1. 只输出 JSON 对象，必须符合 Structured Output JSON Schema。
  2. 缺失信息填 null 或空数组。
  3. 日期能确定到月份时用 YYYY-MM；不能确定时规范字段填 null，并保留 raw_date。
  4. 保持原始事实表达，不新增量化结果，不改写为营销文案。
  5. 工作经历、项目、教育按原文顺序输出，不合并不同公司/项目/学校。
  6. 单条 work_experiences/projects 的 bullets 最多 6 条，每条不超过 120 字。
  7. projects 最多 8 条，work_experiences 最多 8 条，skills 最多 60 个。
  8. 文本被预处理截断时，在 parse_warnings 中说明可能遗漏长尾信息。
  9. 无法归类但重要的片段放入 unmapped_text，最多 20 条。
PROMPT

user_prompt = <<~PROMPT
  请解析以下预处理后的 PDF 简历文本：

  原始字符数：{{##{preprocess_id}.original_chars#}}
  输入字符数：{{##{preprocess_id}.cleaned_chars#}}
  是否截断：{{##{preprocess_id}.truncated#}}

  {{##{preprocess_id}.cleaned_text#}}
PROMPT

templates = llm_data.fetch("prompt_template")
templates[0]["text"] = system_prompt
templates[1]["text"] = user_prompt

llm_node["position"] = { "x" => 720.0, "y" => 234.1 }
llm_node["positionAbsolute"] = { "x" => 720.0, "y" => 234.1 }

end_node = nodes.fetch(nodes.index { |node| node["id"] == end_id })
end_node["position"] = { "x" => 1060.0, "y" => 234.1 }
end_node["positionAbsolute"] = { "x" => 1060.0, "y" => 234.1 }

edges.reject! do |edge|
  edge["source"] == extractor_id && edge["target"] == llm_id
end

edges << {
  "data" => {
    "isInLoop" => false,
    "sourceType" => "document-extractor",
    "targetType" => "code"
  },
  "id" => "#{extractor_id}-source-#{preprocess_id}-target",
  "selected" => false,
  "source" => extractor_id,
  "sourceHandle" => "source",
  "target" => preprocess_id,
  "targetHandle" => "target",
  "type" => "custom",
  "zIndex" => 0
}

edges << {
  "data" => {
    "isInLoop" => false,
    "sourceType" => "code",
    "targetType" => "llm"
  },
  "id" => "#{preprocess_id}-source-#{llm_id}-target",
  "selected" => false,
  "source" => preprocess_id,
  "sourceHandle" => "source",
  "target" => llm_id,
  "targetHandle" => "target",
  "type" => "custom",
  "zIndex" => 0
}

workflow.fetch("app")["name"] = "简历附件解析 optimized"

FileUtils.mkdir_p(File.dirname(target_path))
File.write(target_path, workflow.to_yaml)
