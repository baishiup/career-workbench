import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  MessageSquareText,
  PackageCheck,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@heroui/react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

import "./landing-page.css";

type LandingIcon = ComponentType<SVGProps<SVGSVGElement>>;

type FeatureItem = {
  description: string;
  icon: LandingIcon;
  title: string;
};

type EcosystemItem = {
  description: string;
  index: string;
  title: string;
};

const navItems = [
  { href: "product", label: "Product" },
  { href: "workflow", label: "Workflow" },
  { href: "match", label: "Match" },
  { href: "resume", label: "Resume" },
  { href: "community", label: "Community" },
];

const proofLabels = [
  "Profile",
  "JD Match",
  "AI Narrative",
  "Target Resume",
  "Trace",
  "Export",
];

const buildItems: FeatureItem[] = [
  {
    description:
      "Upload or maintain a structured developer profile, then keep every generated resume grounded in real experience.",
    icon: FileText,
    title: "Profile as source of truth",
  },
  {
    description:
      "Turn a job description into responsibilities, requirements, seniority signals, tech stack, and hidden preferences.",
    icon: GitBranch,
    title: "JD parsing and structure",
  },
  {
    description:
      "Move from profile and JD to a target-ready version without losing editability or evidence.",
    icon: PencilLine,
    title: "Target resume generation",
  },
];

const connectItems: FeatureItem[] = [
  {
    description:
      "Supabase keeps auth, profile, jobs, resumes, and reports in the product boundary instead of a model notebook.",
    icon: Database,
    title: "Connect product data",
  },
  {
    description:
      "Dify workflows handle parsing, matching narrative, and generation behind controlled Edge Functions.",
    icon: Workflow,
    title: "Connect AI workflows",
  },
  {
    description:
      "Each AI output is converted back into structured workbench state for review, edit, and reuse.",
    icon: Layers3,
    title: "Connect generated artifacts",
  },
];

const readyItems: FeatureItem[] = [
  {
    description:
      "The AI can recommend stronger wording, but it should not invent projects, metrics, or background facts.",
    icon: ShieldCheck,
    title: "Fact-safe by default",
  },
  {
    description:
      "Match reports show strengths, gaps, risks, and next actions instead of hiding the reasoning.",
    icon: MessageSquareText,
    title: "Explainable AI narrative",
  },
  {
    description:
      "Generated resumes remain editable in the workbench, with style controls and future change logs.",
    icon: PackageCheck,
    title: "Editable delivery",
  },
];

const startupItems = [
  "Validate a job target before rewriting the whole resume.",
  "Prioritize opportunities with a transparent match report.",
  "Generate a first draft, then keep human review in the loop.",
];

const ecosystemItems: EcosystemItem[] = [
  {
    description:
      "Resume parsing, target generation, and future AI chat can share the same trace contract.",
    index: "01",
    title: "AI Run Trace",
  },
  {
    description:
      "Profile, JD, match report, and target resume stay as product objects instead of prompt blobs.",
    index: "02",
    title: "Structured Career Data",
  },
  {
    description:
      "Local fixture mode keeps UI work fast while Supabase mode validates the real MVP path.",
    index: "03",
    title: "Local to Supabase",
  },
];

function LandingPage() {
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  const canEnterWorkbench = !isAuthConfigured || isAuthenticated;
  const ctaHref = canEnterWorkbench ? "/jobs" : "/login";
  const ctaLabel = canEnterWorkbench ? "进入工作台" : "Get Started";

  return (
    <main className="cw-landing">
      <LandingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />

      <section className="cw-hero cw-grid-shell" id="product">
        <div className="cw-hero-announcement">
          <strong>Career Workbench MVP</strong>
          <span>Developer-first AI job search workspace</span>
          <ArrowRight className="size-4" />
        </div>

        <div className="cw-hero-title-row">
          <div className="cw-hero-heading-column">
            <h1>
              Build Target-Ready
              <span>Career Workflow</span>
            </h1>
            <p className="cw-hero-proof-line">
              <span />
              Developer-first workflow for{" "}
              <strong>Profile, JD, Match, Resume</strong>
            </p>
          </div>
          <button
            aria-label="查看工作流"
            className="cw-hero-scroll"
            onClick={() => scrollToSection("workflow")}
            type="button"
          >
            <ChevronDown className="size-7" />
          </button>
        </div>

        <div className="cw-hero-description-row">
          <p>
            Career Workbench turns your Profile, target JD, AI narrative, and
            editable resume into one traceable workflow, so every application is
            specific, grounded, and ready to refine.
          </p>
        </div>

        <div
          className="cw-proof-strip"
          aria-label="Career Workbench core objects"
        >
          {proofLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <WorkflowCanvasMockup />
      </section>

      <FeatureSection
        eyebrow="BUILD"
        id="workflow"
        items={buildItems}
        summary="From profile to target resume, keep your AI-assisted job search grounded in real career facts."
        title="From source profile to live application, bring each job target into one clear workflow."
      />

      <FeatureSection
        eyebrow="Connect"
        id="match"
        items={connectItems}
        media="stack"
        summary="Connect the data layer, AI workflows, and review surfaces without turning the product into a prompt dump."
        title="Supercharge career matching with structured data, Dify workflows, and editable outputs."
      />

      <section className="cw-ready-section cw-grid-shell" id="resume">
        <div className="cw-section-kicker">
          <span />
          Production Ready
        </div>
        <div className="cw-ready-heading">
          <h2>Trustworthy AI resume work since day one.</h2>
          <p>
            The product is designed around facts, explanations, and user
            control, not one-click resume magic.
          </p>
        </div>
        <div className="cw-ready-grid">
          {readyItems.map((item) => (
            <FeatureCard item={item} key={item.title} />
          ))}
        </div>
      </section>

      <section className="cw-enterprise-section cw-grid-shell">
        <div className="cw-enterprise-copy">
          <div className="cw-section-kicker">
            <span />
            For serious job search
          </div>
          <h2>
            Solid career infrastructure for developers who apply with intent.
          </h2>
          <p>
            Replace scattered resume files, copy-pasted JD notes, and vague AI
            suggestions with a single workspace that keeps decisions visible.
          </p>
        </div>
        <div className="cw-metrics-board">
          <MetricTile
            label="Core loop"
            value="Profile -> JD -> Match -> Resume"
          />
          <MetricTile label="AI outputs" value="Evidence, gaps, risks" />
          <MetricTile label="Human control" value="Review, edit, save" />
          <MetricTile label="MVP boundary" value="No scraping, no auto-apply" />
        </div>
      </section>

      <section className="cw-startup-section cw-grid-shell">
        <div className="cw-section-kicker">
          <span />
          Startup
        </div>
        <div className="cw-startup-layout">
          <h2>
            Unlock your next role
            <span>with a tighter AI workflow.</span>
          </h2>
          <ul>
            {startupItems.map((item) => (
              <li key={item}>
                <CheckCircle2 className="size-5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cw-community-section cw-grid-shell" id="community">
        <div>
          <div className="cw-section-kicker">
            <span />
            Community
          </div>
          <h2>Built for developer job-search loops.</h2>
        </div>
        <div className="cw-community-cards">
          <QuoteCard
            name="Profile-first"
            quote="Every suggestion should map back to real experience, not generic resume advice."
          />
          <QuoteCard
            name="JD-aware"
            quote="Matching should explain why the target is worth time before writing starts."
          />
        </div>
      </section>

      <section className="cw-ecosystem-section cw-grid-shell">
        <div className="cw-ecosystem-heading">
          <div className="cw-section-kicker">
            <span />
            Ecosystem
          </div>
          <h2>
            And,
            <span>an expanding workbench ahead</span>
          </h2>
        </div>
        <div className="cw-ecosystem-list">
          {ecosystemItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.index}</span>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cw-bottom-cta">
        <div>
          <h2>Ready to build your next target resume?</h2>
          <p>
            Start from your profile, analyze a real JD, and generate an editable
            version grounded in your own evidence.
          </p>
        </div>
        <Button
          className="cw-bottom-cta-button"
          onPress={() => navigateTo(ctaHref)}
          type="button"
        >
          {ctaLabel}
          <ArrowRight className="size-7" />
        </Button>
      </section>

      <LandingFooter />
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
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => scrollToSection(item.href)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Button
          className="cw-header-cta"
          onPress={() => navigateTo(ctaHref)}
          type="button"
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="size-6" />
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

function WorkflowCanvasMockup() {
  return (
    <section className="cw-workflow-media" aria-label="产品工作流占位图">
      <div className="cw-canvas-toolbar">
        <span>Career Workflow</span>
        <div>
          <button type="button">Preview</button>
          <button type="button">Trace</button>
          <button type="button">Export</button>
        </div>
      </div>
      <div className="cw-canvas-surface">
        <WorkflowNode
          className="cw-node-profile"
          icon={FileText}
          label="PROFILE"
          title="Developer Profile"
        />
        <WorkflowNode
          className="cw-node-jd"
          icon={GitBranch}
          label="JOB"
          title="Target JD"
        />
        <WorkflowNode
          className="cw-node-match"
          icon={Gauge}
          label="MATCH"
          title="AI Narrative"
        />
        <WorkflowNode
          className="cw-node-resume"
          icon={Sparkles}
          label="OUTPUT"
          title="Target Resume"
        />
        <div className="cw-canvas-line cw-line-one" />
        <div className="cw-canvas-line cw-line-two" />
        <div className="cw-canvas-line cw-line-three" />
        <div className="cw-canvas-panel">
          <span>Recommended next action</span>
          <strong>Strengthen performance evidence</strong>
          <small>Profile fact required before rewrite</small>
        </div>
      </div>
    </section>
  );
}

function WorkflowNode({
  className,
  icon: Icon,
  label,
  title,
}: {
  className: string;
  icon: LandingIcon;
  label: string;
  title: string;
}) {
  return (
    <article className={`cw-workflow-node ${className}`}>
      <span>
        <Icon className="size-5" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
      </div>
    </article>
  );
}

function FeatureSection({
  eyebrow,
  id,
  items,
  media = "canvas",
  summary,
  title,
}: {
  eyebrow: string;
  id: string;
  items: FeatureItem[];
  media?: "canvas" | "stack";
  summary: string;
  title: string;
}) {
  return (
    <section className="cw-feature-section cw-grid-shell" id={id}>
      <div className="cw-section-kicker">
        <span />
        {eyebrow}
      </div>
      <div className="cw-feature-layout">
        <div className="cw-feature-copy">
          <h2>{title}</h2>
          <div className="cw-feature-list">
            {items.map((item) => (
              <FeatureCard item={item} key={item.title} />
            ))}
          </div>
        </div>
        <div className="cw-feature-media">
          {media === "stack" ? <IntegrationStackMockup /> : <BuildMockup />}
        </div>
      </div>
      <p className="cw-feature-summary">{summary}</p>
    </section>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  const Icon = item.icon;

  return (
    <article className="cw-feature-card">
      <Icon className="size-6" />
      <div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

function BuildMockup() {
  return (
    <div className="cw-build-mockup" aria-label="BUILD 区占位插图">
      <div className="cw-resume-sheet">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="cw-build-menu">
        <strong>Add block</strong>
        <span>Profile fact</span>
        <span>Project evidence</span>
        <span>Match insight</span>
        <span>Resume section</span>
      </div>
      <div className="cw-mini-output">
        <Brain className="size-5" />
        <span>Generate target draft</span>
      </div>
    </div>
  );
}

function IntegrationStackMockup() {
  return (
    <div className="cw-stack-mockup" aria-label="Connect 区占位插图">
      {[
        ["Supabase", "Auth / Profile / Resume"],
        ["Edge Function", "Controlled AI gateway"],
        ["Dify Workflow", "Parse / Match / Generate"],
        ["Workbench UI", "Review / Edit / Save"],
      ].map(([title, label]) => (
        <div key={title}>
          <strong>{title}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function QuoteCard({ name, quote }: { name: string; quote: string }) {
  return (
    <article className="cw-quote-card">
      <p>{quote}</p>
      <span>{name}</span>
    </article>
  );
}

function LandingFooter() {
  return (
    <footer className="cw-landing-footer">
      <div className="cw-footer-columns">
        <div>
          <strong>RESOURCES</strong>
          <span>Docs</span>
          <span>Product notes</span>
          <span>Local operations</span>
        </div>
        <div>
          <strong>WORKBENCH</strong>
          <span>Jobs</span>
          <span>Resumes</span>
          <span>Profile</span>
        </div>
        <div>
          <strong>PROGRAMS</strong>
          <span>AI matching</span>
          <span>Resume generation</span>
          <span>Trace ready</span>
        </div>
        <div>
          <strong>BOUNDARY</strong>
          <span>No auto-apply</span>
          <span>No job scraping</span>
          <span>User-controlled edits</span>
        </div>
      </div>
      <div className="cw-footer-brand">
        <BrandLogo />
        <p>
          Build target-ready career workflows with Career Workbench. Profile,
          match, narrative, and resume in one editable loop.
        </p>
      </div>
    </footer>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export { LandingPage };
