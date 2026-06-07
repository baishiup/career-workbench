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

const skillSuggestions = [
  "React",
  "TypeScript",
  "Next.js",
  "Vue",
  "Node.js",
  "Electron",
  "Tailwind CSS",
  "Shadcn UI",
  "Supabase",
  "SQLite",
  "低代码平台",
  "动态表单",
  "复杂表格",
  "虚拟列表",
  "图可视化",
  "浏览器扩展",
  "共享 SDK",
  "CLI",
  "AI 辅助开发",
  "代码评审",
  "项目交付",
  "技术方案设计",
];

const jobTypeOptions = ["全职", "合同", "兼职", "实习"];

const drawerOrder: ProfileSection[] = [
  "personal",
  "education",
  "work",
  "skills",
];

// This seed is intentionally sanitized. Real profile facts should come from the
// user's confirmed draft or uploaded resume, not from private data committed here.
const initialProfile: ProfileDraft = {
  personal: {
    firstName: "Hongyuan",
    lastName: "Qi",
    headline: "前端工程师 / 全栈开发者",
    email: "hongyuan@example.com",
    phone: "+86 000 0000 0000",
    city: "杭州",
    targetRegion: "远程 / 海外 / 国内一线城市",
    linkedin: "",
    github: "https://github.com/example",
    portfolio: "",
    customFields: [],
  },
  preferences: {
    jobFunction: "前端工程师",
    jobTypes: ["全职"],
    location: "远程 / 杭州 / 上海",
    openToRemote: true,
    workAuthorization: [],
  },
  education: [
    {
      id: "edu-1",
      school: "中国地质大学",
      degree: "专科",
      major: "物业管理",
      location: "武汉",
      startDate: "2012-01",
      endDate: "2015-01",
      description:
        "完成专业课程学习，并在同期开始自学软件开发。",
    },
  ],
  work: [
    {
      id: "work-1",
      company: "企业协作平台公司",
      title: "前端工程师 / 前端负责人",
      location: "杭州",
      jobType: "全职",
      startDate: "2020-10",
      endDate: "2026-03",
      current: false,
      summary:
        "从产品迭代到项目交付，建设并长期维护企业协作和低代码业务平台。",
      bullets: [
        "负责低代码协作平台的前端架构、核心模块开发和长期维护。",
        "基于平台交付 Web 管理端、小程序、H5、移动端和 Electron 桌面端。",
        "建设共享 SDK、请求层、组件扩展和工程规范，提高多项目复用效率。",
        "在复杂需求中使用 AI 编码工具进行方案探索、代码生成、重构和评审。",
      ],
    },
    {
      id: "work-2",
      company: "软件交付工作室",
      title: "前端工程师 / 前端负责人",
      location: "厦门",
      jobType: "全职",
      startDate: "2018-12",
      endDate: "2019-12",
      current: false,
      summary:
        "重构历史前端项目，并引入自动化构建和部署流程。",
      bullets: [
        "开发、重构并维护多个前台、后台和管理系统。",
        "建设 Webpack 与 Jenkins 工作流，支持多环境差异化构建。",
        "负责 Electron 桌面 IM 和 uni-app 小程序开发。",
      ],
    },
    {
      id: "work-3",
      company: "互动娱乐公司",
      title: "前端工程师 / 前端负责人",
      location: "深圳",
      jobType: "全职",
      startDate: "2015-10",
      endDate: "2018-12",
      current: false,
      summary:
        "建设前端系统、迁移历史技术栈，并推动团队级工程实践落地。",
      bullets: [
        "将历史 jQuery 和 JSP 项目迁移到 Vue 与 React。",
        "建立 Git 协作、代码评审、自动化构建和错误监控流程。",
        "搭建 10+ 人前端团队，覆盖新人培养、任务分配和项目交付。",
      ],
    },
  ],
  projects: [],
  skills: [
    "React",
    "TypeScript",
    "Vue",
    "Next.js",
    "Node.js",
    "Electron",
    "Tailwind CSS",
    "Supabase",
    "低代码平台",
    "动态表单",
    "复杂表格",
    "虚拟列表",
    "共享 SDK",
    "AI 辅助开发",
    "代码评审",
  ],
};

export {
  drawerOrder,
  initialProfile,
  jobTypeOptions,
  sectionMeta,
  skillSuggestions,
};
