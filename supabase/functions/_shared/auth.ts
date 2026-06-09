/**
 * Supabase Edge Function 认证 helper。
 *
 * 这里使用调用者的 Authorization header 创建用户态 client，让后续表写入
 * 仍然经过 RLS；不要在这些用户流程里默认使用 service_role。
 */
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

/** 旧 admin 占位函数的返回结构，后续实现 admin 流程时再替换。 */
export type AdminAuthResult =
  | {
    ok: true;
    userId: string;
  }
  | {
    ok: false;
    status: number;
    message: string;
  };

export function requireAdminPlaceholder(request: Request): AdminAuthResult {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      ok: false,
      status: 401,
      message:
        "Missing authorization header. Wire Supabase Auth role checks before production use.",
    };
  }

  return {
    ok: true,
    userId: "admin-placeholder",
  };
}

/** 基于当前请求 JWT 得到用户态 Supabase client。 */
type AuthenticatedClientResult =
  | {
    ok: true;
    supabase: SupabaseClient<Database>;
    user: {
      id: string;
      email: string | null;
      user_metadata?: Record<string, unknown>;
    };
  }
  | {
    ok: false;
    status: number;
    message: string;
  };

function getSupabaseEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseAnonKey, supabaseUrl };
}

function getProfileName(metadata: Record<string, unknown> | undefined) {
  const name = metadata?.full_name ?? metadata?.name;

  return typeof name === "string" && name.trim().length > 0
    ? name.trim()
    : null;
}

function getAvatarUrl(metadata: Record<string, unknown> | undefined) {
  const avatarUrl = metadata?.avatar_url ?? metadata?.picture;

  return typeof avatarUrl === "string" && avatarUrl.trim().length > 0
    ? avatarUrl.trim()
    : null;
}

function createUserPayload(user: {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  return {
    avatar_url: getAvatarUrl(user.user_metadata),
    email: user.email,
    full_name: getProfileName(user.user_metadata),
    has_completed_onboarding: false,
    id: user.id,
  };
}

// 确保 auth.users 对应的 public.users 行存在，后续 profiles/resumes 外键依赖它。
async function requireAuthenticatedClient(
  request: Request,
): Promise<AuthenticatedClientResult> {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return {
      ok: false,
      status: 401,
      message: "Missing authorization header.",
    };
  }

  const env = getSupabaseEnv();

  if (!env) {
    return {
      ok: false,
      status: 500,
      message: "Missing SUPABASE_URL or SUPABASE_ANON_KEY.",
    };
  }

  const supabase = createClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    },
  );
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      message: error?.message ?? "Invalid Supabase session.",
    };
  }

  const user = {
    id: data.user.id,
    email: data.user.email ?? null,
    user_metadata: data.user.user_metadata as
      | Record<string, unknown>
      | undefined,
  };

  const { error: userError } = await supabase
    .from("users")
    .upsert(createUserPayload(user), {
      ignoreDuplicates: true,
      onConflict: "id",
    });

  if (userError) {
    return {
      ok: false,
      status: 500,
      message: userError.message,
    };
  }

  return {
    ok: true,
    supabase,
    user,
  };
}

export { requireAuthenticatedClient };
