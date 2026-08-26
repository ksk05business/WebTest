"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export function DashboardHeader() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) return;
    const user = JSON.parse(raw) as { email?: string };
    if (!user.email) return;

    fetch(`/api/scouts?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data: { scouts?: { status: string; isRead: boolean }[]; error?: string }) => {
        if (!data.scouts) return;
        setUnreadCount(data.scouts.filter((s) => s.status === "sent" && !s.isRead).length);
      })
      .catch(() => {
        // 未読件数の取得に失敗してもヘッダー自体は表示する
      });
  }, []);

  function handleLogout() {
    fetch("/api/logout", { method: "POST" }).catch(() => {
      // ログアウトAPI呼び出しに失敗しても、ローカルの状態はクリアしてログイン画面へ戻す
    });
    localStorage.removeItem("spiUser");
    router.push("/");
  }

  return (
    <header className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="relative text-xl font-bold text-blue-700">
          Webテスト<span className="text-gray-900">ナビ</span>
          {unreadCount > 0 && (
            <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* デスクトップ/タブレット幅（sm以上）: 従来通り横並びナビ */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/mypage"
            className="flex min-h-12 items-center rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            プロフィール
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-12 items-center rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>

        {/* スマホ幅（sm未満）: ハンバーガーメニュー */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={menuOpen}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 sm:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <div className="mt-3 flex flex-col gap-2 sm:hidden">
          <Link
            href="/mypage"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            プロフィール
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              handleLogout();
            }}
            className="flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ログアウト
          </button>
        </div>
      )}
    </header>
  );
}
