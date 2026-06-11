import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  FileText,
  PenLine,
  ScanSearch,
  Target,
  Upload,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";

import Link from "@/components/router-link";
import { useAuthStore } from "@/lib/auth-store";
import { navigateTo } from "@/lib/router";

type FeatureIcon = ComponentType<SVGProps<SVGSVGElement>>;

type Feature = {
  description: string;
  icon: FeatureIcon;
  title: string;
};

const features: Feature[] = [
  {
    description:
      "上传 PDF 简历，AI 自动解析为结构化的个人档案：工作经历、项目、技能一次到位，免去手动录入。",
    icon: Upload,
    title: "简历智能解析",
  },
  {
    description:
      "职位以结构化 JD 呈现：职责、要求、技术栈清晰分块，支持按方向和关键词筛选，告别大段原文。",
    icon: BriefcaseBusiness,
    title: "结构化职位库",
  },
  {
    description:
      "把你的档案与目标 JD 逐项对照，给出匹配分和差距分析，让你清楚每个职位值不值得投。",
    icon: Target,
    title: "JD 匹配分析",
  },
  {
    description:
      "面向目标职位一键生成定制简历：保留真实经历，按 JD 重点重新组织表达和侧重。",
    icon: WandSparkles,
    title: "定制简历生成",
  },
  {
    description:
      "表单化编辑 + 实时预览，段落排序、样式调整所见即所得，随时导出投递。",
    icon: PenLine,
    title: "在线简历编辑器",
  },
  {
    description:
      "对话式 AI 助手陪你逐段打磨简历内容，量化成果、突出亮点，而不是堆砌套话。",
    icon: Bot,
    title: "AI 简历助手",
  },
];

type Step = {
  description: string;
  icon: FeatureIcon;
  title: string;
};

const steps: Step[] = [
  {
    description: "上传现有简历或填写资料，AI 解析成你的结构化职业档案。",
    icon: FileText,
    title: "建立档案",
  },
  {
    description: "在职位库浏览结构化 JD，查看每个职位与你的匹配分析。",
    icon: ScanSearch,
    title: "匹配职位",
  },
  {
    description: "为选中的职位生成定制简历，在编辑器里打磨后导出投递。",
    icon: WandSparkles,
    title: "定制投递",
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
    <main className="min-h-screen bg-white text-slate-900">
      <LandingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />

      <section className="bg-[linear-gradient(135deg,#e9fff2_0%,#ecf8ff_52%,#f6fff4_100%)]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center px-4 pb-20 pt-16 text-center lg:pt-24">
          <Chip className="border border-slate-200 bg-white/80 text-xs font-semibold text-slate-600">
            面向开发者的 AI 求职工作台
          </Chip>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            让每一份简历，
            <br className="sm:hidden" />
            都为目标职位
            <span className="text-blue-600">量身定制</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Career Workbench 用 AI 解析你的简历、对照结构化
            JD、生成匹配分析，并为每个目标职位定制一份更有说服力的简历。
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              onPress={() => navigateTo(ctaHref)}
              size="lg"
              type="button"
              variant="primary"
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              onPress={() => navigateTo(ctaHref)}
              size="lg"
              type="button"
              variant="outline"
            >
              <BriefcaseBusiness className="size-4" />
              浏览职位库
            </Button>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500">
            支持 Google 账号一键登录
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 py-20">
        <SectionHeading
          eyebrow="核心功能"
          title="从简历到投递，一个工作台搞定"
          description="不是又一个简历模板站。Career Workbench 围绕「档案 → 职位 → 定制简历」的主路径，把求职中最费时间的环节交给 AI。"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard feature={feature} key={feature.title} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-20">
          <SectionHeading
            eyebrow="使用流程"
            title="三步开始你的定制化求职"
            description="完成一次档案建立，之后每个目标职位只需要几分钟。"
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <StepCard index={index} key={step.title} step={step} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1080px] px-4 py-20">
        <div className="flex flex-col items-center rounded-2xl bg-[linear-gradient(135deg,#e9fff2_0%,#ecf8ff_52%,#f6fff4_100%)] px-6 py-14 text-center">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight">
            准备好让简历替你说话了吗？
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            登录即可建立你的职业档案，开始浏览职位并生成第一份定制简历。
          </p>
          <Button
            className="mt-7"
            onPress={() => navigateTo(ctaHref)}
            size="lg"
            type="button"
            variant="primary"
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center justify-between px-4">
        <Link className="flex items-center gap-2" href="/">
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
            <BriefcaseBusiness className="size-4" />
          </span>
          <span className="flex items-center text-lg font-bold tracking-tight">
            Career
            <span className="text-blue-600">.</span>
          </span>
        </Link>
        <Button
          onPress={() => navigateTo(ctaHref)}
          size="sm"
          type="button"
          variant="primary"
        >
          {ctaLabel}
        </Button>
      </div>
    </header>
  );
}

function SectionHeading({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <span className="flex size-10 items-center justify-center rounded-lg bg-sky-100 text-blue-600">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {feature.description}
      </p>
    </article>
  );
}

function StepCard({ index, step }: { index: number; step: Step }) {
  const Icon = step.icon;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-blue-600">
          {index + 1}
        </span>
        <Icon aria-hidden="true" className="size-5 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {step.description}
      </p>
    </article>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
        <FooterBrand />
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Career Workbench
        </p>
      </div>
    </footer>
  );
}

function FooterBrand(): ReactNode {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <UserRound className="size-4 text-slate-400" />
      <span>
        Career
        <span className="text-blue-600">.</span>
      </span>
      <span className="font-medium text-slate-500">AI 求职工作台</span>
    </div>
  );
}

export { LandingPage };
