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
    if (!localStorage.getItem("spiUser")) return;

    fetch("/api/scouts")
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
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/dashboard" className="text-xl font-bold text-blue-700">
          Webテスト<span className="text-gray-900">ナビ</span>
        </Link>

        {/* デスクトップ/タブレット幅（sm以上）: 従来通り横並びナビ */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/dashboard/scouts"
            className="relative flex min-h-12 items-center rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            スカウト
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
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
          className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 sm:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          {!menuOpen && unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pb-3 sm:hidden sm:px-6">
          <Link
            href="/dashboard#notices"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            お知らせ
          </Link>
          <Link
            href="/dashboard#border-list"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ボーダー一覧
          </Link>
          <Link
            href="/dashboard/scouts"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-12 items-center justify-between rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            スカウト
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
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
