"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  ListBox,
  Select,
  TextArea,
} from "@heroui/react";
import { ArrowLeft, ImagePlus, Loader2, Save, Sparkles, X } from "lucide-react";

import Link from "@/components/router-link";
import { panelClassName } from "@/components/workbench/surface-classes";
import { useAuthStore } from "@/lib/auth-store";
import {
  createJob,
  getJob,
  parseJobDescription,
  updateJob,
  type JobDraftInput,
  type JobParseDraft,
} from "@/lib/jobs/api";
import {
  importMethodLabels,
  jobTypeLabels,
  remoteStatusLabels,
} from "@/lib/jobs/labels";
import type {
  JobEmploymentType,
  JobImportMethod,
  JobRecord,
  JobRemoteStatus,
} from "@/lib/jobs/types";
import { navigateTo } from "@/lib/router";
import { cn } from "@/lib/utils";

const MAX_SCREENSHOTS = 5;
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

/** 表单内部全部用字符串/枚举值，数组字段以换行分隔编辑。 */
type JobFormState = {
  sourcePlatform: string;
  sourceUrl: string;
  company: string;
  title: string;
  companyStage: string;
  location: string;
  remoteStatus: JobRemoteStatus;
  jobType: JobEmploymentType;
  seniority: string;
  yearsRequired: string;
  requiredSkillsText: string;
  preferredSkillsText: string;
  responsibilitiesText: string;
  requirementsText: string;
  salaryRange: string;
  postedAt: string;
  summary: string;
  importMethod: JobImportMethod;
};

const emptyForm: JobFormState = {
  sourcePlatform: "",
  sourceUrl: "",
  company: "",
  title: "",
  companyStage: "",
  location: "",
  remoteStatus: "onsite",
  jobType: "full_time",
  seniority: "",
  yearsRequired: "",
  requiredSkillsText: "",
  preferredSkillsText: "",
  responsibilitiesText: "",
  requirementsText: "",
  salaryRange: "",
  postedAt: "",
  summary: "",
  importMethod: "manual_form",
};

export function JobImportPage({ jobId }: { jobId?: string }) {
  const isEditMode = Boolean(jobId);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const profile = useAuthStore((state) => state.profile);

  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [existingJob, setExistingJob] = useState<JobRecord | null>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [jdText, setJdText] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadExistingJob = useCallback(async () => {
    if (!jobId) {
      return;
    }

    setIsLoadingJob(true);
    setLoadError(null);

    try {
      const result = await getJob(jobId);

      if (!result.job) {
        setLoadError("没有找到这个职位。");
        return;
      }

      setExistingJob(result.job);
      setForm(jobToFormState(result.job));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "读取职位失败。");
    } finally {
      setIsLoadingJob(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadExistingJob();
  }, [loadExistingJob]);

  if (!isConfigured) {
    return (
      <ImportShell title="职位导入不可用">
        <p className="mt-2 text-sm text-slate-500">
          当前是本地演示模式（未配置 Supabase），职位导入需要连接真实数据库。
        </p>
      </ImportShell>
    );
  }

  if (!profile?.isAdmin) {
    return (
      <ImportShell title="没有访问权限">
        <p className="mt-2 text-sm text-slate-500">
          职位导入仅限管理员使用。如需权限请联系管理员在数据库中开通。
        </p>
      </ImportShell>
    );
  }

  if (isEditMode && isLoadingJob) {
    return (
      <ImportShell title="编辑职位">
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          正在加载职位…
        </div>
      </ImportShell>
    );
  }

  if (isEditMode && loadError) {
    return (
      <ImportShell title="编辑职位">
        <Alert className="mt-6" status="danger">
          <Alert.Content>
            <Alert.Title>职位加载失败</Alert.Title>
            <Alert.Description>{loadError}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button
          className="mt-4 w-fit"
          onPress={() => void loadExistingJob()}
          size="sm"
          type="button"
          variant="outline"
        >
          重试
        </Button>
      </ImportShell>
    );
  }

  const handleAddScreenshots = (files: FileList | null) => {
    if (!files) {
      return;
    }

    setScreenshots((current) =>
      [...current, ...Array.from(files)].slice(0, MAX_SCREENSHOTS),
    );
  };

  const handleParse = async () => {
    if (!jdText.trim() && screenshots.length === 0) {
      setParseError("请先粘贴 JD 文本或上传职位截图。");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseWarnings([]);

    const attemptMethod: JobImportMethod =
      screenshots.length > 0 ? "screenshot" : "manual_text";

    try {
      const response = await parseJobDescription({ jdText, screenshots });
      const warnings = response.parsed.parse_warnings;

      setForm((current) =>
        applyParsedDraft(current, response.parsed, {
          importMethod: attemptMethod,
        }),
      );
      setParseWarnings(warnings);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "解析失败。");
      setForm((current) => ({
        ...current,
        importMethod: attemptMethod,
      }));
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.title.trim()) {
      setSaveError("公司和岗位名称是必填字段。");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const input = formStateToDraftInput(form, {
        importedBy:
          existingJob?.importedBy ??
          profile.email ??
          profile.fullName ??
          "admin",
      });
      const saved =
        isEditMode && jobId
          ? await updateJob(jobId, input)
          : await createJob(input);

      navigateTo(`/jobs/${saved.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存职位失败。");
      setIsSaving(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-[960px] flex-col gap-4 px-4 py-5 lg:px-6">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        href={isEditMode && jobId ? `/jobs/${jobId}` : "/jobs"}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {isEditMode ? "返回职位详情" : "返回职位列表"}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEditMode ? "编辑职位" : "导入职位"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          粘贴 JD 文本或上传截图由 AI
          解析预填，也可以直接手动填写；保存前请人工确认。
        </p>
      </div>

      <Card className={panelClassName}>
        <Card.Header>
          <Card.Title>AI 解析预填</Card.Title>
          <Card.Description>
            文本和截图至少提供一个；两者同时提供时以文本为主。解析失败可重试或直接手动填写。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-500">
              JD 文本
            </span>
            <TextArea
              fullWidth
              onChange={(event) => setJdText(event.target.value)}
              placeholder="粘贴完整的职位描述文本…"
              rows={6}
              value={jdText}
              variant="secondary"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <input
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              multiple
              onChange={(event) => {
                handleAddScreenshots(event.target.files);
                event.target.value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
            <Button
              isDisabled={screenshots.length >= MAX_SCREENSHOTS}
              onPress={() => fileInputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ImagePlus className="size-4" />
              上传职位截图
            </Button>
            <span className="text-sm text-slate-500">
              PNG / JPEG / WebP，最多 {MAX_SCREENSHOTS} 张
            </span>
          </div>

          {screenshots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {screenshots.map((file, index) => (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                  key={`${file.name}-${index}`}
                >
                  {file.name}
                  <button
                    aria-label={`移除 ${file.name}`}
                    className="text-slate-400 transition hover:text-slate-700"
                    onClick={() =>
                      setScreenshots((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div>
            <Button
              isDisabled={isParsing}
              onPress={() => void handleParse()}
              type="button"
              variant="primary"
            >
              {isParsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isParsing ? "解析中…" : "解析并预填表单"}
            </Button>
          </div>

          {parseError ? (
            <Alert status="danger">
              <Alert.Content>
                <Alert.Title>解析失败</Alert.Title>
                <Alert.Description>
                  {parseError} 可以重试解析，或直接在下方手动填写后保存。
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          {parseWarnings.length > 0 ? (
            <Alert status="warning">
              <Alert.Content>
                <Alert.Title>解析警告（请人工确认）</Alert.Title>
                <Alert.Description>
                  <ul className="list-disc space-y-1 pl-4">
                    {parseWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </Card.Content>
      </Card>

      <Card className={panelClassName}>
        <Card.Header>
          <Card.Title>职位字段</Card.Title>
          <Card.Description>
            解析结果会预填到这里，保存前可以人工校正任意字段。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="公司"
              onChange={(company) => setForm((c) => ({ ...c, company }))}
              required
              value={form.company}
            />
            <FormField
              label="岗位名称"
              onChange={(title) => setForm((c) => ({ ...c, title }))}
              required
              value={form.title}
            />
            <FormField
              label="来源平台"
              onChange={(sourcePlatform) =>
                setForm((c) => ({ ...c, sourcePlatform }))
              }
              value={form.sourcePlatform}
            />
            <FormField
              label="原始链接"
              onChange={(sourceUrl) => setForm((c) => ({ ...c, sourceUrl }))}
              value={form.sourceUrl}
            />
            <FormField
              label="公司阶段"
              onChange={(companyStage) =>
                setForm((c) => ({ ...c, companyStage }))
              }
              value={form.companyStage}
            />
            <FormField
              label="地点"
              onChange={(location) => setForm((c) => ({ ...c, location }))}
              value={form.location}
            />
            <SelectField
              label="远程状态"
              onChange={(remoteStatus) =>
                setForm((c) => ({
                  ...c,
                  remoteStatus: remoteStatus as JobRemoteStatus,
                }))
              }
              options={remoteStatusLabels}
              value={form.remoteStatus}
            />
            <SelectField
              label="岗位类型"
              onChange={(jobType) =>
                setForm((c) => ({
                  ...c,
                  jobType: jobType as JobEmploymentType,
                }))
              }
              options={jobTypeLabels}
              value={form.jobType}
            />
            <FormField
              label="级别"
              onChange={(seniority) => setForm((c) => ({ ...c, seniority }))}
              value={form.seniority}
            />
            <FormField
              label="年限要求"
              onChange={(yearsRequired) =>
                setForm((c) => ({ ...c, yearsRequired }))
              }
              value={form.yearsRequired}
            />
            <FormField
              label="薪资范围"
              onChange={(salaryRange) =>
                setForm((c) => ({ ...c, salaryRange }))
              }
              value={form.salaryRange}
            />
            <FormField
              label="发布时间（YYYY-MM-DD）"
              onChange={(postedAt) => setForm((c) => ({ ...c, postedAt }))}
              value={form.postedAt}
            />
          </div>

          <FormTextArea
            hint="每行一个技能，也可用逗号分隔"
            label="必备技能"
            onChange={(requiredSkillsText) =>
              setForm((c) => ({ ...c, requiredSkillsText }))
            }
            rows={3}
            value={form.requiredSkillsText}
          />
          <FormTextArea
            hint="每行一个技能，也可用逗号分隔"
            label="加分技能"
            onChange={(preferredSkillsText) =>
              setForm((c) => ({ ...c, preferredSkillsText }))
            }
            rows={3}
            value={form.preferredSkillsText}
          />
          <FormTextArea
            hint="每行一条"
            label="职责描述"
            onChange={(responsibilitiesText) =>
              setForm((c) => ({ ...c, responsibilitiesText }))
            }
            rows={5}
            value={form.responsibilitiesText}
          />
          <FormTextArea
            hint="每行一条"
            label="任职要求"
            onChange={(requirementsText) =>
              setForm((c) => ({ ...c, requirementsText }))
            }
            rows={5}
            value={form.requirementsText}
          />
          <FormTextArea
            label="职位概述"
            onChange={(summary) => setForm((c) => ({ ...c, summary }))}
            rows={3}
            value={form.summary}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="导入方式"
              onChange={(importMethod) =>
                setForm((c) => ({
                  ...c,
                  importMethod: importMethod as JobImportMethod,
                }))
              }
              options={importMethodLabels}
              value={form.importMethod}
            />
          </div>

          {existingJob && !existingJob.isActive ? (
            <Chip className="w-fit" color="warning" size="sm" variant="soft">
              该职位当前已停用，保存不会自动重新启用。
            </Chip>
          ) : null}

          {saveError ? (
            <Alert status="danger">
              <Alert.Content>
                <Alert.Title>保存失败</Alert.Title>
                <Alert.Description>{saveError}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              isDisabled={isSaving}
              onPress={() => void handleSubmit()}
              type="button"
              variant="primary"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSaving ? "保存中…" : isEditMode ? "保存修改" : "创建职位"}
            </Button>
            <Link
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              href={isEditMode && jobId ? `/jobs/${jobId}` : "/jobs"}
            >
              取消
            </Link>
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}

function ImportShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        href="/jobs"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回职位列表
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </section>
  );
}

function FormField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-500">
        {required ? <span className="text-red-600">*</span> : null} {label}
      </span>
      <input
        className={cn(
          "h-9 w-full rounded-lg border border-transparent bg-slate-100/60 px-3 text-sm font-medium text-slate-900 outline-none transition",
          "placeholder:text-slate-500/70 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-400/20",
        )}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function FormTextArea({
  hint,
  label,
  onChange,
  rows = 4,
  value,
}: {
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-500">
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-slate-400">{hint}</span>
        ) : null}
      </span>
      <TextArea
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        value={value}
        variant="secondary"
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Record<string, string>;
  value: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <Select
        aria-label={label}
        fullWidth
        onSelectionChange={(key) => {
          if (key) {
            onChange(String(key));
          }
        }}
        selectedKey={value}
        variant="secondary"
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.entries(options).map(([optionValue, optionLabel]) => (
              <ListBox.Item id={optionValue} key={optionValue}>
                {optionLabel}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </label>
  );
}

function jobToFormState(job: JobRecord): JobFormState {
  return {
    sourcePlatform: job.sourcePlatform ?? "",
    sourceUrl: job.sourceUrl ?? "",
    company: job.company,
    title: job.title,
    companyStage: job.companyStage ?? "",
    location: job.location ?? "",
    remoteStatus: job.remoteStatus,
    jobType: job.jobType,
    seniority: job.seniority ?? "",
    yearsRequired: job.yearsRequired ?? "",
    requiredSkillsText: job.requiredSkills.join("\n"),
    preferredSkillsText: job.preferredSkills.join("\n"),
    responsibilitiesText: job.responsibilities.join("\n"),
    requirementsText: job.requirements.join("\n"),
    salaryRange: job.salaryRange ?? "",
    postedAt: job.postedAt ?? "",
    summary: job.summary ?? "",
    importMethod: job.importMethod,
  };
}

function applyParsedDraft(
  current: JobFormState,
  parsed: JobParseDraft,
  meta: { importMethod: JobImportMethod },
): JobFormState {
  return {
    ...current,
    sourcePlatform: parsed.source_platform ?? current.sourcePlatform,
    company: parsed.company ?? current.company,
    title: parsed.title ?? current.title,
    companyStage: parsed.company_stage ?? current.companyStage,
    location: parsed.location ?? current.location,
    remoteStatus: parsed.remote_status ?? current.remoteStatus,
    jobType: parsed.job_type ?? current.jobType,
    seniority: parsed.seniority ?? current.seniority,
    yearsRequired: parsed.years_required ?? current.yearsRequired,
    requiredSkillsText: parsed.required_skills.join("\n"),
    preferredSkillsText: parsed.preferred_skills.join("\n"),
    responsibilitiesText: parsed.responsibilities.join("\n"),
    requirementsText: parsed.requirements.join("\n"),
    salaryRange: parsed.salary_range ?? current.salaryRange,
    postedAt: parsed.posted_at ?? current.postedAt,
    summary: parsed.summary ?? current.summary,
    importMethod: meta.importMethod,
  };
}

function formStateToDraftInput(
  form: JobFormState,
  meta: { importedBy: string },
): JobDraftInput {
  return {
    sourcePlatform: emptyToNull(form.sourcePlatform),
    sourceUrl: emptyToNull(form.sourceUrl),
    company: form.company.trim(),
    title: form.title.trim(),
    companyStage: emptyToNull(form.companyStage),
    location: emptyToNull(form.location),
    remoteStatus: form.remoteStatus,
    jobType: form.jobType,
    seniority: emptyToNull(form.seniority),
    yearsRequired: emptyToNull(form.yearsRequired),
    requiredSkills: splitListText(form.requiredSkillsText, true),
    preferredSkills: splitListText(form.preferredSkillsText, true),
    responsibilities: splitListText(form.responsibilitiesText, false),
    requirements: splitListText(form.requirementsText, false),
    salaryRange: emptyToNull(form.salaryRange),
    postedAt: emptyToNull(form.postedAt),
    summary: emptyToNull(form.summary),
    importedBy: meta.importedBy,
    importMethod: form.importMethod,
  };
}

function emptyToNull(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/** 技能字段额外支持逗号分隔；职责/要求只按换行切分。 */
function splitListText(value: string, splitByComma: boolean) {
  return value
    .split(splitByComma ? /[\n,，]/ : /\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
