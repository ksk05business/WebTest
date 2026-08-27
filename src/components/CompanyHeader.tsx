"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function CompanyHeader({ companyName }: { companyName: string }) {
  const router = useRouter();

  function handleLogout() {
    fetch("/api/company/logout", { method: "POST" }).catch(() => {
      // ログアウトAPI呼び出しに失敗しても、ローカルの状態はクリアしてログイン画面へ戻す
    });
    localStorage.removeItem("spiCompanyUser");
    router.push("/company/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/company/dashboard" className="text-xl font-bold text-blue-700">
          Webテスト<span className="text-gray-900">ナビ</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            企業様向け
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/company/dashboard" className="hover:text-blue-700">
            候補者検索
          </Link>
          <Link href="/company/scouts" className="hover:text-blue-700">
            送信履歴
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{companyName}</span>
        <Link
          href="/company/profile"
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          プロフィール
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
