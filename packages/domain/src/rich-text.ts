/**
 * 富文本模型：直接采用 Quill Delta 作为存储格式。
 *
 * Profile 和简历共用同一套字段类型，凡是"说明 / 描述 / 自定义内容"这类
 * 长文本统一用 RichText（Quill Delta）存储到 jsonb。这里只放纯函数：
 * 文本 <-> Delta 转换、旧数据兜底、以及 Delta -> HTML 的只读渲染。
 * 无 DOM、无 Quill 运行时依赖，前后端和领域层都可安全引入。
 */

/** Quill Delta 的单个操作；存储态内容只用 insert（不含 retain/delete）。 */
type RichTextOp = {
  insert: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
};

/** 富文本字段的存储形态，等价于 Quill 的 Delta 文档。 */
type RichText = {
  ops: RichTextOp[];
};

/** 空 Delta：Quill 的空文档始终带一个换行。 */
const emptyRichText: RichText = { ops: [{ insert: "\n" }] };

/** 判断任意值是否为合法 Delta 文档。 */
function isRichText(value: unknown): value is RichText {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { ops?: unknown }).ops)
  );
}

/** 把纯文本（可含换行）转换成 Delta。 */
function textToRichText(text: string | null | undefined): RichText {
  const normalized = (text ?? "").replace(/\r\n/g, "\n");

  if (!normalized.trim()) {
    return { ops: [{ insert: "\n" }] };
  }

  const withTrailingNewline = normalized.endsWith("\n")
    ? normalized
    : `${normalized}\n`;

  return { ops: [{ insert: withTrailingNewline }] };
}

/**
 * 把"摘要段落 + 要点列表"合并成单个 Delta。
 * 用于 work / project 把旧的 summary + bullets 收敛成一段富文本。
 */
function mergeTextAndBulletsToRichText(
  summary: string | null | undefined,
  bullets: readonly string[] | null | undefined,
): RichText {
  const ops: RichTextOp[] = [];
  const summaryText = (summary ?? "").trim();
  const bulletItems = (bullets ?? [])
    .map((bullet) => (bullet ?? "").trim())
    .filter(Boolean);

  if (summaryText) {
    ops.push({ insert: `${summaryText}\n` });
  }

  for (const item of bulletItems) {
    ops.push({ insert: item });
    ops.push({ insert: "\n", attributes: { list: "bullet" } });
  }

  if (ops.length === 0) {
    ops.push({ insert: "\n" });
  }

  return { ops };
}

/** 把任意（可能是旧版纯字符串）值兜底成 Delta，用于读取时升级。 */
function coerceRichText(value: unknown): RichText {
  if (isRichText(value)) {
    return value;
  }

  if (typeof value === "string") {
    return textToRichText(value);
  }

  return { ops: [{ insert: "\n" }] };
}

/** Delta -> 纯文本，用于匹配分析、AI 输入和无富文本环境的兜底。 */
function richTextToPlainText(
  value: RichText | string | null | undefined,
): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!isRichText(value)) {
    return "";
  }

  return value.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("")
    .trim();
}

type RichTextInline = {
  text: string;
  attributes: Record<string, unknown>;
};

type RichTextLine = {
  inlines: RichTextInline[];
  block: Record<string, unknown>;
};

/** 把 Delta 拆成"行"，每行带块级属性（list / header 等）。 */
function splitRichTextLines(delta: RichText): RichTextLine[] {
  const lines: RichTextLine[] = [];
  let current: RichTextInline[] = [];

  for (const op of delta.ops) {
    if (typeof op.insert !== "string") {
      continue;
    }

    const segments = op.insert.split("\n");

    segments.forEach((segment, index) => {
      if (segment) {
        current.push({ text: segment, attributes: op.attributes ?? {} });
      }

      // 每个换行结束一行；该行的块级属性来自这个换行 op。
      if (index < segments.length - 1) {
        lines.push({ inlines: current, block: op.attributes ?? {} });
        current = [];
      }
    });
  }

  if (current.length > 0) {
    lines.push({ inlines: current, block: {} });
  }

  return lines;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(inline: RichTextInline): string {
  let html = escapeHtml(inline.text);
  const attrs = inline.attributes;

  if (attrs.bold) {
    html = `<strong>${html}</strong>`;
  }
  if (attrs.italic) {
    html = `<em>${html}</em>`;
  }
  if (attrs.underline) {
    html = `<u>${html}</u>`;
  }
  if (typeof attrs.link === "string" && attrs.link) {
    html = `<a href="${escapeHtml(attrs.link)}" target="_blank" rel="noreferrer">${html}</a>`;
  }

  return html;
}

/**
 * Delta -> HTML 的只读渲染，覆盖段落、有序/无序列表、标题和基础行内样式。
 * 输出用于简历预览和后续 PDF 导出；内容均为用户自有数据。
 */
function renderRichTextToHtml(
  value: RichText | string | null | undefined,
): string {
  const delta = coerceRichText(value);
  const lines = splitRichTextLines(delta);
  const html: string[] = [];
  let listKind: "bullet" | "ordered" | null = null;

  const closeList = () => {
    if (listKind) {
      html.push(listKind === "ordered" ? "</ol>" : "</ul>");
      listKind = null;
    }
  };

  for (const line of lines) {
    const inlineHtml = line.inlines.map(renderInline).join("");
    const list = line.block.list;

    if (list === "bullet" || list === "ordered") {
      const nextKind = list === "ordered" ? "ordered" : "bullet";

      if (listKind !== nextKind) {
        closeList();
        html.push(nextKind === "ordered" ? "<ol>" : "<ul>");
        listKind = nextKind;
      }

      html.push(`<li>${inlineHtml}</li>`);
      continue;
    }

    closeList();

    if (typeof line.block.header === "number") {
      const level = Math.min(Math.max(line.block.header, 1), 6);
      html.push(`<h${level}>${inlineHtml}</h${level}>`);
      continue;
    }

    if (inlineHtml) {
      html.push(`<p>${inlineHtml}</p>`);
    }
  }

  closeList();

  return html.join("");
}

export type { RichText, RichTextOp };

export {
  coerceRichText,
  emptyRichText,
  isRichText,
  mergeTextAndBulletsToRichText,
  renderRichTextToHtml,
  richTextToPlainText,
  textToRichText,
};
