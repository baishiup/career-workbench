import type { ReactNode } from "react";
import { useEffect } from "react";

import { workbenchNavItems } from "@/components/workbench/nav-items";
import { TopNav } from "@/components/workbench/top-nav";
import { LandingPage } from "@/pages/landing/landing-page";
import { LoginPage } from "@/pages/login/login-page";
import { JobsListPage } from "@/pages/jobs-list/jobs-list-page";
import { JobDetailPage } from "@/pages/job-detail/job-detail-page";
import { JobImportPage } from "@/pages/job-import/job-import-page";
import { OnboardingFlow } from "@/pages/onboarding/onboarding-flow";
import { ProfilePage } from "@/pages/profile/profile-page";
import { ResumeDetailPage } from "@/pages/resume-detail/resume-detail-page";
import { ResumesPage } from "@/pages/resumes/resumes-page";
import { useAuthStore } from "@/lib/auth-store";
import { usePathname, navigateTo } from "@/lib/router";
import { useWorkbenchStore } from "@/lib/workbench-store";

function App() {
  const pathname = usePathname();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isProfileLoading = useAuthStore((state) => state.isProfileLoading);
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useWorkbenchStore((state) => state.hasHydrated);
  const hasCompletedOnboarding = useWorkbenchStore(
    (state) => state.hasCompletedOnboarding,
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (
      !hasHydrated ||
      (isAuthConfigured && (isAuthLoading || (user && isProfileLoading)))
    ) {
      return;
    }

    // "/" 是公开落地页，不参与登录/onboarding 重定向。
    if (pathname === "/") {
      return;
    }

    const isAuthenticated = Boolean(user);
    const canUseWorkbench = !isAuthConfigured || isAuthenticated;
    const hasPassedOnboarding = isAuthConfigured
      ? Boolean(profile?.hasCompletedOnboarding)
      : hasCompletedOnboarding;
    const nextWorkbenchPath = hasPassedOnboarding ? "/jobs" : "/onboarding";

    if (pathname === "/login") {
      if (isAuthConfigured && isAuthenticated) {
        navigateTo(nextWorkbenchPath, { replace: true });
      }

      return;
    }

    if (!canUseWorkbench) {
      navigateTo("/login", { replace: true });
      return;
    }

    if (pathname !== "/onboarding" && !hasPassedOnboarding) {
      navigateTo("/onboarding", { replace: true });
    }
  }, [
    hasCompletedOnboarding,
    hasHydrated,
    isAuthConfigured,
    isAuthLoading,
    isProfileLoading,
    pathname,
    profile,
    user,
  ]);

  // 落地页不依赖登录态，直接渲染，避免等待 auth 初始化。
  if (pathname === "/") {
    return <LandingPage />;
  }

  if (
    !hasHydrated ||
    (isAuthConfigured && (isAuthLoading || (user && isProfileLoading)))
  ) {
    return <LoadingScreen text="Loading Career Workbench..." />;
  }

  if (pathname === "/login") {
    if (isAuthConfigured && user) {
      return <LoadingScreen text="正在进入工作台..." />;
    }

    return <LoginPage />;
  }

  const requiresLogin = isAuthConfigured && !user;
  const hasPassedOnboarding = isAuthConfigured
    ? Boolean(profile?.hasCompletedOnboarding)
    : hasCompletedOnboarding;

  if (requiresLogin || (pathname !== "/onboarding" && !hasPassedOnboarding)) {
    return <LoadingScreen text="正在准备工作台..." />;
  }

  if (pathname === "/onboarding") {
    return <OnboardingFlow />;
  }

  return <WorkbenchShell>{renderWorkbenchRoute(pathname)}</WorkbenchShell>;
}

function WorkbenchShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav items={workbenchNavItems} />
      {children}
    </main>
  );
}

function renderWorkbenchRoute(pathname: string) {
  if (pathname === "/jobs") {
    return <JobsListPage />;
  }

  if (pathname === "/jobs/new") {
    return <JobImportPage />;
  }

  const jobEditMatch = pathname.match(/^\/jobs\/([^/]+)\/edit$/);

  if (jobEditMatch) {
    return <JobImportPage jobId={decodeURIComponent(jobEditMatch[1])} />;
  }

  const jobMatch = pathname.match(/^\/jobs\/([^/]+)$/);

  if (jobMatch) {
    return <JobDetailPage jobId={decodeURIComponent(jobMatch[1])} />;
  }

  if (pathname === "/resumes") {
    return <ResumesPage />;
  }

  const resumeMatch = pathname.match(/^\/resumes\/([^/]+)$/);

  if (resumeMatch) {
    return <ResumeDetailPage resumeId={decodeURIComponent(resumeMatch[1])} />;
  }

  if (pathname === "/profile") {
    return <ProfilePage />;
  }

  return <NotFoundPage />;
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
      {text}
    </main>
  );
}

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[960px] flex-col justify-center px-4 py-8">
      <p className="text-sm font-medium text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">页面不存在</h1>
      <p className="mt-2 text-sm text-slate-500">
        当前 Vite 版本只保留职位、简历、资料和 onboarding 页面。
      </p>
    </section>
  );
}

export { App };
