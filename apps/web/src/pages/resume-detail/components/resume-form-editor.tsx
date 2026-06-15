"use client";

import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@heroui/react";
import {
  type EducationItem,
  emptyRichText,
  type PersonalInfo,
  type ProjectItem,
  type ResumeDocument,
  type ResumeModule,
  type WorkItem,
} from "@career-workbench/domain";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";

import { createId } from "@/pages/profile/utils";
import { PersonalForm } from "@/pages/profile/components/personal-form";
import {
  CustomModuleFields,
  EducationItemFields,
  PreferencesForm,
  ProjectItemFields,
  SkillsForm,
  WorkItemFields,
} from "@/pages/profile/components/profile-forms";
import { TextField } from "@/pages/profile/components/profile-fields";
import { cn } from "@/lib/utils";

type ResumeFormEditorProps = {
  document: ResumeDocument;
  onDocumentChange: (document: ResumeDocument) => void;
  sectionFocusSignal: number;
  onSectionFocus: (moduleId: string) => void;
  selectedSectionId: string | null;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

const moduleTitles: Record<ResumeModule["kind"], string> = {
  custom: "自定义模块",
  education: "教育经历",
  personal: "个人信息",
  preferences: "求职方向",
  projects: "项目经历",
  skills: "技能",
  work: "工作经历",
};

function emptyEducationItem(): EducationItem {
  return {
    id: createId("edu"),
    school: "",
    degree: "",
    major: "",
    startDate: "",
    endDate: "",
    current: false,
    description: emptyRichText,
  };
}

function emptyWorkItem(): WorkItem {
  return {
    id: createId("work"),
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    current: false,
    description: emptyRichText,
    skills: [],
  };
}

function emptyProjectItem(): ProjectItem {
  return {
    id: createId("project"),
    name: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    description: emptyRichText,
    skills: [],
  };
}

function ResumeFormEditor({
  document,
  onDocumentChange,
  sectionFocusSignal,
  onSectionFocus,
  selectedSectionId,
  scrollContainerRef,
}: ResumeFormEditorProps) {
  const [openModuleIds, setOpenModuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(MouseSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (selectedSectionId && sectionFocusSignal > 0) {
      setOpenModuleIds((current) => {
        const next = new Set(current);
        next.add(selectedSectionId);
        return next;
      });
    }
  }, [sectionFocusSignal, selectedSectionId]);

  function updateDocument(patch: Partial<ResumeDocument>) {
    onDocumentChange({ ...document, ...patch });
  }

  function replaceModule(nextModule: ResumeModule) {
    onDocumentChange({
      ...document,
      modules: document.modules.map((module) =>
        module.id === nextModule.id ? nextModule : module,
      ),
    });
  }

  function patchModuleBase(moduleId: string, patch: { visible?: boolean }) {
    onDocumentChange({
      ...document,
      modules: document.modules.map((module) =>
        module.id === moduleId ? { ...module, ...patch } : module,
      ),
    });
  }

  function moveModule(from: number, to: number) {
    if (from === to || to < 0 || to >= document.modules.length) {
      return;
    }

    const nextModules = [...document.modules];
    const [moved] = nextModules.splice(from, 1);
    nextModules.splice(to, 0, moved);
    onDocumentChange({ ...document, modules: nextModules });
  }

  function reorderModule(activeId: string, overId: string) {
    if (activeId === overId) {
      return;
    }

    const from = document.modules.findIndex((module) => module.id === activeId);
    const to = document.modules.findIndex((module) => module.id === overId);

    if (from === -1 || to === -1) {
      return;
    }

    onDocumentChange({
      ...document,
      modules: arrayMove(document.modules, from, to),
    });
  }

  function toggleModuleOpen(moduleId: string) {
    setOpenModuleIds((current) => {
      const next = new Set(current);

      if (next.has(moduleId)) {
        next.delete(moduleId);
        return next;
      }

      next.add(moduleId);
      return next;
    });
  }

  function handleDragStart(_event: DragStartEvent) {
    setOpenModuleIds(new Set());
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id;

    if (overId) {
      reorderModule(String(event.active.id), String(overId));
    }

    setOpenModuleIds(new Set());
  }

  function deleteModule(moduleId: string) {
    onDocumentChange({
      ...document,
      modules: document.modules.filter((module) => module.id !== moduleId),
    });
  }

  function addCustomModule() {
    const module: ResumeModule = {
      id: createId("module-custom"),
      kind: "custom",
      visible: true,
      module: {
        id: createId("custom"),
        name: "自定义模块",
        content: emptyRichText,
      },
    };

    onDocumentChange({ ...document, modules: [...document.modules, module] });
    onSectionFocus(module.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
          简历信息
        </div>
        <TextField
          label="简历名称"
          onChange={(title) => updateDocument({ title })}
          value={document.title}
        />
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">
            模块
          </h3>
          <span className="text-[11px] font-semibold text-slate-300">
            {document.modules.length}
          </span>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={document.modules.map((module) => module.id)}
          strategy={verticalListSortingStrategy}
        >
          {document.modules.map((module, index) => (
            <ModuleEditor
              canMoveDown={index < document.modules.length - 1}
              canMoveUp={index > 0}
              isOpen={openModuleIds.has(module.id)}
              isSelected={selectedSectionId === module.id}
              key={module.id}
              module={module}
              onDelete={() => deleteModule(module.id)}
              onMoveDown={() => moveModule(index, index + 1)}
              onMoveUp={() => moveModule(index, index - 1)}
              onReplace={replaceModule}
              onToggleOpen={() => toggleModuleOpen(module.id)}
              onToggleVisible={() =>
                patchModuleBase(module.id, { visible: !module.visible })
              }
              scrollContainerRef={scrollContainerRef}
              sectionFocusSignal={sectionFocusSignal}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        className="self-start rounded-[7px] border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-100"
        onPress={addCustomModule}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        添加自定义模块
      </Button>
    </div>
  );
}

function ModuleEditor({
  canMoveDown,
  canMoveUp,
  isOpen,
  isSelected,
  module,
  onDelete,
  onMoveDown,
  onMoveUp,
  onReplace,
  onToggleOpen,
  onToggleVisible,
  scrollContainerRef,
  sectionFocusSignal,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  isOpen: boolean;
  isSelected: boolean;
  module: ResumeModule;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onReplace: (module: ResumeModule) => void;
  onToggleOpen: () => void;
  onToggleVisible: () => void;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  sectionFocusSignal: number;
}) {
  const [isFlashing, setIsFlashing] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: module.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function setRefs(node: HTMLElement | null) {
    sectionRef.current = node;
    setNodeRef(node);
  }

  useEffect(() => {
    if (isSelected && sectionFocusSignal > 0) {
      setIsFlashing(true);

      requestAnimationFrame(() => {
        const container = scrollContainerRef?.current;
        const target = sectionRef.current;

        if (container && target) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          container.scrollTo({
            behavior: "smooth",
            top: Math.max(
              0,
              container.scrollTop + targetRect.top - containerRect.top - 12,
            ),
          });
        } else {
          sectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });

      const timer = window.setTimeout(() => setIsFlashing(false), 900);

      return () => window.clearTimeout(timer);
    }
  }, [isSelected, scrollContainerRef, sectionFocusSignal]);

  const title =
    module.kind === "custom"
      ? module.module.name || moduleTitles.custom
      : moduleTitles[module.kind];

  return (
    <section
      data-resume-module-id={module.id}
      ref={setRefs}
      className={cn(
        "group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,opacity]",
        isFlashing && "border-blue-400 ring-3 ring-blue-400/25",
        isDragging && "relative z-10 opacity-70 shadow-lg",
        !module.visible && "opacity-60",
      )}
      style={style}
    >
      <div
        className={cn(
          "flex cursor-pointer items-center gap-2.5 bg-slate-50 px-3 py-2.5",
          isOpen && "border-b border-slate-100",
        )}
        onClick={onToggleOpen}
      >
        <DragHandleButton
          attributes={attributes}
          listeners={listeners}
          setActivatorNodeRef={setActivatorNodeRef}
          title={title}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900">
          {title}
        </span>
        {module.kind === "custom" ? (
          <span
            className="rounded-[5px] bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-slate-400"
            data-module-kind-badge
          >
            {moduleTitles[module.kind]}
          </span>
        ) : null}
        <div
          className="pointer-events-none flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          data-module-controls
        >
          {isOpen ? (
            <>
              <IconButton
                icon={module.visible ? Eye : EyeOff}
                label={module.visible ? "隐藏模块" : "显示模块"}
                onPress={onToggleVisible}
              />
              <IconButton
                disabled={!canMoveUp}
                icon={ChevronUp}
                label="上移模块"
                onPress={onMoveUp}
              />
              <IconButton
                disabled={!canMoveDown}
                icon={ChevronDown}
                label="下移模块"
                onPress={onMoveDown}
              />
            </>
          ) : null}
          {isOpen && module.kind === "custom" ? (
            <IconButton
              icon={Trash2}
              label="删除模块"
              onPress={onDelete}
              variant="danger-soft"
            />
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className="p-3">
          <ModuleBodyEditor module={module} onReplace={onReplace} />
        </div>
      ) : null}
    </section>
  );
}

function ModuleBodyEditor({
  module,
  onReplace,
}: {
  module: ResumeModule;
  onReplace: (module: ResumeModule) => void;
}) {
  switch (module.kind) {
    case "personal": {
      const updatePersonal = <K extends keyof PersonalInfo>(
        key: K,
        value: PersonalInfo[K],
      ) =>
        onReplace({
          ...module,
          personal: { ...module.personal, [key]: value },
        });

      return (
        <PersonalForm
          onPersonalChange={updatePersonal}
          personal={module.personal}
        />
      );
    }
    case "preferences":
      return (
        <PreferencesForm
          onPreferencesChange={(patch) =>
            onReplace({
              ...module,
              preferences: { ...module.preferences, ...patch },
            })
          }
          preferences={module.preferences}
        />
      );
    case "skills":
      return (
        <SkillsForm
          onChange={(skills) => onReplace({ ...module, skills })}
          skills={module.skills}
        />
      );
    case "education":
      return (
        <ModuleItemList
          addLabel="添加教育经历"
          items={module.items}
          onAdd={() =>
            onReplace({
              ...module,
              items: [...module.items, emptyEducationItem()],
            })
          }
          onDelete={(id) =>
            onReplace({
              ...module,
              items: module.items.filter((item) => item.id !== id),
            })
          }
          renderItem={(item) => (
            <EducationItemFields
              item={item}
              onChange={(patch) =>
                onReplace({
                  ...module,
                  items: module.items.map((current) =>
                    current.id === item.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
      );
    case "work":
      return (
        <ModuleItemList
          addLabel="添加工作经历"
          items={module.items}
          onAdd={() =>
            onReplace({ ...module, items: [...module.items, emptyWorkItem()] })
          }
          onDelete={(id) =>
            onReplace({
              ...module,
              items: module.items.filter((item) => item.id !== id),
            })
          }
          renderItem={(item) => (
            <WorkItemFields
              item={item}
              onChange={(patch) =>
                onReplace({
                  ...module,
                  items: module.items.map((current) =>
                    current.id === item.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
      );
    case "projects":
      return (
        <ModuleItemList
          addLabel="添加项目经历"
          items={module.items}
          onAdd={() =>
            onReplace({
              ...module,
              items: [...module.items, emptyProjectItem()],
            })
          }
          onDelete={(id) =>
            onReplace({
              ...module,
              items: module.items.filter((item) => item.id !== id),
            })
          }
          renderItem={(item) => (
            <ProjectItemFields
              item={item}
              onChange={(patch) =>
                onReplace({
                  ...module,
                  items: module.items.map((current) =>
                    current.id === item.id ? { ...current, ...patch } : current,
                  ),
                })
              }
            />
          )}
        />
      );
    case "custom":
      return (
        <CustomModuleFields
          item={module.module}
          onChange={(patch) =>
            onReplace({ ...module, module: { ...module.module, ...patch } })
          }
        />
      );
    default:
      return null;
  }
}

function ModuleItemList<TItem extends { id: string }>({
  addLabel,
  items,
  onAdd,
  onDelete,
  renderItem,
}: {
  addLabel: string;
  items: TItem[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  renderItem: (item: TItem) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div
          className="rounded-[10px] border border-slate-200 p-3"
          key={item.id}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              {index + 1}
            </span>
            <IconButton
              icon={Trash2}
              label="删除条目"
              onPress={() => onDelete(item.id)}
              variant="danger-soft"
            />
          </div>
          {renderItem(item)}
        </div>
      ))}
      <Button
        className="self-start rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
        onPress={onAdd}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="size-4" />
        {addLabel}
      </Button>
    </div>
  );
}

function DragHandleButton({
  attributes,
  listeners,
  setActivatorNodeRef,
  title,
}: {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef: ReturnType<typeof useSortable>["setActivatorNodeRef"];
  title: string;
}) {
  return (
    <Button
      {...attributes}
      {...listeners}
      aria-label={`拖拽排序：${title}`}
      className="inline-flex size-[26px] cursor-grab items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900 active:cursor-grabbing"
      isIconOnly
      onClick={(event) => event.stopPropagation()}
      ref={setActivatorNodeRef}
      size="sm"
      type="button"
      variant="tertiary"
    >
      <GripVertical className="size-[15px]" />
    </Button>
  );
}

function IconButton({
  disabled = false,
  icon: Icon,
  label,
  onPress,
  variant = "tertiary",
}: {
  disabled?: boolean;
  icon: typeof Eye;
  label: string;
  onPress: () => void;
  variant?: "danger-soft" | "tertiary";
}) {
  return (
    <Button
      aria-label={label}
      className={cn(
        "inline-flex size-[26px] items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900",
        variant === "danger-soft" &&
          "text-slate-400 hover:bg-red-100 hover:text-red-600",
      )}
      isDisabled={disabled}
      isIconOnly
      onClick={(event) => event.stopPropagation()}
      onPress={onPress}
      size="sm"
      type="button"
      variant={variant}
    >
      <Icon className="size-[15px]" />
    </Button>
  );
}

export { ResumeFormEditor };
