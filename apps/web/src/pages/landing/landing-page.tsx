import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlay,
  FileText,
  Gauge,
  GitBranch,
  LineChart,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { Button } from "@heroui/react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

import "./landing-page.css";

type FeatureIcon = ComponentType<SVGProps<SVGSVGElement>>;

type StoryPanel = {
  accent: "blue" | "green" | "slate";
  description: string;
  icon: FeatureIcon;
  meta: string;
  title: string;
};

const storyPanels: StoryPanel[] = [
  {
    accent: "blue",
    description:
      "把经历拆成结构化模块，保留真实信息，同时让每段表达都能对应目标 JD。",
    icon: PenLine,
    meta: "Resume editor",
    title: "核心简历编辑器",
  },
  {
    accent: "green",
    description:
      "从技术栈、项目密度、职责范围和关键缺口生成匹配分，不靠单一关键词硬凑。",
    icon: Gauge,
    meta: "Match report",
    title: "JD 匹配度分析",
  },
  {
    accent: "slate",
    description:
      "把 AI 判断过程写成可追踪的叙事：为什么推荐、哪里有风险、下一步改什么。",
    icon: MessageSquareText,
    meta: "AI narrative",
    title: "AI 分析叙事",
  },
];

const workflowSteps = [
  {
    description: "上传 PDF 或粘贴现有简历，生成结构化职业档案。",
    icon: FileText,
    title: "导入简历",
  },
  {
    description: "录入目标 JD，拆出职责、要求、技术栈和隐藏偏好。",
    icon: GitBranch,
    title: "解析职位",
  },
  {
    description: "得到匹配度、风险点和可执行的简历改写建议。",
    icon: Target,
    title: "分析匹配",
  },
  {
    description: "在编辑器里定制投递版本，保留证据和修改记录。",
    icon: WandSparkles,
    title: "生成版本",
  },
];

function LandingPage() {
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const canEnterWorkbench = !isAuthConfigured || isAuthenticated;
  const ctaHref = canEnterWorkbench ? "/jobs" : "/login";
  const ctaLabel = canEnterWorkbench ? "进入工作台" : "免费开始使用";

  return (
    <main className="cw-landing min-h-screen text-slate-950">
      <LandingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />

      <section className="cw-hero">
        <div className="cw-hero-grid">
          <div className="cw-hero-copy">
            <h1>Career Workbench</h1>
            <p className="cw-hero-lede">
              AI 驱动的求职工作台。从简历定制、JD 匹配到面试准备，让每一次投递更精准、更有把握。
            </p>
            <div className="cw-hero-actions">
              <Button
                className="cw-primary-button"
                onPress={() => navigateTo(ctaHref)}
                size="lg"
                type="button"
              >
                {ctaLabel}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                className="cw-secondary-button"
                onPress={() => scrollToSection("product-story")}
                size="lg"
                type="button"
              >
                <CirclePlay className="size-4" />
                观看演示
              </Button>
            </div>
            <div className="cw-hero-proof" aria-label="产品能力">
              <ProofItem icon={Sparkles} text="AI 深度分析" />
              <ProofItem icon={LineChart} text="机会优先级" />
              <ProofItem icon={ShieldCheck} text="数据安全可控" />
            </div>
          </div>

          <ProductDeck />
        </div>

        <button
          aria-label="查看产品能力"
          className="cw-scroll-cue"
          onClick={() => scrollToSection("product-story")}
          type="button"
        >
          <ChevronDown className="size-5" />
        </button>
      </section>

      <section className="cw-product-story" id="product-story">
        <div className="cw-section-heading">
          <p>AI 助力的求职全流程</p>
          <h2>从内容优化到机会把控，每一步都有数据与洞察支持</h2>
        </div>

        <div className="cw-story-stack">
          <StoryBlock panel={storyPanels[0]}>
            <ResumeEditorMockup />
          </StoryBlock>
          <StoryBlock panel={storyPanels[1]}>
            <MatchPanelMockup />
          </StoryBlock>
          <StoryBlock panel={storyPanels[2]}>
            <AnalysisNarrativeMockup />
          </StoryBlock>
        </div>
      </section>

      <section className="cw-workflow-section" id="workflow">
        <div className="cw-section-heading">
          <p>简单 4 步</p>
          <h2>打造更强求职竞争力</h2>
        </div>
        <div className="cw-workflow-grid">
          {workflowSteps.map((step, index) => (
            <WorkflowCard index={index} key={step.title} step={step} />
          ))}
        </div>
      </section>

      <section className="cw-final-cta">
        <div>
          <h2>准备好让 AI 帮你拿到更多面试机会了吗？</h2>
          <p>
            立即体验 Career Workbench，让每一次投递都更节省时间、更有价值。
          </p>
        </div>
        <div className="cw-final-actions">
          <Button
            className="cw-primary-button"
            onPress={() => navigateTo(ctaHref)}
            size="lg"
            type="button"
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Button>
          <Button
            className="cw-dark-secondary-button"
            onPress={() => scrollToSection("product-story")}
            size="lg"
            type="button"
          >
            观看演示
            <CirclePlay className="size-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}

function LandingHeader({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <header className="cw-landing-header">
      <div className="cw-header-inner">
        <Link className="cw-brand-link" href="/">
          <BrandLogo />
          <span>Career Workbench</span>
        </Link>
        <nav aria-label="首页导航" className="cw-header-nav">
          <button onClick={() => scrollToSection("product-story")} type="button">
            产品
          </button>
          <button onClick={() => scrollToSection("product-story")} type="button">
            功能
          </button>
          <button onClick={() => scrollToSection("workflow")} type="button">
            流程
          </button>
        </nav>
        <Button
          className="cw-primary-button cw-header-button"
          onPress={() => navigateTo(ctaHref)}
          size="sm"
          type="button"
        >
          {ctaLabel}
        </Button>
      </div>
    </header>
  );
}

function BrandLogo() {
  return (
    <span className="cw-brand-mark" aria-hidden="true">
      <svg fill="none" viewBox="0 0 40 40">
        <path
          d="M20 3.5 34.3 11.8v16.4L20 36.5 5.7 28.2V11.8L20 3.5Z"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          d="M24.8 12.5H17a5.7 5.7 0 0 0-5.7 5.7v3.6a5.7 5.7 0 0 0 5.7 5.7h7.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <path
          d="m21.6 21.4 3.2 3.2 6.2-7.1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
    </span>
  );
}

function ProductDeck() {
  return (
    <div className="cw-product-deck" aria-label="Career Workbench 产品界面预览">
      <div className="cw-window cw-main-window cw-parallax-layer">
        <WindowChrome title="Career Workbench" />
        <div className="cw-dashboard-grid">
          <aside>
            {["映像", "工作台", "简历", "匹配配置", "AI 分析"].map((item) => (
              <span className={item === "工作台" ? "is-active" : ""} key={item}>
                {item}
              </span>
            ))}
          </aside>
          <div className="cw-dashboard-content">
            <div className="cw-metric-row">
              <Metric label="已匹配中" value="12" />
              <Metric label="简历版本" value="5" />
              <Metric label="投递追踪" value="28" />
              <Metric label="平均匹配" value="86%" />
            </div>
            <div className="cw-dashboard-panels">
              <div className="cw-mini-list">
                <h3>最近活动</h3>
                {[
                  ["高级前端工程师 · 字节跳动", "86%"],
                  ["资深全栈工程师 · 腾讯", "82%"],
                  ["前端开发工程师 · 美团", "78%"],
                ].map(([title, score]) => (
                  <div key={title}>
                    <span>{title}</span>
                    <strong>{score}</strong>
                  </div>
                ))}
              </div>
              <div className="cw-score-donut">
                <span>86%</span>
                <small>平均匹配</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cw-window cw-editor-float cw-parallax-layer">
        <WindowChrome title="Senior Frontend Engineer" compact />
        <div className="cw-float-editor-body">
          <span>简历编辑</span>
          <span>匹配分析</span>
          <span>AI 分析</span>
          <span>投递建议</span>
        </div>
      </div>

      <div className="cw-match-float cw-parallax-layer">
        <span>匹配得分</span>
        <strong>86%</strong>
        <small>强匹配</small>
        <div />
      </div>
    </div>
  );
}

function ProofItem({ icon: Icon, text }: { icon: FeatureIcon; text: string }) {
  return (
    <span>
      <Icon className="size-5" />
      {text}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WindowChrome({
  compact = false,
  title,
}: {
  compact?: boolean;
  title: string;
}) {
  return (
    <div className="cw-window-chrome">
      <span className="cw-window-brand">
        <BrandLogo />
        {!compact ? title : null}
      </span>
      <span className="cw-window-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function StoryBlock({
  children,
  panel,
}: {
  children: ReactNode;
  panel: StoryPanel;
}) {
  const Icon = panel.icon;

  return (
    <article className={`cw-story-card cw-accent-${panel.accent}`}>
      <div className="cw-story-copy">
        <span>{panel.meta}</span>
        <h3>
          <Icon className="size-7" />
          {panel.title}
        </h3>
        <p>{panel.description}</p>
        <ul>
          <li>
            <Check className="size-4" />
            版本历史与证据保留
          </li>
          <li>
            <Check className="size-4" />
            可执行的下一步建议
          </li>
          <li>
            <Check className="size-4" />
            导出 PDF / DOCX 前可预览
          </li>
        </ul>
      </div>
      {children}
    </article>
  );
}

function ResumeEditorMockup() {
  return (
    <div className="cw-mockup cw-resume-mockup">
      <div className="cw-mockup-sidebar">
        {["个人信息", "工作经历", "项目经验", "技能", "教育背景"].map((item) => (
          <span className={item === "工作经历" ? "is-active" : ""} key={item}>
            {item}
          </span>
        ))}
      </div>
      <div className="cw-resume-editor">
        <div className="cw-editor-toolbar">
          <strong>工作经历</strong>
          <span>B</span>
          <span>I</span>
          <span>•</span>
          <span>AI 优化建议</span>
        </div>
        <h4>高级前端工程师 · 某科技公司</h4>
        <p>
          负责企业级产品的前端架构设计与开发，支持日活千万级用户访问。
        </p>
        <ul>
          <li>基于 React + TypeScript 进行组件化开发，提升页面复用率。</li>
          <li>主导性能优化，首屏加载时间从 2.3s 降至 1.1s。</li>
          <li>搭建测试工程体系，CI 构建时间降低 40%。</li>
        </ul>
        <div className="cw-ai-note">
          建议强化「性能优化」场景的业务影响，例如补充指标口径和用户规模。
        </div>
      </div>
      <div className="cw-resume-preview">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function MatchPanelMockup() {
  return (
    <div className="cw-mockup cw-match-mockup">
      <div className="cw-large-score">
        <div>
          <strong>86%</strong>
          <span>强匹配</span>
        </div>
      </div>
      <div className="cw-match-bars">
        {[
          ["技术栈匹配", "92%"],
          ["项目经验匹配", "85%"],
          ["工作职责匹配", "88%"],
          ["软技能匹配", "75%"],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <i style={{ width: value }} />
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="cw-gap-list">
        <h4>关键差距</h4>
        <p>大规模性能优化经验需要补充指标案例</p>
        <p>React Native 经验可作为加分项</p>
        <p>工具链经验与岗位要求高度一致</p>
      </div>
    </div>
  );
}

function AnalysisNarrativeMockup() {
  return (
    <div className="cw-mockup cw-analysis-mockup">
      <div className="cw-analysis-timeline">
        {["10:21", "10:22", "10:24", "10:26"].map((time, index) => (
          <span className={index === 3 ? "is-active" : ""} key={time}>
            {time}
          </span>
        ))}
      </div>
      <div className="cw-analysis-body">
        <h4>AI 深度洞察</h4>
        <p>
          你的经历与该岗位在复杂前端工程、技术栈与项目推进层面有较高重合。
          目前最需要补齐的是大规模性能优化的量化证据。
        </p>
        <div className="cw-analysis-grid">
          <div>
            <strong>亮点</strong>
            <span>具备丰富的 React 生态开发经验</span>
            <span>工程化实践与岗位强相关</span>
          </div>
          <div>
            <strong>风险</strong>
            <span>缺少大型性能优化案例</span>
            <span>移动端经验需要补充说明</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({
  index,
  step,
}: {
  index: number;
  step: (typeof workflowSteps)[number];
}) {
  const Icon = step.icon;

  return (
    <article className="cw-workflow-card">
      <span className="cw-workflow-index">{String(index + 1).padStart(2, "0")}</span>
      <Icon className="size-6" />
      <h3>{step.title}</h3>
      <p>{step.description}</p>
    </article>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export { LandingPage };
