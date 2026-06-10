import { type FormEvent, useState } from "react";
import { Loader2, LogIn, UserPlus, UserRoundCheck } from "lucide-react";
import { Button, Input } from "@heroui/react";

import { OnboardingAside } from "@/components/onboarding/onboarding-aside";
import { useAuthStore } from "@/lib/auth-store";

function LoginPage() {
  const clearError = useAuthStore((state) => state.clearError);
  const error = useAuthStore((state) => state.error);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const isLoading = useAuthStore((state) => state.isLoading);
  const signInLocalTestUser = useAuthStore(
    (state) => state.signInLocalTestUser,
  );
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const signInWithPassword = useAuthStore(
    (state) => state.signInWithPassword,
  );
  const signUpWithPassword = useAuthStore(
    (state) => state.signUpWithPassword,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const isLocalSupabase =
    import.meta.env.DEV &&
    import.meta.env.VITE_SUPABASE_URL?.startsWith("http://127.0.0.1:54321");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    await signInWithPassword(email.trim(), password);
  }

  async function handleSignUp() {
    setMessage(null);
    const result = await signUpWithPassword(email.trim(), password);

    if (result.needsEmailConfirmation) {
      setMessage("注册成功，请先确认邮箱后再登录。");
    }
  }

  function updateEmail(value: string) {
    clearError();
    setMessage(null);
    setEmail(value);
  }

  function updatePassword(value: string) {
    clearError();
    setMessage(null);
    setPassword(value);
  }

  return (
    <main className="grid min-h-screen bg-white text-slate-900 lg:grid-cols-[minmax(360px,1fr)_minmax(520px,1fr)]">
      <OnboardingAside title="登录后继续使用 AI 求职工作台。" />

      <section className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
        <div className="flex w-full max-w-[560px] flex-col items-center">
          <Button
            fullWidth
            isDisabled={!isConfigured || isLoading}
            onPress={() => void signInWithGoogle()}
            size="lg"
            type="button"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="size-7 animate-spin text-slate-500" />
            ) : (
              <GoogleMark />
            )}
            <span>
              {isLoading ? "Connecting..." : "Continue with Google"}
            </span>
          </Button>

          <div className="my-6 flex w-full items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-normal text-slate-500">
              账号密码
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="flex w-full flex-col gap-4" onSubmit={handleSignIn}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">邮箱</span>
              <Input
                autoComplete="email"
                disabled={!isConfigured || isLoading}
                fullWidth
                onChange={(event) => updateEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
                variant="secondary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">密码</span>
              <Input
                autoComplete="current-password"
                disabled={!isConfigured || isLoading}
                fullWidth
                minLength={6}
                onChange={(event) => updatePassword(event.target.value)}
                placeholder="至少 6 位"
                type="password"
                value={password}
                variant="secondary"
              />
            </label>

            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <Button
                fullWidth
                isDisabled={!isConfigured || isLoading || !email || !password}
                type="submit"
                variant="primary"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                登录
              </Button>
              <Button
                fullWidth
                isDisabled={!isConfigured || isLoading || !email || !password}
                onPress={() => void handleSignUp()}
                type="button"
                variant="outline"
              >
                <UserPlus className="size-4" />
                注册
              </Button>
            </div>
          </form>

          {isLocalSupabase ? (
            <Button
              className="mt-4 self-center text-slate-500"
              isDisabled={!isConfigured || isLoading}
              onPress={() => void signInLocalTestUser()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <UserRoundCheck className="size-4" />
              使用测试账号 admin / 123456
            </Button>
          ) : null}

          {!isConfigured ? (
            <p className="mt-4 text-center text-sm font-medium text-slate-500">
              Supabase 环境变量未配置，当前只能使用 mock/demo 模式。
            </p>
          ) : null}

          {message ? (
            <p className="mt-4 text-center text-sm font-medium text-emerald-600">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 text-center text-sm font-medium text-red-600">
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
