import { Loader2 } from "lucide-react";

import { OnboardingAside } from "@/features/onboarding/components/onboarding-aside";
import { useAuthStore } from "@/lib/auth-store";

function LoginPage() {
  const error = useAuthStore((state) => state.error);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const isLoading = useAuthStore((state) => state.isLoading);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  return (
    <main className="grid min-h-screen bg-card text-foreground lg:grid-cols-[minmax(360px,1fr)_minmax(520px,1fr)]">
      <OnboardingAside title="登录后继续使用 AI 求职工作台。" />

      <section className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
        <div className="flex w-full max-w-[560px] flex-col items-center">
          <button
            className="flex h-16 w-full items-center justify-center gap-4 rounded-2xl border border-[#dadce0] bg-white px-6 text-xl font-semibold text-[#1f1f1f] shadow-[0_1px_2px_rgba(60,64,67,0.12)] transition hover:bg-[#f8fafd] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isConfigured || isLoading}
            onClick={() => void signInWithGoogle()}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            ) : (
              <GoogleMark />
            )}
            <span>
              {isLoading ? "Connecting..." : "Continue with Google"}
            </span>
          </button>

          {!isConfigured ? (
            <p className="mt-4 text-center text-sm font-medium text-muted-foreground">
              Supabase 环境变量未配置，当前只能使用 mock/demo 模式。
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 text-center text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-8 shrink-0"
      viewBox="0 0 48 48"
    >
      <path
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.2 6.1 29.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.5-.4-3.5z"
        fill="#FFC107"
      />
      <path
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8.1 3.1l5.7-5.7C34.2 6.1 29.9 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
        fill="#FF3D00"
      />
      <path
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.5 5C9.4 39.3 16.1 44 24 44z"
        fill="#4CAF50"
      />
      <path
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C36.8 39.1 44 34 44 24c0-1.3-.1-2.5-.4-3.5z"
        fill="#1976D2"
      />
    </svg>
  );
}

export { LoginPage };
