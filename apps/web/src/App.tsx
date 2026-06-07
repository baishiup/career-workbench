import type { ReactNode } from "react";
import { useEffect } from "react";

import { workbenchNavItems } from "@/components/workbench/nav-items";
import { TopNav } from "@/components/workbench/top-nav";
import { JobsListPage } from "@/features/jobs/components/jobs-list-page";
import { JobDetailPage } from "@/features/jobs/components/job-detail-page";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { ProfileDisplay } from "@/features/profile/components/profile-display";
import { ProfileDrawer } from "@/features/profile/components/profile-drawer";
import type { ProfileSection } from "@/features/profile/types";
import { ResumesPage } from "@/features/resumes/components/resumes-page";
import { usePathname, navigateTo } from "@/lib/router";
import { useWorkbenchStore } from "@/lib/workbench-store";
import type { ProfileDraft } from "@career-workbench/resume";
import { useState } from "react";

function App() {
  const pathname = usePathname();
  const hasHydrated = useWorkbenchStore((state) => state.hasHydrated);
  const hasCompletedOnboarding = useWorkbenchStore(
    (state) => state.hasCompletedOnboarding,
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (pathname === "/") {
      navigateTo(hasCompletedOnboarding ? "/jobs" : "/onboarding", {
        replace: true,
      });
      return;
    }

    if (pathname !== "/onboarding" && !hasCompletedOnboarding) {
      navigateTo("/onboarding", { replace: true });
    }
  }, [hasCompletedOnboarding, hasHydrated, pathname]);

  if (!hasHydrated) {
    return <LoadingScreen text="Loading Career Workbench..." />;
  }

  if (pathname === "/" || (pathname !== "/onboarding" && !hasCompletedOnboarding)) {
    return <LoadingScreen text="正在准备工作台..." />;
  }

  if (pathname === "/onboarding") {
    return <OnboardingFlow />;
  }

  return <WorkbenchShell>{renderWorkbenchRoute(pathname)}</WorkbenchShell>;
}

function WorkbenchShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopNav items={workbenchNavItems} />
      {children}
    </main>
  );
}

function renderWorkbenchRoute(pathname: string) {
  if (pathname === "/jobs") {
    return <JobsListPage />;
  }

  const jobMatch = pathname.match(/^\/jobs\/([^/]+)$/);

  if (jobMatch) {
    return <JobDetailPage jobId={decodeURIComponent(jobMatch[1])} />;
  }

  if (pathname === "/resumes") {
    return <ResumesPage />;
  }

  if (pathname === "/profile") {
    return <ProfilePage />;
  }

  return <NotFoundPage />;
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground">
      {text}
    </main>
  );
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">页面不存在</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        当前 Vite 版本只保留职位、简历、资料和 onboarding 页面。
      </p>
    </section>
  );
}

function ProfilePage() {
  const profile = useWorkbenchStore((state) => state.profile);
  const setProfile = useWorkbenchStore((state) => state.setProfile);
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openSection, setOpenSection] = useState<ProfileSection | null>(null);

  function openEditor(section: ProfileSection) {
    setDraft(structuredClone(profile));
    setOpenSection(section);
    setIsDrawerOpen(true);
  }

  function saveEditor() {
    setProfile(draft);
    closeEditor();
  }

  function closeEditor() {
    setIsDrawerOpen(false);
  }

  return (
    <section className="mx-auto grid w-full max-w-[1320px] gap-4 px-4 py-5">
      <ProfileDisplay onEdit={openEditor} profile={profile} />

      {openSection ? (
        <ProfileDrawer
          draft={draft}
          onAfterOpenChange={(open) => {
            if (!open) {
              setOpenSection(null);
            }
          }}
          onClose={closeEditor}
          onDraftChange={setDraft}
          onSave={saveEditor}
          open={isDrawerOpen}
          section={openSection}
        />
      ) : null}
    </section>
  );
}

export { App };
