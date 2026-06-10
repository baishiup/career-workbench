import type {
  JobEmploymentType,
  JobImportMethod,
  JobImportStatus,
  JobRemoteStatus,
} from "@/lib/jobs/types";

const remoteStatusLabels: Record<JobRemoteStatus, string> = {
  hybrid: "混合办公",
  onsite: "现场办公",
  remote: "远程",
};

const jobTypeLabels: Record<JobEmploymentType, string> = {
  contract: "合同",
  full_time: "全职",
  part_time: "兼职",
};

const importStatusLabels: Record<JobImportStatus, string> = {
  needs_review: "待人工确认",
  parse_failed: "解析失败",
  parsed: "已解析",
};

const importMethodLabels: Record<JobImportMethod, string> = {
  job_url: "职位链接",
  manual_text: "手动粘贴 JD",
  screenshot: "截图导入",
};

const logoPalette = [
  "bg-[#18344d]",
  "bg-[#27a7b8]",
  "bg-[#121212]",
  "bg-[#036a6e]",
  "bg-[#7c3aed]",
  "bg-[#b45309]",
];

/** 由公司名派生列表/详情页的字母 logo，避免在数据库存展示样式。 */
function getJobLogo(company: string) {
  const text = company.trim().charAt(0).toUpperCase() || "?";
  let hash = 0;

  for (const char of company) {
    hash = (hash * 31 + char.charCodeAt(0)) % logoPalette.length;
  }

  return { className: logoPalette[hash], text };
}

export {
  getJobLogo,
  importMethodLabels,
  importStatusLabels,
  jobTypeLabels,
  remoteStatusLabels,
};
