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
      message: "Missing authorization header. Wire Supabase Auth role checks before production use.",
    };
  }

  return {
    ok: true,
    userId: "admin-placeholder",
  };
}
