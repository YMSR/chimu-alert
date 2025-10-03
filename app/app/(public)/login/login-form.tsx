"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_CALLBACK = "/app/dashboard";

type Mode = "login" | "register";

type FormState = {
  email: string;
  password: string;
  name: string;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  name: "",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackParam = searchParams.get("callbackUrl");
  const callbackUrl =
    callbackParam && callbackParam.startsWith("/")
      ? callbackParam
      : DEFAULT_CALLBACK;

  const handleChange = (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formState.email,
            password: formState.password,
            name: formState.name,
          }),
        });

        if (!registerResponse.ok) {
          const payload = (await registerResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "Registration failed");
        }
      }

      const response = await signIn("email-password", {
        email: formState.email,
        password: formState.password,
        redirect: false,
        callbackUrl,
      });

      if (!response || response.error) {
        throw new Error("Invalid email or password");
      }

      router.push(response.url ?? callbackUrl);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === "login" ? "ログイン" : "アカウント登録"}
          </h1>
          <p className="text-sm text-slate-600">
            {mode === "login"
              ? "登録済みのメールアドレスとパスワードでサインインしてください。"
              : "メールアドレスとパスワードで新しいアカウントを作成します。"}
          </p>
        </header>

        <div className="flex rounded-full bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600"
            }`}
            disabled={loading}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 rounded-full px-4 py-2 transition ${
              mode === "register"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600"
            }`}
            disabled={loading}
          >
            登録
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                氏名（任意）
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange("name")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formState.email}
              onChange={handleChange("email")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formState.password}
              onChange={handleChange("password")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={loading}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? "送信中..."
              : mode === "login"
                ? "ログイン"
                : "登録してログイン"}
          </button>
        </form>
      </div>
    </main>
  );
}
