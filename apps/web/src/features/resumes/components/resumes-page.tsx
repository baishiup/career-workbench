"use client";

import { useEffect, useMemo, useState } from "react";

import type { TableProps, UploadProps } from "antd";
import { Alert, Button, message, Table, Tag, Upload } from "antd";
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

const statusMeta: Record<string, { color: string; label: string }> = {
  archived: { color: "default", label: "已归档" },
  draft: { color: "default", label: "草稿" },
  generation_failed: { color: "error", label: "生成失败" },
  parse_failed: { color: "error", label: "解析失败" },
  ready: { color: "success", label: "已解析" },
};

export function ResumesPage() {
  const [messageApi, contextHolder] = message.useMessage();
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
      messageApi.error("仅支持 PDF、DOC、DOCX、RTF 格式。");
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
      messageApi.success("简历上传并解析完成。");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "简历上传失败。");
      setLoadError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  const uploadProps: UploadProps = {
    accept: ".pdf,.doc,.docx,.rtf",
    beforeUpload: (file) => {
      void handleUpload(file);
      return Upload.LIST_IGNORE;
    },
    disabled: isUploading || !isSupabaseConfigured,
    maxCount: 1,
    showUploadList: false,
  };

  const columns: TableProps<ResumeListRow>["columns"] = useMemo(
    () => [
      {
        dataIndex: "title",
        key: "title",
        render: (title: string) => (
          <div className="flex min-w-0 items-center gap-2">
            <FileText
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="truncate font-medium">{title}</span>
          </div>
        ),
        title: "简历名称",
      },
      {
        dataIndex: "source_type",
        key: "source_type",
        render: (sourceType: string) =>
          sourceTypeLabels[sourceType] ?? sourceType,
        title: "来源",
        width: 140,
      },
      {
        dataIndex: "status",
        key: "status",
        render: (status: string) => {
          const meta = statusMeta[status] ?? {
            color: "default",
            label: status,
          };

          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
        title: "状态",
        width: 120,
      },
      {
        dataIndex: "updated_at",
        key: "updated_at",
        render: (updatedAt: string) => formatDateTime(updatedAt),
        title: "更新时间",
        width: 200,
      },
    ],
    [],
  );

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 lg:px-6">
      {contextHolder}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">简历</h1>
          <p className="text-sm text-muted-foreground">
            管理已上传的基础简历和解析状态。
          </p>
        </div>
        <Upload {...uploadProps}>
          <Button
            disabled={!isSupabaseConfigured}
            htmlType="button"
            loading={isUploading}
            type="primary"
          >
            <UploadIcon data-icon="inline-start" />
            上传简历
          </Button>
        </Upload>
      </div>

      {loadError ? (
        <Alert closable message={loadError} showIcon type="error" />
      ) : null}

      <Table<ResumeListRow>
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={{
          hideOnSinglePage: true,
          pageSize: 10,
          showSizeChanger: false,
        }}
        rowKey="id"
        scroll={{ x: 720 }}
      />
    </section>
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
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
