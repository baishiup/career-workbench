import type { DragEvent, MouseEvent, MutableRefObject, ReactNode } from "react";
import { Button } from "@heroui/react";
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
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
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
          <button
            aria-label={`Drag ${title}`}
            className="flex size-8 cursor-grab items-center justify-center rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:cursor-grabbing"
            draggable
            onMouseDown={() => onDragStartIndex(index)}
            onDragStart={handleDragStart}
            type="button"
          >
            <GripVertical className="size-4" />
          </button>
          <h3 className="truncate text-lg font-semibold">{title}</h3>
        </div>
        <Button
          aria-label={`Delete ${title}`}
          isIconOnly
          onPress={onDelete}
          size="sm"
          type="button"
          variant="danger-soft"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

export { SortableEditorCard };
