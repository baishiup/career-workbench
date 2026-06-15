"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import { coerceRichText, type RichText } from "@career-workbench/domain";

import "quill/dist/quill.snow.css";
import "./rich-text-editor.css";

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "clean"],
];

type RichTextEditorProps = {
  value: RichText;
  onChange: (value: RichText) => void;
  placeholder?: string;
};

/**
 * Quill 2 的薄包装，兼容 React 19（直接操作 ref，不依赖 react-quill）。
 * 内容以 Delta 存储；编辑器只在挂载时初始化一次，外部 value 变化时静默同步，
 * 避免输入时把光标顶回开头或触发回环。
 */
function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const editorElement = document.createElement("div");
    container.appendChild(editorElement);

    const quill = new Quill(editorElement, {
      theme: "snow",
      placeholder,
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    quillRef.current = quill;

    const DeltaCtor = Quill.import("delta") as new (ops?: unknown) => unknown;
    quill.setContents(new DeltaCtor(coerceRichText(value).ops) as never);

    quill.on("text-change", () => {
      onChangeRef.current({ ops: quill.getContents().ops as RichText["ops"] });
    });

    return () => {
      quill.off("text-change");
      quillRef.current = null;
      container.innerHTML = "";
    };
    // 仅挂载时初始化；value 同步在下方独立 effect 处理。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillRef.current;

    if (!quill) {
      return;
    }

    const incoming = coerceRichText(value);

    if (
      JSON.stringify(incoming) ===
      JSON.stringify({ ops: quill.getContents().ops })
    ) {
      return;
    }

    const DeltaCtor = Quill.import("delta") as new (ops?: unknown) => unknown;
    quill.setContents(new DeltaCtor(incoming.ops) as never, "silent");
  }, [value]);

  return <div className="rich-text-editor" ref={containerRef} />;
}

export { RichTextEditor };
