import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CareerLogo } from "@/components/brand/career-logo";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

import "./landing-page.css";

type Feature = {
  body: string;
  eyebrow: string;
  media: string;
  mediaType: "image" | "video";
  poster?: string;
  title: string;
};

const placeholderVideo =
  "https://plugin-assets.open-design.ai/plugins/evergreen-finance/hf_20260517_070729_32a7eb4e-d6e2-4571-badc-91b4dab1ecbe-2db9b1.mp4";

const placeholderImages = {
  hero: "https://placehold.co/1440x760/eaf0ff/16336f.png?text=Career+Workbench+Loop",
  profile:
    "https://placehold.co/1200x760/f5f7ff/0033ff.png?text=Profile+Fact+Library",
  jd: "https://placehold.co/1200x760/edf2ff/274690.png?text=JD+Parsing+Signals",
  match:
    "https://placehold.co/1200x760/eaf8f2/047857.png?text=Evidence+Match+Report",
  resume:
    "https://placehold.co/1200x760/fff7ed/c2410c.png?text=Editable+Target+Resume",
  enterprise:
    "https://placehold.co/960x720/f8fafc/1e3a8a.png?text=Traceable+AI+Workflow",
};

const buildFeatures: Feature[] = [
  {
    body: "把原始简历、项目、技能和经历沉淀成 Profile 事实库，后续所有 AI 输出都回到真实材料。",
    eyebrow: "01",
    media: placeholderImages.profile,
    mediaType: "image",
    title: "建立个人事实库",
  },
  {
    body: "将目标 JD 拆成职责、硬性要求、偏好信号和风险点，先判断这次申请是否值得投入。",
    eyebrow: "02",
    media: placeholderVideo,
    mediaType: "video",
    poster: placeholderImages.jd,
    title: "解析目标 JD",
  },
  {
    body: "匹配报告解释优势、缺口、风险和证据来源，而不是只给一个不可复核的分数。",
    eyebrow: "03",
    media: placeholderImages.match,
    mediaType: "image",
    title: "生成证据化匹配报告",
  },
  {
    body: "生成针对目标岗位的简历草稿，再通过 AI patch、编辑器和修改日志持续迭代。",
    eyebrow: "04",
    media: placeholderImages.resume,
    mediaType: "image",
    title: "定制并编辑目标简历",
  },
];

const trustCards = [
  {
    body: "每段生成内容都应能回到 Profile、JD 或用户确认过的修改记录。",
    number: "01",
    title: "Traceable",
  },
  {
    body: "AI 只提出 patch，用户决定采纳、拒绝或继续改写。",
    number: "02",
    title: "Editable",
  },
  {
    body: "解析、匹配和生成按需触发，缓存输入快照，避免重复花费。",
    number: "03",
    title: "Cost-aware",
  },
];

const footerColumns = [
  {
    links: [
      ["首页", "#product"],
      ["工作流", "#solutions"],
      ["可信机制", "#trust"],
    ],
    title: "Product",
  },
  {
    links: [
      ["Profile 事实库", "#solutions"],
      ["JD 解析", "#solutions"],
      ["匹配报告", "#solutions"],
      ["目标简历", "#solutions"],
    ],
    title: "Workflow",
  },
  {
    links: [
      ["产品边界", "#trust"],
      ["AI Trace", "#trust"],
      ["修改日志", "#trust"],
      ["本地 fixture", "#footer"],
    ],
    title: "Resources",
  },
  {
    links: [
      ["不自动投递", "#trust"],
      ["不绕过反爬", "#trust"],
      ["不编造经历", "#trust"],
      ["用户控制最终内容", "#trust"],
    ],
    title: "Trust",
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
          <button className="cw-home-mobile-menu" aria-label="打开导航">
            <Menu size={20} />
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
            Career Workbench 将个人事实库、目标
            JD、匹配叙事和可编辑简历放进同一个闭环，让 AI
            建议有来源、可复核、能继续迭代。
          </p>
        </div>
        <div className="cw-home-customer-strip" aria-label="核心流程">
          <span>Profile</span>
          <span>JD Parse</span>
          <span>Match</span>
          <span>Resume</span>
          <span>AI Patch</span>
          <span>Trace</span>
        </div>
        <div className="cw-home-hero-media-shell">
          <img src={placeholderImages.hero} alt="" loading="eager" />
        </div>
      </div>
    </section>
  );
}

function BuildScrollSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFeature = buildFeatures[activeIndex] ?? buildFeatures[0];

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

      setActiveIndex(
        Math.min(
          buildFeatures.length - 1,
          Math.max(0, Math.floor(progress * buildFeatures.length)),
        ),
      );
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
                当成一次性聊天窗口，而是让事实、目标、建议和修改记录在产品里连接起来。
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
            <div className="cw-home-build-media-card" key={activeFeature.title}>
              <MediaFrame feature={activeFeature} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MediaFrame({ feature }: { feature: Feature }) {
  return (
    <div className="cw-home-media-frame">
      {feature.mediaType === "video" ? (
        <div className="cw-home-video-placeholder">
          <img src={feature.poster} alt="" loading="lazy" />
          <video
            aria-hidden="true"
            src={feature.media}
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
      ) : (
        <img src={feature.media} alt="" loading="lazy" />
      )}
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
              className="cw-home-text-link"
              onClick={() => navigateTo(ctaHref)}
              type="button"
            >
              打开工作台
            </button>
            <a className="cw-home-primary-pill" href="#solutions">
              查看流程
            </a>
          </div>
        </div>
        <div className="cw-home-enterprise-visual">
          <img src={placeholderImages.enterprise} alt="" loading="lazy" />
          <div className="cw-home-impact-card">
            <span>THE LOOP</span>
            <strong>4</strong>
            <p>Profile、JD、Match、Resume 形成可追踪闭环</p>
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
      <div className="cw-home-footer-main">
        <div className="cw-home-footer-links">
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3>{column.title}</h3>
              {column.links.map(([label, href]) => (
                <a href={href} key={label}>
                  {label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <aside className="cw-home-footer-about" aria-label="产品说明">
          <div className="cw-home-footer-socials">
            <span>Profile</span>
            <span>JD</span>
            <span>AI</span>
            <span>Trace</span>
          </div>
          <p>
            面向开发者求职的 AI 工作台：用个人事实库和目标 JD
            生成可信、可追溯、可编辑的定制简历。
          </p>
          <div className="cw-home-footer-badges" aria-label="产品边界">
            <span>No auto apply</span>
            <span>No fake facts</span>
            <span>User control</span>
          </div>
        </aside>
      </div>
      <div className="cw-home-footer-bottom">
        <span>Copyright © 2026 Career Workbench.</span>
        <span>{ctaLabel}</span>
      </div>
    </footer>
  );
}

export { LandingPage };
