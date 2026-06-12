import type { ComponentType, ReactNode, SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  GitBranch,
  Layers3,
  Menu,
  MessageSquareText,
  PieChart,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

import "./landing-page.css";

type LandingIcon = ComponentType<SVGProps<SVGSVGElement>>;

type FeatureCard = {
  body: string;
  icon: LandingIcon;
  image?: string;
  title: string;
  variant?: "image" | "insight";
};

const heroVideo =
  "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_070729_32a7eb4e-d6e2-4571-badc-91b4dab1ecbe-2db9b1.mp4";
const testimonialVideo =
  "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_074029_c7a854bd-2d6e-4b62-96b3-ae8c16311e44-59f9be.mp4";

const featureCards: FeatureCard[] = [
  {
    body: "把岗位描述拆成职责、硬性要求、偏好信号和风险点，先判断值不值得投。",
    icon: Sparkles,
    image:
      "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_061249_f20dfeda-1033-45ce-a3ee-070965599cbf-6c6b7e.webp&w=1280&q=85",
    title: "JD 智能解析",
    variant: "image",
  },
  {
    body: "匹配报告会说明优势、缺口和下一步，而不是只给一个不可解释的分数。",
    icon: ShieldCheck,
    image:
      "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_061305_db631f5f-185f-4fda-a7a8-1dd7359ef2ea-4b7cdd.webp&w=1280&q=85",
    title: "可信匹配叙事",
    variant: "image",
  },
  {
    body: "用结构化信号看清每次申请的精力分配：匹配、风险、改写和证据补齐。",
    icon: PieChart,
    title: "申请洞察",
    variant: "insight",
  },
  {
    body: "从资料到目标简历保持可编辑，AI 只做提案，最终控制权留给用户。",
    icon: TrendingUp,
    image:
      "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_061316_50e651f8-02d0-4add-9ddb-7d81d15ac02e-24edde.webp&w=1280&q=85",
    title: "目标简历生成",
    variant: "image",
  },
];

const navItems = [
  { href: "product", label: "产品" },
  { href: "workflow", label: "流程" },
  { href: "insights", label: "洞察" },
  { href: "scenarios", label: "场景" },
];

function LandingPage() {
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const canEnterWorkbench = !isAuthConfigured || isAuthenticated;
  const ctaHref = canEnterWorkbench ? "/jobs" : "/login";
  const ctaLabel = canEnterWorkbench ? "进入工作台" : "开始使用";

  return (
    <main className="cw-landing">
      <section className="cw-hero" id="product">
        <BoomerangVideoBg src={heroVideo} />
        <div className="cw-hero-inner">
          <FadeUp immediate>
            <LandingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />
          </FadeUp>

          <div className="cw-hero-content">
            <FadeUp delay={0.1} immediate>
              <p className="cw-hero-eyebrow">
                面向开发者的 AI 求职工作台
              </p>
              <h1>把每一次申请变成可追踪的职业工作流</h1>
            </FadeUp>
            <FadeUp delay={0.25} immediate>
              <p className="cw-hero-subtitle">
                Career Workbench 将个人资料、目标 JD、匹配叙事和可编辑简历放进同一个闭环，让 AI 建议有来源、可复核、能继续迭代。
              </p>
            </FadeUp>
            <FadeUp className="cw-hero-actions" delay={0.4} immediate>
              <button
                className="cw-btn cw-btn-light"
                onClick={() => scrollToSection("workflow")}
                type="button"
              >
                <Play className="size-4" fill="currentColor" />
                看工作流
              </button>
              <button
                className="cw-btn cw-btn-dark"
                onClick={() => navigateTo(ctaHref)}
                type="button"
              >
                <Download className="size-4" />
                {ctaLabel}
              </button>
            </FadeUp>
          </div>

          <DashboardCards />
        </div>
      </section>

      <section className="cw-testimonial" id="workflow">
        <div className="cw-testimonial-grid">
          <div>
            <FadeUp>
              <h2>让求职流程从零散文件，变成一个可判断的系统。</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="cw-company-badge">
                <span>CW</span>
                <strong>Career Workbench</strong>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <blockquote>
                “我不想要一键生成的漂亮简历。我更需要知道：这个岗位为什么匹配、哪里有风险、哪段经历应该被强化，以及 AI 有没有开始编造。”
              </blockquote>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p className="cw-attribution">
                <strong>目标用户画像</strong>
                <span>有真实项目经验、希望高质量投递的开发者</span>
              </p>
            </FadeUp>
            <FadeUp delay={0.4}>
              <button
                className="cw-btn cw-btn-dark"
                onClick={() => scrollToSection("insights")}
                type="button"
              >
                查看能力模块
                <ArrowRight className="size-4" />
              </button>
            </FadeUp>
          </div>

          <FadeUp className="cw-testimonial-video-wrap" delay={0.15}>
            <video
              aria-label="产品氛围视频"
              autoPlay
              loop
              muted
              playsInline
              src={testimonialVideo}
            />
          </FadeUp>
        </div>
      </section>

      <section className="cw-features" id="insights">
        <div className="cw-features-header">
          <FadeUp>
            <h2>围绕申请决策，而不是围绕提示词。</h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <button
              className="cw-btn cw-btn-dark"
              onClick={() => navigateTo(ctaHref)}
              type="button"
            >
              <Play className="size-4" fill="currentColor" />
              打开首页入口
            </button>
          </FadeUp>
        </div>

        <div className="cw-feature-grid">
          {featureCards.map((card, index) => (
            <FadeUp delay={0.05 + index * 0.1} key={card.title}>
              <ProductFeatureCard card={card} />
            </FadeUp>
          ))}
        </div>
      </section>

      <section className="cw-scenarios" id="scenarios">
        <div className="cw-scenarios-copy">
          <p>真实使用场景</p>
          <h2>从判断岗位，到生成版本，再到复盘每次 AI 输出。</h2>
        </div>
        <div className="cw-scenario-list">
          <ScenarioItem
            icon={FileText}
            title="资料作为事实源"
            body="维护结构化 Profile，让简历生成始终回到真实经历和项目证据。"
          />
          <ScenarioItem
            icon={GitBranch}
            title="JD 进入工作台"
            body="把目标岗位解析成可比较的对象，而不是复制进聊天窗口后丢失上下文。"
          />
          <ScenarioItem
            icon={MessageSquareText}
            title="匹配报告可解释"
            body="输出优势、缺口、风险和下一步动作，帮助你决定是否继续投入时间。"
          />
          <ScenarioItem
            icon={Layers3}
            title="结果保持可编辑"
            body="生成后的目标简历仍在产品内编辑、保存和复用，不把用户锁进一次性文档。"
          />
        </div>
      </section>

      <LandingFooter ctaHref={ctaHref} ctaLabel={ctaLabel} />
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="cw-landing-header">
      <Link className="cw-brand-link" href="/">
        <BrandLogo />
        <span>Career Workbench</span>
      </Link>

      <nav aria-label="首页导航" className="cw-header-nav">
        {navItems.map((item) => (
          <button
            className={item.href === "workflow" ? "is-active" : undefined}
            key={item.href}
            onClick={() => scrollToSection(item.href)}
            type="button"
          >
            {item.label}
            {item.href === "workflow" ? <span /> : null}
          </button>
        ))}
      </nav>

      <button
        className="cw-header-cta"
        onClick={() => navigateTo(ctaHref)}
        type="button"
      >
        {ctaLabel}
      </button>

      <button
        aria-expanded={isOpen}
        aria-label="打开导航"
        className="cw-menu-button"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {isOpen ? (
        <div className="cw-mobile-menu">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                setIsOpen(false);
                scrollToSection(item.href);
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
          <button
            className="cw-btn cw-btn-dark"
            onClick={() => navigateTo(ctaHref)}
            type="button"
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </header>
  );
}

function BoomerangVideoBg({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current as
      | (HTMLVideoElement & {
          requestVideoFrameCallback?: (callback: () => void) => number;
        })
      | null;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    let raf = 0;
    let frameTimer = 0;
    let cancelled = false;
    let direction = 1;
    let frameIndex = 0;
    const frames: HTMLCanvasElement[] = [];

    const captureFrame = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) {
        return;
      }

      try {
        const frame = document.createElement("canvas");
        const scale = Math.min(960 / video.videoWidth, 1);
        frame.width = Math.max(1, Math.round(video.videoWidth * scale));
        frame.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = frame.getContext("2d");
        context?.drawImage(video, 0, 0, frame.width, frame.height);
        frames.push(frame);
      } catch {
        frames.length = 0;
        video.loop = true;
      }
    };

    const scheduleCapture = () => {
      if (cancelled || video.ended || video.paused) {
        return;
      }

      if (video.requestVideoFrameCallback) {
        video.requestVideoFrameCallback(() => {
          captureFrame();
          scheduleCapture();
        });
        return;
      }

      raf = window.requestAnimationFrame(() => {
        captureFrame();
        scheduleCapture();
      });
    };

    const playCapturedFrames = () => {
      if (cancelled || frames.length < 2) {
        video.loop = true;
        void video.play().catch(() => undefined);
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      canvas.width = frames[0].width;
      canvas.height = frames[0].height;
      setCanvasReady(true);

      frameTimer = window.setInterval(() => {
        const frame = frames[frameIndex];
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(frame, 0, 0);

        frameIndex += direction;
        if (frameIndex >= frames.length - 1 || frameIndex <= 0) {
          direction *= -1;
        }
      }, 1000 / 30);
    };

    const handleEnded = () => {
      playCapturedFrames();
    };

    video.addEventListener("ended", handleEnded);
    video.loop = false;
    scheduleCapture();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearInterval(frameTimer);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="cw-boomerang" aria-hidden="true">
      <video
        autoPlay
        crossOrigin="anonymous"
        muted
        playsInline
        ref={videoRef}
        src={src}
      />
      <canvas className={canvasReady ? "is-ready" : undefined} ref={canvasRef} />
    </div>
  );
}

function DashboardCards() {
  return (
    <FadeUp className="cw-dashboard-row" delay={0.55} immediate>
      <SavingsCard />
      <PipelineCard />
      <MatchCard />
    </FadeUp>
  );
}

function SavingsCard() {
  return (
    <article className="cw-dash-card cw-dash-side">
      <div className="cw-card-head">
        <span>Profile</span>
        <strong>+25%</strong>
      </div>
      <p>证据完整度</p>
      <svg viewBox="0 0 220 92" aria-hidden="true">
        <defs>
          <linearGradient id="profile-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M8 72 C42 66 48 44 76 48 C106 52 110 24 138 28 C166 32 174 13 212 18 L212 92 L8 92 Z"
          fill="url(#profile-fill)"
        />
        <path
          d="M8 72 C42 66 48 44 76 48 C106 52 110 24 138 28 C166 32 174 13 212 18"
          fill="none"
          stroke="#10b981"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <div className="cw-months">
        <span>资料</span>
        <span>项目</span>
        <span>证据</span>
        <span>版本</span>
      </div>
    </article>
  );
}

function PipelineCard() {
  const bars = [34, 46, 58, 42, 78, 51, 66, 39, 48, 63, 55, 70];

  return (
    <article className="cw-dash-card cw-dash-main">
      <div className="cw-card-title-row">
        <span>Application Loop</span>
        <button type="button">本周</button>
      </div>
      <div className="cw-stat-list">
        <p>
          <strong>78%</strong>
          JD 匹配
        </p>
        <p>
          <strong>43%</strong>
          风险缺口
        </p>
        <p>
          <strong>23%</strong>
          待补证据
        </p>
      </div>
      <BarChart bars={bars} highlightIndex={4} highlightColor="#f97316" />
    </article>
  );
}

function MatchCard() {
  const bars = [56, 64, 46, 72, 40, 52, 86, 48, 62, 38, 58, 66];

  return (
    <article className="cw-dash-card cw-dash-side">
      <div className="cw-card-title-row">
        <span>Resume</span>
        <button type="button">目标版</button>
      </div>
      <div className="cw-card-head">
        <p>AI 改写风险</p>
        <strong className="is-red">-8%</strong>
      </div>
      <BarChart bars={bars} highlightIndex={6} highlightColor="#08150c" />
      <div className="cw-months">
        <span>事实</span>
        <span>语气</span>
        <span>结构</span>
        <span>导出</span>
      </div>
    </article>
  );
}

function BarChart({
  bars,
  highlightColor,
  highlightIndex,
}: {
  bars: number[];
  highlightColor: string;
  highlightIndex: number;
}) {
  return (
    <div className="cw-bar-chart" aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          style={{
            background: index === highlightIndex ? highlightColor : undefined,
            height: `${height}%`,
          }}
        />
      ))}
    </div>
  );
}

function ProductFeatureCard({ card }: { card: FeatureCard }) {
  const Icon = card.icon;

  if (card.variant === "insight") {
    return (
      <article className="cw-feature-card cw-feature-insight">
        <div className="cw-feature-label">
          <Icon className="size-5" />
          <span>{card.title}</span>
        </div>
        <div className="cw-insight-panel">
          <p>申请精力分布</p>
          <span>2026 年 4 月 1 日 - 5 月 30 日</span>
          <DonutChart />
        </div>
        <p className="cw-feature-body">{card.body}</p>
      </article>
    );
  }

  return (
    <article className="cw-feature-card cw-feature-image">
      <img alt="" src={card.image} />
      <div className="cw-feature-overlay" />
      <div className="cw-feature-label">
        <Icon className="size-5" />
        <span>{card.title}</span>
      </div>
      <p className="cw-feature-body">{card.body}</p>
    </article>
  );
}

function DonutChart() {
  return (
    <div className="cw-donut-wrap">
      <svg className="cw-donut" viewBox="0 0 36 36" aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          fill="none"
          r="14"
          stroke="#C46B2D"
          strokeDasharray="26.4 61.56"
          strokeWidth="5"
        />
        <circle
          cx="18"
          cy="18"
          fill="none"
          r="14"
          stroke="#7A8C3E"
          strokeDasharray="22 65.96"
          strokeDashoffset="-26.4"
          strokeWidth="5"
        />
        <circle
          cx="18"
          cy="18"
          fill="none"
          r="14"
          stroke="#A8B87A"
          strokeDasharray="17.6 70.36"
          strokeDashoffset="-48.4"
          strokeWidth="5"
        />
        <circle
          cx="18"
          cy="18"
          fill="none"
          r="14"
          stroke="#B8AFA4"
          strokeDasharray="22 65.96"
          strokeDashoffset="-66"
          strokeWidth="5"
        />
      </svg>
      <div>
        <strong>50%</strong>
        <span>高匹配</span>
      </div>
    </div>
  );
}

function ScenarioItem({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: LandingIcon;
  title: string;
}) {
  return (
    <FadeUp>
      <article className="cw-scenario-item">
        <span>
          <Icon className="size-5" />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
        <CheckCircle2 className="cw-scenario-check size-5" />
      </article>
    </FadeUp>
  );
}

function LandingFooter({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <footer className="cw-footer">
      <div className="cw-footer-main">
        <div className="cw-footer-brand">
          <Link className="cw-footer-logo" href="/">
            <BrandLogo />
            <span>Career Workbench</span>
          </Link>
          <p>
            把求职资料、岗位判断、匹配叙事和目标简历放进同一个可复核的 AI 工作流。
          </p>
          <button
            className="cw-footer-cta"
            onClick={() => navigateTo(ctaHref)}
            type="button"
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </button>
        </div>

        <div className="cw-footer-columns">
          <div>
            <h2>页面</h2>
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div>
            <h2>工作流</h2>
            <button onClick={() => navigateTo("/profile")} type="button">
              资料库
            </button>
            <button onClick={() => navigateTo("/jobs")} type="button">
              岗位分析
            </button>
            <button onClick={() => navigateTo("/resumes")} type="button">
              简历版本
            </button>
          </div>
          <div>
            <h2>原则</h2>
            <span>事实源优先</span>
            <span>建议可追踪</span>
            <span>结果可编辑</span>
          </div>
        </div>
      </div>

      <div className="cw-footer-bottom">
        <span>© 2026 Career Workbench</span>
        <span>为开发者求职流程设计的 AI 工作台</span>
      </div>
    </footer>
  );
}

function FadeUp({
  children,
  className = "",
  delay = 0,
  immediate = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    element.style.transitionDelay = `${delay}s`;

    if (immediate) {
      const timer = window.setTimeout(() => {
        element.classList.add("is-visible");
      }, 30);

      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, immediate]);

  return (
    <div className={`cw-fade ${className}`} ref={ref}>
      {children}
    </div>
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

function scrollToSection(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  window.scrollTo({
    behavior: "smooth",
    top: element.getBoundingClientRect().top + window.scrollY,
  });
}

export { LandingPage };
