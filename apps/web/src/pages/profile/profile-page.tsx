import { useEffect, useState } from "react";

import { emptyProfile } from "@/pages/profile/data";
import {
  fetchProfileFromSupabase,
  saveProfileToSupabase,
} from "@/pages/profile/supabase-profile";
import type { ProfileSection } from "@/pages/profile/types";
import { useAuthStore } from "@/lib/auth-store";
import type { ProfileDraft } from "@career-workbench/domain";

import { ProfileDisplay } from "./components/profile-display";
import { ProfileDrawer } from "./components/profile-drawer";

export function ProfilePage() {
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
        isAuthConfigured
          ? "请先登录后再查看资料。"
          : "Supabase 环境变量未配置完整。",
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
    <section className="mx-auto grid w-full max-w-[1440px] gap-4 px-4 py-5 lg:px-6">
      {isLoadingProfile ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
          正在从 Supabase 读取资料...
        </p>
      ) : null}

      {loadError && !isDrawerOpen ? (
        <p className="rounded-lg bg-red-600/10 px-3 py-2 text-sm font-medium text-red-600">
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
