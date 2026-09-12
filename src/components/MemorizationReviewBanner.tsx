"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import { MemorizationTestSelectModal, type MemorizationBreakdownItem } from "@/src/components/MemorizationTestSelectModal";

// 全テスト種別（SPI3・玉手箱・TG-WEB・SCOA等）を横断した「直近の解答が不正解のまま」の
// 言語・英語の暗記系単元（語彙・語句・文法等、長文読解・論理的読解等は除く）の問題数を
// ダッシュボード上部に表示する。メインダッシュボードの簡易化（成績・偏差値表示は試験別専用ページへ
// 移動）後も、この横断復習機能だけは特定のテストに属さないためメインダッシュボードに残す。
export function MemorizationReviewBanner({ email }: { email: string }) {
  const router = useRouter();
  const [memorizationDueCount, setMemorizationDueCount] = useState(0);
  const [breakdown, setBreakdown] = useState<MemorizationBreakdownItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch("/api/practice/history?scope=memorization&countOnly=1")
      .then((res) => res.json())
      .then((data: { count?: number; breakdown?: MemorizationBreakdownItem[]; error?: string }) => {
        if (data.error === "ログインが必要です") {
          redirectToLogin(router);
          return;
        }
        setMemorizationDueCount(data.count ?? 0);
        setBreakdown(data.breakdown ?? []);
      })
      .catch(() => {
        // 復習件数の取得に失敗してもダッシュボード自体は表示する
      });
  }, [email, router]);

  if (memorizationDueCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-50 p-4">
      <div>
        <p className="font-bold text-emerald-800">
          全テスト共通：今日のスキマ暗記復習（{memorizationDueCount}件）
        </p>
        <p className="mt-0.5 text-xs text-emerald-700">
          移動中に最適！すべてのWebテストの言語・英語・暗記系問題を横断して復習できます。
        </p>
      </div>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        今すぐ復習する
      </button>

      {modalOpen && (
        <MemorizationTestSelectModal breakdown={breakdown} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
