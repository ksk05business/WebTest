"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { MemorizationReviewBanner } from "@/src/components/MemorizationReviewBanner";
import { RecommendedCompanies } from "@/src/components/RecommendedCompanies";
import { NoticeBoard } from "@/src/components/NoticeBoard";
import { ShareButtons } from "@/src/components/ShareButtons";
import { SupportChatWidget } from "@/src/components/SupportChatWidget";
import { TEST_TYPES } from "@/src/data/testTypes";

// メインダッシュボードは「試験の種類を選ぶ」ことに専念したシンプルな構成にする
// （成績・偏差値・カテゴリ別分析は各試験の専用ページ/dashboard/[testId]へ移動済み）。
// カードをクリックすると、その場でモーダルを開くのではなく専用ページへ遷移する。
export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { name?: string; email?: string };
    if (user.email) setUserEmail(user.email);
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* メインエリア */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-gray-900">試験の種類</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TEST_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/${t.id}`)}
                    className={
                      t.available
                        ? "min-h-16 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-semibold text-blue-700 hover:bg-blue-100"
                        : "min-h-16 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-400 hover:bg-gray-100"
                    }
                  >
                    {t.name}
                    <p className="mt-1 text-xs font-normal">
                      {t.available ? "練習問題・模試を受験する" : "準備中"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {userEmail && <MemorizationReviewBanner email={userEmail} />}

            <RecommendedCompanies />
          </div>

          {/* 右サイドバー */}
          <aside className="flex flex-col gap-6">
            <div id="notices">
              <NoticeBoard />
            </div>
            <div
              id="border-list"
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4"
            >
              <h3 className="text-sm font-bold text-gray-900">適性検査 実施企業・ボーダー一覧</h3>
              <p className="text-xs leading-relaxed text-gray-500">
                近日公開予定です。SPI・玉手箱等の適性検査を実施している企業や、ボーダーラインの目安をここに掲載していきます。
              </p>
            </div>
          </aside>
        </div>
      </main>

      <ShareButtons
        variant="floating"
        url="https://shukatsu-webtest.com"
        text="WEBテストナビでWEBテスト対策中！無料で本番環境そっくりの模試が受けられるよ"
      />
      <SupportChatWidget />
    </div>
  );
}
