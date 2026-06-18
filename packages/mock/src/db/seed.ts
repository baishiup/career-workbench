/**
 * 纯 mock 模式的种子数据。
 *
 * 目标是「一打开就有完整可玩的内容」：一个已完成 onboarding 的 admin 用户、
 * 一份从 Profile 派生的简历、几条职位、以及一条 demo 匹配报告。
 * 所有 id、时间戳都是写死的常量，保证每次启动可复现（不依赖 Date.now）。
 */

import {
  createDefaultResumeStyleConfig,
  emptyProfile,
  profileDraftToBaseResumeDocument,
  textToRichText,
  type ProfileDraft,
} from "@career-workbench/domain";

import {
  MOCK_USER_EMAIL,
  MOCK_USER_ID,
  type Database,
  type JobDescriptionRow,
} from "./schema.ts";

const NOW = "2026-06-16T02:00:00.000Z";
const EARLIER = "2026-06-10T02:00:00.000Z";

const demoProfile: ProfileDraft = {
  ...emptyProfile,
  personal: {
    ...emptyProfile.personal,
    fullName: "Demo User",
    headline: "Senior Frontend Engineer",
    email: MOCK_USER_EMAIL,
    phone: "+1 (555) 010-2026",
    city: "Remote",
    github: "https://github.com/demo-user",
    linkedin: "https://www.linkedin.com/in/demo-user",
  },
  preferences: {
    ...emptyProfile.preferences,
    jobFunction: "Frontend Engineer",
    jobTypes: ["全职"],
    openToRemote: true,
    targetCity: "Remote",
    salaryExpectation: "$140k - $180k",
  },
  work: [
    {
      id: "work-1",
      company: "Acme SaaS",
      title: "Senior Frontend Engineer",
      startDate: "2021-03",
      endDate: "",
      current: true,
      description: textToRichText(
        "负责 B2B 工作台前端架构、设计系统和增长实验，主导组件库从 0 到 1。",
      ),
      skills: ["React", "TypeScript", "Design System"],
    },
    {
      id: "work-2",
      company: "Beta Studio",
      title: "Frontend Engineer",
      startDate: "2018-07",
      endDate: "2021-02",
      current: false,
      description: textToRichText("开发营销站点与数据可视化面板，落地多个转化实验。"),
      skills: ["Next.js", "Data Viz"],
    },
  ],
  skills: ["React", "TypeScript", "Next.js", "Node.js", "Design System", "Tailwind CSS"],
};

const demoDocument = profileDraftToBaseResumeDocument(demoProfile, {
  title: "Demo User · 前端简历",
});
const demoStyle = createDefaultResumeStyleConfig();

const jobs: JobDescriptionRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    source_platform: "LinkedIn",
    source_url: "https://www.linkedin.com/jobs/view/mock-thrivecart",
    company: "ThriveCart",
    title: "Senior Frontend Engineer",
    logo_url: null,
    company_info: "电商 · 营销自动化 · 成长期",
    location: "United States",
    remote_status: "remote",
    job_type: "full_time",
    years_required: "5+ 年",
    required_skills: ["React", "TypeScript", "Design System", "A/B Testing"],
    preferred_skills: ["Next.js", "Checkout UX", "Conversion Analytics"],
    responsibilities: [
      "维护和扩展面向商家的结账、漏斗和订阅管理前端体验。",
      "与产品和设计协作，把增长实验转成稳定、可复用的组件。",
      "用可观测指标跟踪页面性能、转化率和发布质量。",
    ],
    requirements: [
      "有生产级 React/TypeScript 应用经验，能独立负责复杂前端模块。",
      "理解设计系统、表单、状态管理和可访问性基础。",
      "能把业务指标转化为前端实现和实验方案。",
    ],
    salary_range: null,
    posted_at: "2026-06-10",
    summary: "面向商家增长和结账转化的前端岗位，适合突出组件系统、复杂表单和产品指标经验。",
    imported_by: "Admin demo",
    is_active: true,
    created_at: EARLIER,
    updated_at: EARLIER,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    source_platform: "Company careers",
    source_url: "https://example.com/careers/mock-platform",
    company: "Northwind Cloud",
    title: "Full Stack Engineer",
    logo_url: null,
    company_info: "开发者工具 · B2B SaaS · C 轮",
    location: "Remote (US/EU)",
    remote_status: "remote",
    job_type: "full_time",
    years_required: "3+ 年",
    required_skills: ["TypeScript", "Node.js", "React", "PostgreSQL"],
    preferred_skills: ["GraphQL", "AWS", "Observability"],
    responsibilities: [
      "围绕开发者控制台构建端到端功能，从 API 到前端体验。",
      "参与服务可靠性、性能优化与监控告警建设。",
    ],
    requirements: [
      "扎实的 TypeScript 全栈能力，能独立交付完整功能。",
      "熟悉关系型数据库建模与 API 设计。",
    ],
    salary_range: "$130k - $170k",
    posted_at: "2026-06-08",
    summary: "全栈岗位，看重端到端交付能力与对开发者体验的理解。",
    imported_by: "Admin demo",
    is_active: true,
    created_at: EARLIER,
    updated_at: EARLIER,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    source_platform: "Wellfound",
    source_url: "https://wellfound.com/jobs/mock-design-eng",
    company: "Lumen Labs",
    title: "Design Engineer",
    logo_url: null,
    company_info: "AI 创意工具 · 种子轮",
    location: "San Francisco, CA",
    remote_status: "hybrid",
    job_type: "full_time",
    years_required: "4+ 年",
    required_skills: ["React", "Animation", "Design System", "Accessibility"],
    preferred_skills: ["WebGL", "Motion Design", "Figma"],
    responsibilities: [
      "在设计与工程之间架桥，打造高品质、有动效的交互体验。",
      "维护跨产品的设计系统与组件规范。",
    ],
    requirements: [
      "对像素与交互细节有极高要求，能独立实现复杂动效。",
      "有设计系统沉淀经验，理解可访问性。",
    ],
    salary_range: "$150k - $190k",
    posted_at: "2026-06-05",
    summary: "设计工程岗位，适合突出动效、设计系统和审美驱动的前端经验。",
    imported_by: "Admin demo",
    is_active: true,
    created_at: EARLIER,
    updated_at: EARLIER,
  },
];

const demoMatchReport = {
  match_score: 92,
  evidence: [
    "Profile 中有 React/Next.js、组件库和复杂 B2B 工作台经验，与岗位高度吻合。",
    "主导过设计系统从 0 到 1，正对应 JD 的 Design System 要求。",
    "有增长实验与转化优化经历，可改写成 checkout / 漏斗相关证据。",
  ],
  gaps: [
    "缺少明确的 checkout / payment funnel 案例。",
    "A/B Testing 可补成产品实验经验，避免夸大为主导增长策略。",
  ],
  risks: ["岗位偏远程异步协作，简历摘要里应补足跨时区交付与英语沟通信号。"],
  aiNote: "整体强匹配，建议优先突出设计系统主导经历和可量化的转化提升。",
};

/** 生成一份全新的种子数据；每次 reset 都返回深拷贝，避免运行期被改脏。 */
export function createSeedDatabase(): Database {
  const seed: Database = {
    users: [
      {
        id: MOCK_USER_ID,
        email: MOCK_USER_EMAIL,
        full_name: "Demo User",
        avatar_url: null,
        has_completed_onboarding: true,
        is_admin: true,
        created_at: EARLIER,
        updated_at: NOW,
      },
    ],
    profiles: [
      {
        user_id: MOCK_USER_ID,
        profile_data: demoProfile,
        created_at: EARLIER,
        updated_at: NOW,
      },
    ],
    resumes: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        user_id: MOCK_USER_ID,
        title: demoDocument.title,
        source_type: "base",
        document_json: demoDocument,
        style_json: demoStyle,
        source_context_json: null,
        created_at: EARLIER,
        updated_at: NOW,
      },
    ],
    job_descriptions: jobs,
    match_reports: [
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        user_id: MOCK_USER_ID,
        job_id: jobs[0].id,
        status: "succeeded",
        report_json: demoMatchReport,
        profile_snapshot_at: NOW,
        job_snapshot_at: EARLIER,
        external_run_id: "mock-job-match-thrivecart-001",
        error_message: null,
        created_at: NOW,
        updated_at: NOW,
      },
    ],
  };

  return structuredClone(seed);
}
