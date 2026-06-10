import { BriefcaseBusiness } from "lucide-react";

type OnboardingAsideProps = {
  title: string;
};

function OnboardingAside({ title }: OnboardingAsideProps) {
  return (
    <aside className="hidden min-h-screen items-center bg-[linear-gradient(135deg,#e9fff2_0%,#ecf8ff_52%,#f6fff4_100%)] px-12 lg:flex">
      <div className="max-w-xl">
        <div className="mb-9 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
            <BriefcaseBusiness className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-semibold">Career</p>
              <span className="size-2 rounded-full bg-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              AI 求职工作台
            </p>
          </div>
        </div>
        <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight">
          {title}
        </h1>
      </div>
    </aside>
  );
}

export { OnboardingAside };
