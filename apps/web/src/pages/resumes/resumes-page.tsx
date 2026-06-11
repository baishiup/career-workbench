"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Dropdown,
  Input,
  Table,
  Toast,
} from "@heroui/react";
import {
  ChevronDown,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload as UploadIcon,
  UserRoundCheck,
  X,
} from "lucide-react";

import Link from "@/components/router-link";
import {
  applyResumeToProfile,
  deleteResume,
  listResumes,
  renameResume,
  uploadResume,
} from "@/lib/resumes/api";
import type {
  ResumeFunctionRow,
  ResumeListRow,
} from "@/lib/resumes/types";
import { isSupabaseConfigured } from "@/lib/supabase";

const sourceTypeLabels: Record<string, string> = {
  ai_generated: "AI 生成",
  manual_created: "手动创建",
  manual_upload: "上传简历",
  target_job: "定向简历",
};

type MoreAction = "apply-profile" | "delete" | "export" | "rename";

export function ResumesPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<ResumeListRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [renameDialogRow, setRenameDialogRow] =
    useState<ResumeListRow | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renamingResumeId, setRenamingResumeId] = useState<string | null>(null);
  const [profileDialogRow, setProfileDialogRow] =
    useState<ResumeListRow | null>(null);
  const [applyingProfileResumeId, setApplyingProfileResumeId] =
    useState<string | null>(null);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      setLoadError("Supabase 环境变量未配置，无法读取真实简历列表。");
      return;
    }

    let didCancel = false;

    async function loadRows() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextRows = await listResumes();

        if (!didCancel) {
          setRows(nextRows);
        }
      } catch (error) {
        if (!didCancel) {
          setLoadError(getErrorMessage(error, "简历列表读取失败。"));
        }
      } finally {
        if (!didCancel) {
          setIsLoading(false);
        }
      }
    }

    void loadRows();

    return () => {
      didCancel = true;
    };
  }, []);

  async function handleUpload(file: File) {
    if (!isSupportedResumeFile(file)) {
      Toast.toast.danger("仅支持 PDF、DOC、DOCX、RTF 格式。");
      return;
    }

    setIsUploading(true);
    setLoadError(null);

    try {
      const result = await uploadResume(file);
      const nextRow = toResumeListRow(result.resume);

      setRows((currentRows) => [
        nextRow,
        ...currentRows.filter((row) => row.id !== nextRow.id),
      ]);
      Toast.toast.success("简历上传并解析完成。");
    } catch (error) {
      console.error("[upload-resume error]", error);
      const errorMessage = getErrorMessage(error, "简历上传失败。");
      setLoadError(errorMessage);
      Toast.toast.danger(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  function handleMoreAction(action: string, row: ResumeListRow) {
    const nextAction = action as MoreAction;

    if (nextAction === "rename") {
      setRenameDialogRow(row);
      setRenameTitle(row.title);
      return;
    }

    if (nextAction === "apply-profile") {
      setProfileDialogRow(row);
      return;
    }

    if (nextAction === "export") {
      Toast.toast.info("开发中");
      return;
    }

    if (nextAction === "delete") {
      void handleDeleteResume(row);
    }
  }

  async function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!renameDialogRow || renamingResumeId) {
      return;
    }

    const nextTitle = renameTitle.trim();

    if (!nextTitle) {
      Toast.toast.danger("简历名称不能为空。");
      return;
    }

    setRenamingResumeId(renameDialogRow.id);

    try {
      const nextRow = await renameResume(renameDialogRow.id, nextTitle);

      setRows((currentRows) =>
        currentRows.map((row) => row.id === nextRow.id ? nextRow : row),
      );
      setRenameDialogRow(null);
      Toast.toast.success("简历名称已更新。");
    } catch (error) {
      Toast.toast.danger(getErrorMessage(error, "简历名称保存失败。"));
    } finally {
      setRenamingResumeId(null);
    }
  }

  async function handleApplyResumeToProfile() {
    if (!profileDialogRow || applyingProfileResumeId) {
      return;
    }

    setApplyingProfileResumeId(profileDialogRow.id);

    try {
      await applyResumeToProfile(profileDialogRow.id);
      setProfileDialogRow(null);
      Toast.toast.success("已用这份简历更新 profile。");
    } catch (error) {
      Toast.toast.danger(getErrorMessage(error, "更新 profile 失败。"));
    } finally {
      setApplyingProfileResumeId(null);
    }
  }

  async function handleDeleteResume(row: ResumeListRow) {
    if (deletingResumeId) {
      return;
    }

    if (rows.length <= 1) {
      Toast.toast.danger("至少保留一份简历。");
      return;
    }

    setDeletingResumeId(row.id);

    try {
      await deleteResume(row.id);
      setRows((currentRows) =>
        currentRows.filter((currentRow) => currentRow.id !== row.id),
      );
      Toast.toast.success("简历已删除。");
    } catch (error) {
      Toast.toast.danger(getErrorMessage(error, "简历删除失败。"));
    } finally {
      setDeletingResumeId(null);
    }
  }

  const isRenameSaving = Boolean(
    renameDialogRow && renamingResumeId === renameDialogRow.id,
  );
  const isProfileApplying = Boolean(
    profileDialogRow && applyingProfileResumeId === profileDialogRow.id,
  );
  const isRenameTitleValid = renameTitle.trim().length > 0;

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">简历</h1>
          <p className="text-sm text-slate-500">
            管理已上传的基础简历。
          </p>
        </div>
        <input
          accept=".pdf,.doc,.docx,.rtf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleUpload(file);
            }
          }}
          ref={fileInputRef}
          type="file"
        />
        <Button
          isDisabled={!isSupabaseConfigured || isUploading}
          onPress={() => fileInputRef.current?.click()}
          type="button"
          variant="primary"
        >
          <UploadIcon className="size-4" />
          {isUploading ? "上传中..." : "上传简历"}
        </Button>
      </div>

      {loadError ? (
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>简历列表不可用</Alert.Title>
            <Alert.Description>{loadError}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div>
        {isLoading ? (
          <div className="flex min-h-40 items-center px-5 py-6 text-sm font-medium text-slate-500">
            正在读取简历列表...
          </div>
        ) : null}

        {!isLoading && rows.length > 0 ? (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="简历列表">
                <Table.Header>
                  <Table.Column isRowHeader>简历名称</Table.Column>
                  <Table.Column>来源</Table.Column>
                  <Table.Column>更新时间</Table.Column>
                  <Table.Column>操作</Table.Column>
                </Table.Header>
                <Table.Body items={rows}>
                  {(row) => (
                    <Table.Row id={row.id}>
                      <Table.Cell>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                            <FileText aria-hidden="true" className="size-4" />
                          </span>
                          <span className="truncate font-medium">
                            {row.title}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {sourceTypeLabels[row.source_type] ?? row.source_type}
                      </Table.Cell>
                      <Table.Cell>{formatDateTime(row.updated_at)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Link
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35"
                            href={`/resumes/${row.id}`}
                          >
                            <Eye aria-hidden="true" className="size-4" />
                            查看
                          </Link>

                          <Dropdown>
                            <Dropdown.Trigger
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-400/35 disabled:cursor-not-allowed disabled:opacity-50"
                              isDisabled={
                                !isSupabaseConfigured ||
                                isRowMutating(row.id, {
                                  applyingProfileResumeId,
                                  deletingResumeId,
                                  renamingResumeId,
                                })
                              }
                            >
                              {deletingResumeId === row.id ||
                              applyingProfileResumeId === row.id ||
                              renamingResumeId === row.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="size-4" />
                              )}
                              更多
                              <ChevronDown className="size-3.5" />
                            </Dropdown.Trigger>
                            <Dropdown.Popover placement="bottom end">
                              <Dropdown.Menu
                                aria-label={`${row.title} 操作`}
                                onAction={(key) =>
                                  handleMoreAction(String(key), row)
                                }
                              >
                                <Dropdown.Item id="rename" textValue="修改名称">
                                  <MenuItemContent
                                    icon={<Pencil className="size-4" />}
                                    label="修改名称"
                                  />
                                </Dropdown.Item>
                                <Dropdown.Item
                                  id="apply-profile"
                                  textValue="更新到 profile"
                                >
                                  <MenuItemContent
                                    icon={
                                      <UserRoundCheck className="size-4" />
                                    }
                                    label="更新到 profile"
                                  />
                                </Dropdown.Item>
                                <Dropdown.Item id="export" textValue="导出">
                                  <MenuItemContent
                                    icon={<Download className="size-4" />}
                                    label="导出"
                                  />
                                </Dropdown.Item>
                                <Dropdown.Item id="delete" textValue="删除">
                                  <MenuItemContent
                                    className="text-red-600"
                                    icon={<Trash2 className="size-4" />}
                                    label="删除"
                                  />
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown.Popover>
                          </Dropdown>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : null}

        {!isLoading && rows.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-semibold">还没有简历记录</p>
              <p className="mt-1 text-sm text-slate-500">
                上传一份基础简历后，这里会显示来源和更新时间。
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {renameDialogRow ? (
        <DialogShell
          closeLabel="关闭修改名称弹窗"
          isCloseDisabled={isRenameSaving}
          onClose={() => setRenameDialogRow(null)}
          title="修改简历名称"
        >
          <form className="flex flex-col gap-4" onSubmit={handleRenameSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">
                简历名称
              </span>
              <Input
                autoFocus
                disabled={isRenameSaving}
                fullWidth
                onChange={(event) => setRenameTitle(event.target.value)}
                value={renameTitle}
                variant="secondary"
              />
            </label>
            {!isRenameTitleValid ? (
              <p className="text-sm font-medium text-red-600">
                简历名称不能为空。
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                isDisabled={isRenameSaving}
                onPress={() => setRenameDialogRow(null)}
                type="button"
                variant="tertiary"
              >
                取消
              </Button>
              <Button
                isDisabled={isRenameSaving || !isRenameTitleValid}
                type="submit"
                variant="primary"
              >
                {isRenameSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Pencil className="size-4" />
                )}
                {isRenameSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </DialogShell>
      ) : null}

      {profileDialogRow ? (
        <DialogShell
          closeLabel="关闭更新 profile 确认弹窗"
          isCloseDisabled={isProfileApplying}
          onClose={() => setProfileDialogRow(null)}
          title="更新到 profile"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-slate-600">
              确认后会用「{profileDialogRow.title}」的解析数据覆盖当前用户
              profile。这个操作会写入 Supabase。
            </p>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button
                isDisabled={isProfileApplying}
                onPress={() => setProfileDialogRow(null)}
                type="button"
                variant="tertiary"
              >
                取消
              </Button>
              <Button
                isDisabled={isProfileApplying}
                onPress={() => void handleApplyResumeToProfile()}
                type="button"
                variant="primary"
              >
                {isProfileApplying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserRoundCheck className="size-4" />
                )}
                {isProfileApplying ? "更新中..." : "确认更新"}
              </Button>
            </div>
          </div>
        </DialogShell>
      ) : null}
    </section>
  );
}

function MenuItemContent({
  className = "",
  icon,
  label,
}: {
  className?: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function DialogShell({
  children,
  closeLabel,
  isCloseDisabled = false,
  onClose,
  title,
}: {
  children: ReactNode;
  closeLabel: string;
  isCloseDisabled?: boolean;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <Button
        aria-label={closeLabel}
        className="absolute inset-0 bg-slate-950/30"
        isDisabled={isCloseDisabled}
        onPress={onClose}
        type="button"
        variant="tertiary"
      />
      <div
        aria-modal="true"
        className="relative z-10 flex w-full max-w-[480px] flex-col rounded-xl border border-slate-200 bg-white p-0 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button
            aria-label={closeLabel}
            isDisabled={isCloseDisabled}
            isIconOnly
            onPress={onClose}
            type="button"
            variant="tertiary"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function isRowMutating(
  rowId: string,
  state: {
    applyingProfileResumeId: string | null;
    deletingResumeId: string | null;
    renamingResumeId: string | null;
  },
) {
  return (
    state.applyingProfileResumeId === rowId ||
    state.deletingResumeId === rowId ||
    state.renamingResumeId === rowId
  );
}

function toResumeListRow(row: ResumeFunctionRow): ResumeListRow {
  return {
    created_at: row.created_at,
    id: row.id,
    source_type: row.source_type,
    title: row.title,
    updated_at: row.updated_at,
  };
}

function isSupportedResumeFile(file: File) {
  return /\.(pdf|docx?|rtf)$/i.test(file.name);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
