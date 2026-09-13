"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/src/components/AuthLayout";

// functions/api/auth/google-callback.ts がセッションCookieを発行した直後に遷移してくる中継画面。
// output: "export"の静的サイトのため、Cookie発行はできてもlocalStorage(spiUser)の更新はサーバー側では
// 行えない。ここでCookie認証済みの GET /api/me を呼び、既存のメール+パスワードログイン
// （app/login/page.tsx）と同じ形でspiUserを保存してから/dashboardへ渡す。
export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data: { error?: string; email?: string; last_name?: string; first_name?: string }) => {
        if (data.error || !data.email) {
          setError("ログインに失敗しました。もう一度お試しください。");
          return;
        }
        localStorage.setItem(
          "spiUser",
          JSON.stringify({ name: `${data.last_name ?? ""} ${data.first_name ?? ""}`.trim(), email: data.email })
        );
        router.replace("/dashboard");
      })
      .catch(() => setError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [router]);

  return (
    <AuthLayout title="ログイン処理中" subtitle="そのままお待ちください">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
          {error}
        </p>
      ) : (
        <p className="text-center text-sm text-gray-500">ログイン情報を確認しています...</p>
      )}
    </AuthLayout>
  );
}
