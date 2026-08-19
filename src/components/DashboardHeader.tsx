"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("spiUser");
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/dashboard" className="text-xl font-bold text-blue-700">
        SPI<span className="text-gray-900">ナビ</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/mypage"
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          マイページ
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
