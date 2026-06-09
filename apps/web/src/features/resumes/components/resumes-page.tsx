"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Chip, Table, Toast } from "@heroui/react";
import { FileText, Upload as UploadIcon } from "lucide-react";

import { listResumes, uploadResume } from "@/features/resumes/api";
import type {
  ResumeFunctionRow,
  ResumeListRow,
} from "@/features/resumes/types";
import { isSupabaseConfigured } from "@/lib/supabase";

const sourceTypeLabels: Record<string, string> = {
  ai_generated: "AI 生成",
  manual_created: "手动创建",
  manual_upload: "上传简历",
  target_job: "定向简历",
};

const statusMeta: Record<
  string,
  { color: "danger" | "default" | "success"; label: string }
> = {
  archived: { color: "default", label: "已归档" },
  draft: { color: "default", label: "草稿" },
  generation_failed: { color: "danger", label: "生成失败" },
  parse_failed: { color: "danger", label: "解析失败" },
  ready: { color: "success", label: "已解析" },
};

export function ResumesPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<ResumeListRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">简历</h1>
          <p className="text-sm text-slate-500">
            管理已上传的基础简历和解析状态。
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
                  <Table.Column>状态</Table.Column>
                  <Table.Column>更新时间</Table.Column>
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
                      <Table.Cell>
                        <StatusChip status={row.status} />
                      </Table.Cell>
                      <Table.Cell>{formatDateTime(row.updated_at)}</Table.Cell>
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
                上传一份基础简历后，这里会显示解析状态、来源和更新时间。
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const meta = statusMeta[status] ?? {
    color: "default" as const,
    label: status,
  };

  return (
    <Chip color={meta.color} size="sm" variant="soft">
      {meta.label}
    </Chip>
  );
}

function toResumeListRow(row: ResumeFunctionRow): ResumeListRow {
  return {
    created_at: row.created_at,
    id: row.id,
    source_type: row.source_type,
    status: row.status,
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
