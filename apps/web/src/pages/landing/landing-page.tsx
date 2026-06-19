import { ArrowRight, ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

import flowOnboardingImage from "@/assets/landing/flow-onboarding.png";
import flowResumeEditorImage from "@/assets/landing/flow-resume-editor.png";
import heroJobMatchImage from "@/assets/landing/hero-job-match.png";
import trustResumeEditorImage from "@/assets/landing/trust-resume-editor.png";
import { CareerLogo } from "@/components/brand/career-logo";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

import "./landing-page.css";

const heroDemoVideo = "/landing/career-workbench-hero-demo2.mp4";

type Feature = {
  body: string;
  eyebrow: string;
  media: string;
  title: string;
};

type WorkflowStep = {
  description: string;
  title: string;
};

const buildFeatures: Feature[] = [
  {
    body: "把简历里的经历、技能和项目沉淀成事实库，后续匹配、生成和改写都从真实材料出发。",
    eyebrow: "01",
    media: flowOnboardingImage,
    title: "建立事实库",
  },
  {
    body: "目标 JD 被拆成职责、要求和偏好信号，匹配报告给出命中证据、能力缺口和风险提示。",
    eyebrow: "02",
    media: heroJobMatchImage,
    title: "生成匹配报告",
  },
  {
    body: "基于匹配报告生成目标简历草稿，再通过编辑器和 AI patch 继续迭代。",
    eyebrow: "03",
    media: flowResumeEditorImage,
    title: "生成目标简历",
  },
  {
    body: "匹配、生成、改写和人工采纳都会沉淀成可回看的过程，让每次申请不是一次性聊天记录。",
    eyebrow: "04",
    media: heroJobMatchImage,
    title: "保留 AI Trace",
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    description: "导入原始简历",
    title: "上传简历",
  },
  {
    description: "沉淀经历技能",
    title: "形成事实库",
  },
  {
    description: "拆解职责要求",
    title: "解析职位",
  },
  {
    description: "查看命中缺口",
    title: "证据匹配",
  },
  {
    description: "生成目标版本",
    title: "定制简历",
  },
  {
    description: "采纳或继续改",
    title: "确认修改",
  },
];

const trustCards = [
  {
    body: "每段生成内容都应能回到事实库、目标 JD 或用户确认过的修改记录。",
    number: "01",
    title: "Traceable",
  },
  {
    body: "AI 只提出 patch 和草稿，用户决定采纳、拒绝或继续改写。",
    number: "02",
    title: "Editable",
  },
  {
    body: "匹配、生成和编辑围绕同一套事实与目标快照展开，减少重复整理。",
    number: "03",
    title: "Reusable",
  },
];

function LandingPage() {
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const user = useAuthStore((state) => state.user);
  const canEnterWorkbench = !isAuthConfigured || Boolean(user);
  const ctaHref = canEnterWorkbench ? "/jobs" : "/login";
  const ctaLabel = canEnterWorkbench ? "进入工作台" : "开始使用";

  return (
    <div className="cw-landing" id="product">
      <Header ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main>
        <Hero />
        <BuildScrollSection />
        <ProductionReady />
        <TrustSection ctaHref={ctaHref} />
      </main>
      <Footer ctaHref={ctaHref} ctaLabel={ctaLabel} />
    </div>
  );
}

function Header({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  const [isMinimal, setIsMinimal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsMinimal(window.scrollY > 780);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`cw-home-header ${isMinimal ? "cw-home-header--minimal" : ""}`}
    >
      <div className="cw-home-header-content">
        <a className="cw-home-brand" href="/" aria-label="Career Workbench">
          <CareerLogo size="md" />
        </a>
        <nav className="cw-home-desktop-nav" aria-label="首页导航">
          <a href="#solutions">
            Workflow <ChevronDown size={14} />
          </a>
          <a href="#trust">Trust</a>
          <a href="#footer">Resources</a>
        </nav>
        <div className="cw-home-header-actions">
          <button
            className="cw-home-primary-pill"
            onClick={() => navigateTo(ctaHref)}
            type="button"
          >
            <span>{ctaLabel}</span>
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="cw-home-hero-section">
      <div className="cw-home-hero-grid">
        <div className="cw-home-hero-title-block">
          <a className="cw-home-forum-banner" href="#trust">
            <span>AI Trace Ready</span>
            <span>让匹配、生成、改写和人工采纳都有来源可查。</span>
            <ArrowRight size={14} />
          </a>
          <h1>
            用事实库生成可信、可追溯、可编辑的定制<span>简历</span>
          </h1>
        </div>
        <div className="cw-home-hero-description">
          <p>
            Career Workbench 将个人事实库、目标职位、匹配叙事、AI
            修改建议和可编辑简历放进同一个闭环，让 AI
            建议有来源、可复核、能继续迭代。
          </p>
        </div>
        <div className="cw-home-customer-strip" aria-label="核心流程">
          {workflowSteps.map((step, index) => (
            <article className="cw-home-workflow-step-card" key={step.title}>
              <span className="cw-home-workflow-step-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{step.title}</strong>
              <small>{step.description}</small>
            </article>
          ))}
        </div>
        <div className="cw-home-hero-media-shell">
          <video
            aria-label="Career Workbench 演示视频：展示职位列表、AI 匹配报告、证据缺口和资料事实库"
            autoPlay
            loop
            muted
            playsInline
            poster={heroJobMatchImage}
            preload="metadata"
            src={heroDemoVideo}
          >
            <img
              src={heroJobMatchImage}
              alt="职位详情页展示匹配度、命中证据、能力缺口和风险提示"
            />
          </video>
        </div>
      </div>
    </section>
  );
}

function BuildScrollSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const scrollRange = Math.max(
        1,
        section.offsetHeight - window.innerHeight,
      );
      const progress = Math.min(
        0.999,
        Math.max(0, (window.scrollY - sectionTop) / scrollRange),
      );
      const nextActiveIndex = Math.min(
        buildFeatures.length - 1,
        Math.max(0, Math.floor(progress * buildFeatures.length)),
      );

      setScrollProgress(progress);
      setActiveIndex(nextActiveIndex);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section
      id="solutions"
      className="cw-home-build-scroll-section"
      ref={sectionRef}
    >
      <div className="cw-home-section-label">Workflow</div>
      <div className="cw-home-build-scroll-stage">
        <div className="cw-home-build-scroll-sticky">
          <div className="cw-home-build-copy">
            <div className="cw-home-section-heading">
              <h2>从岗位判断到简历生成，把每次申请做成可追踪流程。</h2>
              <p>
                不把 AI
                当成一次性聊天窗口，而是让事实、目标、建议、修改记录和人工决策在产品里连接起来。
              </p>
            </div>
            <div className="cw-home-build-step-list">
              {buildFeatures.map((feature, index) => (
                <article
                  className={`cw-home-build-step ${index === activeIndex ? "cw-home-build-step--active" : ""}`}
                  key={feature.title}
                  aria-current={index === activeIndex ? "step" : undefined}
                >
                  <div>
                    <span>{feature.eyebrow}</span>
                    <h3>{feature.title}</h3>
                  </div>
                  {index === activeIndex ? <p>{feature.body}</p> : null}
                </article>
              ))}
            </div>
          </div>
          <div className="cw-home-build-visual">
            <div className="cw-home-build-visual-bg" />
            {buildFeatures.map((feature, index) => {
              const cardProgress = Math.min(
                1,
                Math.max(0, scrollProgress * buildFeatures.length - index),
              );

              return (
                <div
                  aria-hidden={index !== activeIndex}
                  className="cw-home-build-media-card"
                  key={feature.title}
                  style={
                    {
                      "--cw-card-offset-y": `${(1 - cardProgress) * 44}vh`,
                      "--cw-card-progress": cardProgress,
                      "--cw-card-stack": index,
                    } as CSSProperties
                  }
                >
                  <MediaFrame feature={feature} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MediaFrame({ feature }: { feature: Feature }) {
  return (
    <div className="cw-home-media-frame">
      <img src={feature.media} alt="" loading="lazy" />
    </div>
  );
}

function ProductionReady() {
  return (
    <section className="cw-home-production-section">
      <div className="cw-home-production-card">
        <div>
          <h2>AI 可以快，但不能替你编造。</h2>
          <h2>每一步都要能解释。</h2>
        </div>
        <div className="cw-home-trust-card-grid">
          {trustCards.map((card) => (
            <article className="cw-home-trust-card" key={card.title}>
              <div className="cw-home-trust-card-top">
                <h3>{card.title}</h3>
                <span>{card.number}</span>
              </div>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="cw-home-enterprise-section" id="trust">
      <div className="cw-home-section-label">Trust</div>
      <div className="cw-home-enterprise-hero">
        <div>
          <h2>围绕可信简历生成，而不是围绕提示词。</h2>
          <p>
            Profile 是事实源，JD 是目标约束，Match Report 给出证据和风险，
            Resume Editor 保留人工控制权。AI 负责提出建议，产品负责记录过程。
          </p>
          <div className="cw-home-enterprise-actions">
            <button
              className="cw-home-enterprise-primary"
              onClick={() => navigateTo(ctaHref)}
              type="button"
            >
              打开工作台
            </button>
            <a className="cw-home-enterprise-secondary" href="#solutions">
              <span>查看流程</span>
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
        <div className="cw-home-enterprise-visual">
          <img
            src={trustResumeEditorImage}
            alt="简历编辑器展示可编辑的目标简历"
            loading="lazy"
          />
          <div className="cw-home-impact-card">
            <span>THE LOOP</span>
            <strong>4 步闭环</strong>
            <p>事实库、目标职位、匹配报告和定制简历互相连接。</p>
          </div>
        </div>
      </div>
      <div className="cw-home-case-study-grid">
        <article>
          <span>PRODUCT PRINCIPLE</span>
          <h3>用户保留最终控制权</h3>
          <p>AI patch 必须经过用户采纳，生成结果仍可继续编辑、保存和复盘。</p>
        </article>
        <article>
          <strong>0</strong>
          <p>不自动投递，不把求职流程变成不可控黑箱。</p>
        </article>
        <article>
          <strong>1</strong>
          <p>一个事实库贯穿所有目标岗位，减少重复整理和重复生成。</p>
        </article>
      </div>
    </section>
  );
}

function Footer({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <footer className="cw-home-footer" id="footer">
      <button
        className="cw-home-footer-cta"
        onClick={() => navigateTo(ctaHref)}
        type="button"
      >
        <div className="cw-home-footer-cta-copy">
          <h2>准备把下一次申请放进可追踪工作流？</h2>
          <p>从事实库到目标简历，保留证据、风险、修改记录和人工决策。</p>
        </div>
        <span className="cw-home-footer-cta-arrow" aria-hidden="true">
          <ArrowRight size={76} strokeWidth={1.25} />
        </span>
      </button>
      <div className="cw-home-footer-bottom">
        <span>Copyright © 2026 Career Workbench.</span>
        <span>{ctaLabel}</span>
      </div>
    </footer>
  );
}

export { LandingPage };
