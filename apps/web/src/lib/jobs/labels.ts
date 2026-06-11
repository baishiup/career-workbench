import type {
  JobEmploymentType,
  JobImportMethod,
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

const importMethodLabels: Record<JobImportMethod, string> = {
  manual_form: "手动填写",
  manual_text: "粘贴 JD 解析",
  screenshot: "截图解析",
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

export { getJobLogo, importMethodLabels, jobTypeLabels, remoteStatusLabels };
