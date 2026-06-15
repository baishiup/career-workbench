import { renderRichTextToHtml, type RichText } from "@career-workbench/domain";

import { cn } from "@/lib/utils";

import "./rich-text-view.css";

type RichTextViewProps = {
  value: RichText | string | null | undefined;
  className?: string;
};

/**
 * 只读渲染富文本（Delta -> HTML）。用于简历预览、Profile 展示和后续 PDF。
 * 内容均为用户自有数据，使用 dangerouslySetInnerHTML 注入。
 */
function RichTextView({ value, className }: RichTextViewProps) {
  return (
    <div
      className={cn("rich-text-view", className)}
      dangerouslySetInnerHTML={{ __html: renderRichTextToHtml(value) }}
    />
  );
}

export { RichTextView };
