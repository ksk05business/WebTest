"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/src/components/AuthLayout";
import { IconInput } from "@/src/components/IconInput";
import { GoogleLoginButton } from "@/src/components/GoogleLoginButton";

// functions/api/auth/google-callback.ts が失敗時に付与する ?error= の文言。
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  no_account: "このGoogleアカウントに対応する登録済みアカウントが見つかりませんでした。先に会員登録を行ってください。",
  oauth_denied: "Googleログインがキャンセルされました。",
  oauth_state: "Googleログインの検証に失敗しました。もう一度お試しください。",
  oauth_unverified: "メールアドレスが確認されていないGoogleアカウントではログインできません。",
  oauth_config: "現在Googleログインをご利用いただけません。",
  oauth_failed: "Googleログインに失敗しました。もう一度お試しください。",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] ?? "ログインに失敗しました。");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: { error?: string; name?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合（例: エンドポイント未配信）
      }
      if (!res.ok || !data.name) {
        setError(data.error ?? `ログインに失敗しました（status: ${res.status}）`);
        return;
      }
      localStorage.setItem("spiUser", JSON.stringify({ name: data.name, email }));
      router.push("/dashboard");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="ログイン" subtitle="アカウントにログインして模試・スカウトを確認しましょう">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          メールアドレス
          <IconInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          パスワード
          <IconInput
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        または
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
          会員登録
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-gray-600">
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700">
          パスワードをお忘れですか？
        </Link>
      </p>
    </AuthLayout>
  );
}
