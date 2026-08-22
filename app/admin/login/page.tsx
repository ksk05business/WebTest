"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_STORAGE_KEY = "adminApiToken";

// 管理者ログイン画面。ADMIN_API_TOKEN（Pages Secret）をそのままパスワードとして扱う簡易認証で、
// サーバー側での事前検証は行わず、入力値をsessionStorageに保存して /admin/dashboard へ遷移する
// （実際の正誤は、その後の管理APIへのリクエストがx-admin-tokenヘッダーで検証される）。
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, password.trim());
    router.replace("/admin/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900">管理者ログイン</h1>
        <p className="text-sm text-gray-500">運営専用の管理画面です。</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          管理者パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
