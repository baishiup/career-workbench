import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { fetchProfileFromSupabase } from "@/lib/profile/api";
import { mockProfile } from "@/lib/profile/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { ProfileDraft } from "@career-workbench/domain";

type ProfileDraftState = {
  /** 当前用户的 Profile；未登录或加载失败时为 null。 */
  profile: ProfileDraft | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * 读取当前用户的 ProfileDraft，供职位列表/详情计算规则匹配分。
 * 无 Supabase env 的本地演示模式降级为 mock Profile。
 */
function useProfileDraft(): ProfileDraftState {
  const user = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const [state, setState] = useState<ProfileDraftState>({
    profile: isSupabaseConfigured ? null : mockProfile,
    isLoading: isSupabaseConfigured,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    if (isAuthLoading) {
      setState({ profile: null, isLoading: true, error: null });
      return;
    }

    if (!user) {
      setState({ profile: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ profile: null, isLoading: true, error: null });

    fetchProfileFromSupabase(user.id)
      .then((profile) => {
        if (!cancelled) {
          setState({ profile, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            profile: null,
            isLoading: false,
            error: error instanceof Error ? error.message : "读取 Profile 失败。",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  return state;
}

export { useProfileDraft };
export type { ProfileDraftState };
