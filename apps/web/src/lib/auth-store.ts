import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { ProfileDraft } from "@career-workbench/domain";

type AuthProfile = {
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
  hasCompletedOnboarding: boolean;
  id: string;
  /** admin 才能导入/编辑/停用职位；置位只在数据库手动完成。 */
  isAdmin: boolean;
};

type UserRow = {
  avatar_url: string | null;
  email: string | null;
  full_name: string | null;
  has_completed_onboarding: boolean;
  id: string;
  is_admin: boolean;
};

type PasswordSignUpResult = {
  needsEmailConfirmation: boolean;
};

type AuthState = {
  error: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  profile: AuthProfile | null;
  profileError: string | null;
  session: Session | null;
  user: User | null;
  clearError: () => void;
  completeProfileOnboarding: (profileData?: ProfileDraft) => Promise<boolean>;
  initializeAuth: () => void;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInLocalTestUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<PasswordSignUpResult>;
};

let hasInitializedAuth = false;
const localTestUserEmail = "admin@career-workbench.dev";
const localTestUserPassword = "123456";

function getProfileName(user: User) {
  const metadata = user.user_metadata;
  const name = metadata.full_name ?? metadata.name;

  return typeof name === "string" && name.trim().length > 0 ? name : null;
}

function getAvatarUrl(user: User) {
  const metadata = user.user_metadata;
  const avatarUrl = metadata.avatar_url ?? metadata.picture;

  return typeof avatarUrl === "string" && avatarUrl.trim().length > 0
    ? avatarUrl
    : null;
}

function toProfile(row: UserRow): AuthProfile {
  return {
    avatarUrl: row.avatar_url,
    email: row.email,
    fullName: row.full_name,
    hasCompletedOnboarding: row.has_completed_onboarding,
    id: row.id,
    isAdmin: row.is_admin,
  };
}

function createUserPayload(user: User): Omit<UserRow, "is_admin"> {
  return {
    avatar_url: getAvatarUrl(user),
    email: user.email ?? null,
    full_name: getProfileName(user),
    has_completed_onboarding: false,
    id: user.id,
  };
}

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as { message?: string; name?: string };

  return (
    authError.name === "AuthSessionMissingError" ||
    authError.message?.toLowerCase().includes("auth session missing")
  );
}

async function ensureUser(user: User) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: existingUser, error: selectError } = await supabase
    .from("users")
    .select("id,email,full_name,avatar_url,has_completed_onboarding,is_admin")
    .eq("id", user.id)
    .maybeSingle<UserRow>();

  if (selectError) {
    throw selectError;
  }

  if (existingUser) {
    return toProfile(existingUser);
  }

  const { data: createdUser, error: insertError } = await supabase
    .from("users")
    .upsert(createUserPayload(user), { onConflict: "id" })
    .select("id,email,full_name,avatar_url,has_completed_onboarding,is_admin")
    .single<UserRow>();

  if (insertError) {
    throw insertError;
  }

  return toProfile(createdUser);
}

export const useAuthStore = create<AuthState>()((set) => ({
  error: null,
  isConfigured: isSupabaseConfigured,
  isLoading: isSupabaseConfigured,
  isProfileLoading: false,
  profile: null,
  profileError: null,
  session: null,
  user: null,
  clearError: () => set({ error: null }),
  completeProfileOnboarding: async (profileData) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return true;
    }

    const user = useAuthStore.getState().user;

    if (!user) {
      return false;
    }

    set({ isProfileLoading: true, profileError: null });

    const updatedAt = new Date().toISOString();

    if (profileData) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          profile_data: profileData,
          source: "onboarding",
          updated_at: updatedAt,
          user_id: user.id,
        },
        { onConflict: "user_id" },
      );

      if (profileError) {
        set({
          error: profileError.message,
          isProfileLoading: false,
          profileError: profileError.message,
        });
        return false;
      }
    }

    const updatePayload: {
      has_completed_onboarding: boolean;
      updated_at: string;
    } = {
      has_completed_onboarding: true,
      updated_at: updatedAt,
    };

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", user.id)
      .select("id,email,full_name,avatar_url,has_completed_onboarding,is_admin")
      .single<UserRow>();

    if (error) {
      set({
        error: error.message,
        isProfileLoading: false,
        profileError: error.message,
      });
      return false;
    }

    set({
      isProfileLoading: false,
      profile: toProfile(data),
      profileError: null,
    });
    return true;
  },
  initializeAuth: () => {
    if (hasInitializedAuth) {
      return;
    }

    hasInitializedAuth = true;

    if (!isSupabaseConfigured) {
      set({ isLoading: false, isProfileLoading: false });
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      set({
        error: "Supabase 环境变量未配置完整。",
        isLoading: false,
        isProfileLoading: false,
      });
      return;
    }

    void useAuthStore.getState().refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (event === "SIGNED_OUT") {
        set({
          error: null,
          isLoading: false,
          isProfileLoading: false,
          profile: null,
          profileError: null,
          session: null,
          user: null,
        });
        return;
      }

      set({
        error: null,
        isLoading: Boolean(session),
        isProfileLoading: Boolean(session?.user),
        profileError: null,
        session,
      });

      if (session?.user) {
        void useAuthStore.getState().refreshUser();
      }
    });

    window.addEventListener("beforeunload", () => subscription.unsubscribe(), {
      once: true,
    });
  },
  refreshProfile: async () => {
    const user = useAuthStore.getState().user;

    if (!user) {
      set({ isProfileLoading: false, profile: null, profileError: null });
      return;
    }

    set({ isProfileLoading: true, profileError: null });

    try {
      const profile = await ensureUser(user);
      set({ isProfileLoading: false, profile, profileError: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "读取用户资料失败。";
      set({
        error: message,
        isProfileLoading: false,
        profile: null,
        profileError: message,
      });
    }
  },
  refreshUser: async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({ isLoading: false, isProfileLoading: false });
      return;
    }

    set({ isLoading: true, profileError: null });

    try {
      const [{ data: sessionData }, { data: userData, error: userError }] =
        await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

      if (userError || !userData.user) {
        const shouldShowError = userError && !isMissingSessionError(userError);

        set({
          error: shouldShowError ? userError.message : null,
          isLoading: false,
          isProfileLoading: false,
          profile: null,
          profileError: null,
          session: null,
          user: null,
        });
        return;
      }

      set({
        error: null,
        isLoading: false,
        isProfileLoading: true,
        session: sessionData.session,
        user: userData.user,
      });

      await useAuthStore.getState().refreshProfile();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "读取登录状态失败。";
      set({
        error: message,
        isLoading: false,
        isProfileLoading: false,
        profile: null,
        profileError: null,
        session: null,
        user: null,
      });
    }
  },
  signInWithGoogle: async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({
        error: "请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。",
      });
      return;
    }

    set({ error: null, isLoading: true });

    const { error } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
      provider: "google",
    });

    if (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  signInWithPassword: async (email, password) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({
        error: "请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。",
      });
      return;
    }

    set({ error: null, isLoading: true });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }

    await useAuthStore.getState().refreshUser();
  },
  signInLocalTestUser: async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({
        error: "请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。",
      });
      return;
    }

    set({ error: null, isLoading: true });

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: localTestUserEmail,
      password: localTestUserPassword,
    });

    if (!signInError) {
      await useAuthStore.getState().refreshUser();
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: localTestUserEmail,
      password: localTestUserPassword,
    });

    if (signUpError) {
      set({ error: signUpError.message, isLoading: false });
      return;
    }

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: localTestUserEmail,
      password: localTestUserPassword,
    });

    if (retryError) {
      set({ error: retryError.message, isLoading: false });
      return;
    }

    await useAuthStore.getState().refreshUser();
  },
  signOut: async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({ profile: null, session: null, user: null });
      return;
    }

    const { error } = await supabase.auth.signOut();

    set({
      error: error?.message ?? null,
      isProfileLoading: false,
      profile: null,
      profileError: null,
      session: null,
      user: null,
    });
  },
  signUpWithPassword: async (email, password) => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      set({
        error: "请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。",
      });
      return { needsEmailConfirmation: false };
    }

    set({ error: null, isLoading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, isLoading: false });
      return { needsEmailConfirmation: false };
    }

    if (!data.session) {
      set({ isLoading: false });
      return { needsEmailConfirmation: true };
    }

    await useAuthStore.getState().refreshUser();
    return { needsEmailConfirmation: false };
  },
}));

export type { AuthProfile };
