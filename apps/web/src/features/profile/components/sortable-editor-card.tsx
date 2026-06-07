import type { DragEvent, MouseEvent, MutableRefObject, ReactNode } from "react";
import { Button } from "antd";
import { GripVertical, Trash2 } from "lucide-react";

function SortableEditorCard({
  children,
  dragIndexRef,
  index,
  onDelete,
  onDragEnd,
  onDragStartIndex,
  onReorder,
  title,
}: {
  children: ReactNode;
  dragIndexRef: MutableRefObject<number | null>;
  index: number;
  onDelete: () => void;
  onDragEnd: () => void;
  onDragStartIndex: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  title: string;
}) {
  function handleDragStart(event: DragEvent<HTMLDivElement | HTMLButtonElement>) {
    onDragStartIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dataTransferIndex = event.dataTransfer.getData("text/plain");
    const from = dataTransferIndex
      ? Number(dataTransferIndex)
      : dragIndexRef.current;
    if (Number.isInteger(from)) {
      onReorder(from as number, index);
    }
    onDragEnd();
  }

  function reorderFromActiveDrag() {
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      return;
    }

    onReorder(from, index);
    dragIndexRef.current = index;
  }

  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    const from = dragIndexRef.current;
    if (from === null) {
      return;
    }

    event.preventDefault();
    if (from !== index) {
      onReorder(from, index);
    }
    onDragEnd();
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      data-testid={`sortable-card-${index}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragEnter={reorderFromActiveDrag}
      onDragEnd={onDragEnd}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onMouseEnter={reorderFromActiveDrag}
      onMouseUp={handleMouseUp}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label={`Drag ${title}`}
            className="cursor-grab rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
            draggable
            htmlType="button"
            icon={<GripVertical className="size-4" />}
            onMouseDown={() => onDragStartIndex(index)}
            onDragStart={handleDragStart}
            size="small"
            type="text"
          />
          <h3 className="truncate text-lg font-semibold">{title}</h3>
        </div>
        <Button
          aria-label={`Delete ${title}`}
          danger
          htmlType="button"
          icon={<Trash2 />}
          onClick={onDelete}
          size="small"
          type="text"
        />
      </div>
      {children}
    </div>
  );
}

export { SortableEditorCard };
