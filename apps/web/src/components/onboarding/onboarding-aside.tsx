import { CareerLogo } from "@/components/brand/career-logo";

type OnboardingAsideProps = {
  title: string;
};

function OnboardingAside({ title }: OnboardingAsideProps) {
  return (
    <aside className="hidden min-h-screen items-center bg-[linear-gradient(135deg,#e9fff2_0%,#ecf8ff_52%,#f6fff4_100%)] px-12 lg:flex">
      <div className="max-w-xl">
        <CareerLogo className="mb-9" size="lg" />
        <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight">
          {title}
        </h1>
      </div>
    </aside>
  );
}

export { OnboardingAside };
