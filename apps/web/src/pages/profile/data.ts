import {
  Blocks,
  BriefcaseBusiness,
  Code2,
  FolderGit2,
  GraduationCap,
  Target,
  UserRound,
} from "lucide-react";

import { emptyProfile } from "@/lib/profile/empty-profile";
import type { ProfileSectionId } from "@career-workbench/domain";
import type { ProfileIcon } from "./types";

const sectionMeta: Record<
  ProfileSectionId,
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
  preferences: {
    label: "求职偏好",
    description: "求职方向、工作类型、期望工作城市和薪资期望。",
    icon: Target,
  },
  education: {
    label: "教育经历",
    description: "学历、学校、专业和补充说明。",
    icon: GraduationCap,
  },
  work: {
    label: "工作经历",
    description: "公司、职位、工作描述（富文本）和相关技能。",
    icon: BriefcaseBusiness,
  },
  projects: {
    label: "项目经历",
    description: "代表项目、角色、项目描述（富文本）和相关技能。",
    icon: FolderGit2,
  },
  skills: {
    label: "技能标签",
    description: "可被匹配和简历生成引用的技能标签。",
    icon: Code2,
  },
  custom: {
    label: "自定义模块",
    description: "自定义标题与富文本内容，补充固定模块之外的信息。",
    icon: Blocks,
  },
};

const skillSuggestions: string[] = [];

const jobTypeOptions = ["全职", "合同", "兼职", "实习"];

const drawerOrder: ProfileSectionId[] = [
  "personal",
  "preferences",
  "education",
  "work",
  "projects",
  "skills",
  "custom",
];

export {
  drawerOrder,
  emptyProfile,
  jobTypeOptions,
  sectionMeta,
  skillSuggestions,
};
