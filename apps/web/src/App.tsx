import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { workbenchNavItems } from "@/components/workbench/nav-items";
import { TopNav } from "@/components/workbench/top-nav";
import { LoginPage } from "@/features/auth/components/login-page";
import { JobsListPage } from "@/features/jobs/components/jobs-list-page";
import { JobDetailPage } from "@/features/jobs/components/job-detail-page";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { ProfileDisplay } from "@/features/profile/components/profile-display";
import { ProfileDrawer } from "@/features/profile/components/profile-drawer";
import { emptyProfile } from "@/features/profile/data";
import {
  fetchProfileFromSupabase,
  saveProfileToSupabase,
} from "@/features/profile/supabase-profile";
import type { ProfileSection } from "@/features/profile/types";
import { ResumesPage } from "@/features/resumes/components/resumes-page";
import { useAuthStore } from "@/lib/auth-store";
import { usePathname, navigateTo } from "@/lib/router";
import { useWorkbenchStore } from "@/lib/workbench-store";
import type { ProfileDraft } from "@career-workbench/resume";

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

    if (pathname === "/") {
      navigateTo(canUseWorkbench ? nextWorkbenchPath : "/login", {
        replace: true,
      });
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

  if (
    pathname === "/" ||
    requiresLogin ||
    (pathname !== "/onboarding" && !hasPassedOnboarding)
  ) {
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
  const isAuthConfigured = useAuthStore((state) => state.isConfigured);
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile);
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfile);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [openSection, setOpenSection] = useState<ProfileSection | null>(null);

  useEffect(() => {
    if (!isAuthConfigured || !user) {
      setProfile(emptyProfile);
      setDraft(emptyProfile);
      setLoadError(
        isAuthConfigured ? "请先登录后再查看资料。" : "Supabase 环境变量未配置完整。",
      );
      return;
    }

    const userId = user.id;
    let didCancel = false;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setLoadError(null);
      setSaveError(null);

      try {
        const nextProfile = await fetchProfileFromSupabase(userId);

        if (!didCancel) {
          setProfile(nextProfile);
          setDraft(nextProfile);
        }
      } catch (error) {
        if (!didCancel) {
          setProfile(emptyProfile);
          setDraft(emptyProfile);
          setLoadError(
            error instanceof Error ? error.message : "资料读取失败。",
          );
        }
      } finally {
        if (!didCancel) {
          setIsLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      didCancel = true;
    };
  }, [isAuthConfigured, user]);

  function openEditor(section: ProfileSection) {
    setSaveError(null);
    setDraft(structuredClone(profile));
    setOpenSection(section);
    setIsDrawerOpen(true);
  }

  async function saveEditor() {
    if (isSavingProfile) {
      return;
    }

    if (!isAuthConfigured || !user) {
      setSaveError("请先登录后再保存资料。");
      return;
    }

    setIsSavingProfile(true);
    setSaveError(null);

    try {
      await saveProfileToSupabase(user.id, draft);
      setProfile(draft);
      closeEditor();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "资料保存失败。");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function closeEditor() {
    setIsDrawerOpen(false);
  }

  return (
    <section className="mx-auto grid w-full max-w-[1320px] gap-4 px-4 py-5">
      {isLoadingProfile ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
          正在从 Supabase 读取资料...
        </p>
      ) : null}

      {loadError && !isDrawerOpen ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          资料读取失败：{loadError}
        </p>
      ) : null}

      {!isLoadingProfile ? (
        <ProfileDisplay onEdit={openEditor} profile={profile} />
      ) : null}

      {openSection && !isLoadingProfile ? (
        <ProfileDrawer
          draft={draft}
          isSaving={isSavingProfile}
          onAfterOpenChange={(open) => {
            if (!open) {
              setOpenSection(null);
            }
          }}
          onClose={closeEditor}
          onDraftChange={setDraft}
          onSave={saveEditor}
          open={isDrawerOpen}
          saveError={saveError}
          section={openSection}
        />
      ) : null}
    </section>
  );
}

export { App };
