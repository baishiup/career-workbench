type JobImportMethod = "manual_text" | "job_url" | "screenshot";
type JobImportStatus = "已解析" | "待人工确认" | "解析失败可重试";
type RemoteStatus = "远程" | "混合办公" | "现场办公";

type MatchReport = {
  score: number;
  label: "强匹配" | "可冲刺" | "需补证据";
  aiNote: string;
  evidence: string[];
  gaps: string[];
  risks: string[];
  runId: string;
  provider: "mock";
  generatedAt: string;
};

type JobRecord = {
  id: string;
  sourcePlatform: string;
  sourceUrl: string;
  company: string;
  title: string;
  companyStage: string;
  location: string;
  remoteStatus: RemoteStatus;
  jobType: "全职" | "合同" | "兼职";
  seniority: string;
  yearsRequired: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requirements: string[];
  salaryRange: string;
  postedAt: string;
  importedBy: string;
  importMethod: JobImportMethod;
  importStatus: JobImportStatus;
  applicantSignal: string;
  summary: string;
  logoText: string;
  logoClassName: string;
  match: MatchReport;
};

// Demo-only JD data mirrors the future JobDescription + MatchReport boundary:
// one source record, structured JD fields, and mock AI analysis metadata.
const jobs: JobRecord[] = [
  {
    id: "thrivecart",
    sourcePlatform: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/mock-thrivecart",
    company: "ThriveCart",
    title: "Senior Frontend Engineer",
    companyStage: "电商 · 营销自动化 · 成长期",
    location: "United States",
    remoteStatus: "远程",
    jobType: "全职",
    seniority: "Senior",
    yearsRequired: "5+ 年",
    requiredSkills: ["React", "TypeScript", "Design System", "A/B Testing"],
    preferredSkills: ["Next.js", "Checkout UX", "Conversion Analytics"],
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
    salaryRange: "未公开",
    postedAt: "11 小时前",
    importedBy: "Admin demo",
    importMethod: "job_url",
    importStatus: "已解析",
    applicantSignal: "少于 25 人申请",
    summary:
      "面向商家增长和结账转化的前端岗位，适合突出组件系统、复杂表单和产品指标经验。",
    logoText: "T",
    logoClassName: "bg-[#18344d]",
    match: {
      score: 98,
      label: "强匹配",
      aiNote:
        "React 组件库和无代码转化漏斗经验信号很强。简历应优先突出设计系统主导经历和可量化的转化提升。",
      evidence: [
        "Profile 中有 React/Next.js、组件库和复杂 B2B 工作台经验。",
        "过往项目包含产品化 AI 工具和自动化流程，能贴近增长型 SaaS 场景。",
        "简历中已有性能、交付速度和前端架构相关成果，可直接改写成 JD 证据。",
      ],
      gaps: [
        "缺少明确的 checkout / payment funnel 案例。",
        "A/B Testing 可以补成产品实验经验，不要夸大为主导增长策略。",
      ],
      risks: [
        "岗位可能看重英语远程协作，需要在摘要里补足异步沟通和跨时区交付信号。",
      ],
      runId: "mock-job-match-thrivecart-001",
      provider: "mock",
      generatedAt: "2026-06-06 09:20",
    },
  },
  {
    id: "next-insurance",
    sourcePlatform: "Company careers",
    sourceUrl: "https://www.nextinsurance.com/careers/mock-frontend",
    company: "AP Intego (now NEXT)",
    title: "Frontend Software Engineer",
    companyStage: "保险科技 · 成熟期",
    location: "Boston, MA",
    remoteStatus: "混合办公",
    jobType: "全职",
    seniority: "Senior",
    yearsRequired: "6+ 年",
    requiredSkills: ["React", "TypeScript", "Accessibility", "Forms"],
    preferredSkills: ["Insurance workflows", "Testing", "Design QA"],
    responsibilities: [
      "构建保险报价、购买和账号管理相关的前端流程。",
      "维护高可靠表单、校验、状态流转和错误处理体验。",
      "和后端、法务、运营团队协作，保证复杂业务规则可追踪。",
    ],
    requirements: [
      "熟悉大型 React 应用、表单体验和前端测试。",
      "能在合规约束下处理复杂用户流程和边界状态。",
      "具备可访问性、浏览器兼容和性能优化意识。",
    ],
    salaryRange: "$142K/yr - $192K/yr",
    postedAt: "4 天前",
    importedBy: "Admin demo",
    importMethod: "manual_text",
    importStatus: "已解析",
    applicantSignal: "少于 25 人申请",
    summary:
      "偏成熟业务系统的前端岗位，匹配复杂表单、可靠交付和可访问性证据。",
    logoText: "N",
    logoClassName: "bg-[#27a7b8]",
    match: {
      score: 89,
      label: "强匹配",
      aiNote:
        "生产级前端和保险流程 UI 经验较匹配。投递前补充可访问性和复杂表单案例。",
      evidence: [
        "Profile 中有 Next.js、TypeScript 和工作台式产品经验。",
        "简历中的上传、解析、编辑和导出流程可以映射成复杂表单/状态管理案例。",
        "已有 HeroUI/Tailwind 组件实践，可支撑设计 QA 和一致性表达。",
      ],
      gaps: [
        "保险领域经验不足，需要把行业学习能力写清楚。",
        "可访问性和测试证据需要更具体。",
      ],
      risks: [
        "混合办公地点在 Boston，需要确认远程/签证/搬迁边界。",
      ],
      runId: "mock-job-match-next-001",
      provider: "mock",
      generatedAt: "2026-06-06 09:24",
    },
  },
  {
    id: "emergent-ai",
    sourcePlatform: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/mock-emergent",
    company: "Emergent",
    title: "Frontend Engineer, AI Products",
    companyStage: "人工智能 · 软件 · 成长期",
    location: "San Francisco",
    remoteStatus: "现场办公",
    jobType: "全职",
    seniority: "Staff / Lead",
    yearsRequired: "7+ 年",
    requiredSkills: ["React", "AI UX", "Frontend Architecture", "Realtime UI"],
    preferredSkills: ["Agents", "Streaming", "Developer Tools"],
    responsibilities: [
      "设计和实现 AI 产品的核心前端交互，包括生成、编辑和反馈闭环。",
      "建设实时状态、流式输出和复杂任务编排的前端架构。",
      "推动设计、模型和工程团队围绕用户工作流快速迭代。",
    ],
    requirements: [
      "有 AI 产品或开发者工具前端经验。",
      "能在不确定需求下拆分复杂交互和工程边界。",
      "具备跨团队技术负责人经验。",
    ],
    salaryRange: "未公开",
    postedAt: "1 天前",
    importedBy: "Admin demo",
    importMethod: "screenshot",
    importStatus: "待人工确认",
    applicantSignal: "早期申请窗口",
    summary:
      "AI 产品前端岗位，方向高度相关，但级别偏高，需要更强架构和负责人证据。",
    logoText: "E",
    logoClassName: "bg-[#121212]",
    match: {
      score: 88,
      label: "可冲刺",
      aiNote:
        "AI 产品背景相关，但岗位级别更高，需要补充架构负责人经历和跨团队产品协作案例。",
      evidence: [
        "Career Workbench 本身可作为 AI 工作台、流式状态和可追溯编辑的项目证据。",
        "过往关注 AI tooling、自动化和 MVP 验证，和岗位方向一致。",
        "前端技术栈覆盖 React/Next.js/TypeScript 和产品工作台。",
      ],
      gaps: [
        "Staff/Lead 级别需要明确团队影响力和架构决策。",
        "需要补充 streaming、agent workflow 或模型交互的具体实现细节。",
      ],
      risks: [
        "现场办公可能和目标地区不匹配。",
        "如果只写 AI 兴趣而没有工程证据，会显得偏概念。",
      ],
      runId: "mock-job-match-emergent-001",
      provider: "mock",
      generatedAt: "2026-06-06 09:31",
    },
  },
  {
    id: "datacamp-platform",
    sourcePlatform: "Job board",
    sourceUrl: "https://www.datacamp.com/careers/mock-platform-frontend",
    company: "DataCamp",
    title: "Frontend Platform Engineer",
    companyStage: "在线教育 · 数据学习 · 成熟期",
    location: "Remote - Europe / US overlap",
    remoteStatus: "远程",
    jobType: "全职",
    seniority: "Mid-Senior",
    yearsRequired: "4+ 年",
    requiredSkills: ["React", "TypeScript", "Component Library", "Testing"],
    preferredSkills: ["Monorepo", "Design Tokens", "Documentation"],
    responsibilities: [
      "维护跨产品复用的前端平台、组件库和设计 token。",
      "提升工程文档、测试覆盖和团队交付效率。",
      "支持课程、练习和学习路径页面的体验一致性。",
    ],
    requirements: [
      "熟悉组件抽象、前端工程化和跨团队协作。",
      "能写清晰文档并推动设计系统落地。",
      "具备测试、可维护性和性能意识。",
    ],
    salaryRange: "未公开",
    postedAt: "6 天前",
    importedBy: "Admin demo",
    importMethod: "manual_text",
    importStatus: "解析失败可重试",
    applicantSignal: "申请人数未知",
    summary:
      "前端平台方向匹配度稳定，适合把组件系统、工程化和文档能力作为主线。",
    logoText: "D",
    logoClassName: "bg-[#036a6e]",
    match: {
      score: 82,
      label: "需补证据",
      aiNote:
        "平台方向相关，但需要更具体的组件库维护、测试和文档产出证据。",
      evidence: [
        "技术栈与 React/TypeScript/组件系统要求一致。",
        "已有 HeroUI/Tailwind 和工作台 UI 实作，可转成设计系统案例。",
        "多模块 monorepo 项目能支撑工程化叙事。",
      ],
      gaps: [
        "缺少明确测试覆盖率、组件文档或设计 token 产出指标。",
        "在线教育领域经验不明显。",
      ],
      risks: [
        "导入状态为解析失败可重试，当前 JD 内容来自人工校正 mock，真实流程需复核。",
      ],
      runId: "mock-job-match-datacamp-001",
      provider: "mock",
      generatedAt: "2026-06-06 09:36",
    },
  },
];

function getJobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export { getJobById, jobs };
export type { JobImportMethod, JobImportStatus, JobRecord, RemoteStatus };
