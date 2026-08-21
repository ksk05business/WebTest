"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) return;
    const user = JSON.parse(raw) as { email?: string };
    if (!user.email) return;

    fetch(`/api/scouts?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data: { scouts?: { status: string; isRead: boolean }[] }) => {
        if (!data.scouts) return;
        setUnreadCount(data.scouts.filter((s) => s.status === "sent" && !s.isRead).length);
      })
      .catch(() => {
        // 未読件数の取得に失敗してもヘッダー自体は表示する
      });
  }, []);

  function handleLogout() {
    localStorage.removeItem("spiUser");
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/dashboard" className="relative text-xl font-bold text-blue-700">
        SPI<span className="text-gray-900">ナビ</span>
        {unreadCount > 0 && (
          <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/mypage"
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
