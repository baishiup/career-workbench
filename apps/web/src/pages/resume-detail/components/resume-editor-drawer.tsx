"use client";

import { Drawer, useOverlayState } from "@heroui/react";

import type { ResumeFunctionRow } from "@/lib/resumes/types";

import { ResumeEditorWorkspace } from "./resume-editor-workspace";

type ResumeEditorDrawerProps = {
  onClose: () => void;
  onSaved?: (resume: ResumeFunctionRow) => void;
  open: boolean;
  resume: ResumeFunctionRow | null;
};

function ResumeEditorDrawer({
  onClose,
  onSaved,
  open,
  resume,
}: ResumeEditorDrawerProps) {
  const drawerState = useOverlayState({
    isOpen: open,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) {
        onClose();
      }
    },
  });

  return (
    <Drawer state={drawerState}>
      <Drawer.Backdrop isDismissable>
        <Drawer.Content className="justify-end" placement="right">
          <Drawer.Dialog className="flex h-dvh w-[min(1280px,100vw)] max-w-[100vw] flex-col border-l border-slate-200 bg-white p-0 shadow-2xl sm:w-[min(1280px,96vw)]">
            <Drawer.Header className="shrink-0 flex-row items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <Drawer.Heading className="truncate text-lg font-semibold">
                  {resume?.title ?? "简历"}
                </Drawer.Heading>
              </div>
              <Drawer.CloseTrigger
                aria-label="关闭简历编辑器"
                className="shrink-0"
              />
            </Drawer.Header>
            <Drawer.Body className="m-0 box-border min-h-0 w-full min-w-0 max-w-full flex-1 overflow-hidden bg-white p-0 text-slate-900">
              {resume ? (
                <ResumeEditorWorkspace
                  className="h-full w-full min-w-0 gap-0"
                  key={resume.id}
                  onSaved={onSaved}
                  previewSurface="flush"
                  resume={resume}
                />
              ) : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export { ResumeEditorDrawer };
