import { BriefcaseBusiness, Code2, GraduationCap, UserRound } from "lucide-react";

import type { ProfileDraft } from "@career-workbench/resume";
import type { ProfileIcon, ProfileSection } from "./types";

const sectionMeta: Record<
  ProfileSection,
  {
    label: string;
    description: string;
    icon: ProfileIcon;
  }
> = {
  personal: {
    label: "个人信息",
    description: "基础身份、联系方式和公开链接。",
    icon: UserRound,
  },
  education: {
    label: "教育经历",
    description: "学历、学校、专业和补充说明。",
    icon: GraduationCap,
  },
  work: {
    label: "工作经历",
    description: "公司、职位、职责和可用于简历的 bullet。",
    icon: BriefcaseBusiness,
  },
  skills: {
    label: "技能标签",
    description: "可被匹配和简历生成引用的技能标签。",
    icon: Code2,
  },
};

const skillSuggestions: string[] = [];

const jobTypeOptions = ["全职", "合同", "兼职", "实习"];

const drawerOrder: ProfileSection[] = [
  "personal",
  "education",
  "work",
  "skills",
];

const emptyProfile: ProfileDraft = {
  personal: {
    firstName: "",
    lastName: "",
    headline: "",
    email: "",
    phone: "",
    city: "",
    targetRegion: "",
    linkedin: "",
    github: "",
    portfolio: "",
    customFields: [],
  },
  preferences: {
    jobFunction: "",
    jobTypes: [],
    location: "",
    openToRemote: true,
    workAuthorization: [],
  },
  education: [],
  work: [],
  projects: [],
  skills: [],
};

export {
  drawerOrder,
  emptyProfile,
  jobTypeOptions,
  sectionMeta,
  skillSuggestions,
};
