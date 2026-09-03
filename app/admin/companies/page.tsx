"use client";

import { useEffect, useState } from "react";
import { CompanyManagementPanel } from "@/src/components/admin/CompanyManagementPanel";
import { BackLink } from "@/src/components/BackLink";

const TOKEN_STORAGE_KEY = "adminApiToken";

export default function AdminCompaniesPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) setAdminToken(stored);
  }, []);

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.trim());
    setAdminToken(tokenInput.trim());
  }

  function handleAuthError() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setAdminToken(null);
  }

  if (!adminToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 py-10">
        <h1 className="text-xl font-bold text-gray-900">管理者ログイン</h1>
        <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            管理APIトークン
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            入る
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <BackLink href="/admin/dashboard" label="運営管理画面へ戻る" />
      <h1 className="text-xl font-bold text-gray-900">直接採用企業 お申し込み管理（利用審査申請・資料請求）</h1>
      <CompanyManagementPanel adminToken={adminToken} onAuthError={handleAuthError} />
    </main>
  );
}
