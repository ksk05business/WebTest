"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";

type Summary = { total: number; known: number; uncertain: number; wrong: number; unanswered: number };

// 単元をクリックした際に問題スタート前に挟む、ステータス内訳サマリー画面。
// 〇known/△uncertain/×wrong/未回答の内訳を表示し、「すべて」「×＋△のみ復習」「未回答のみ」の
// 3つの開始アクションを提示する。
export function UnitStatusSummaryModal({
  category,
  subCategory,
  label,
  testId,
  onClose,
}: {
  category: string;
  subCategory: string;
  label: string;
  testId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ category, subCategory });
    fetch(`/api/question-status-summary?${params.toString()}`)
      .then((res) => {
        if (res.status === 401) {
          redirectToLogin(router);
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data: Partial<Summary> & { error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setSummary({
          total: data.total ?? 0,
          known: data.known ?? 0,
          uncertain: data.uncertain ?? 0,
          wrong: data.wrong ?? 0,
          unanswered: data.unanswered ?? 0,
        });
      })
      .catch(() => setLoadError((prev) => prev ?? "取得に失敗しました。時間をおいて再度お試しください。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory]);

  function startPractice(statusFilter?: "wrong_uncertain" | "unanswered") {
    const params = new URLSearchParams({ category, subCategory, testType: testId });
    if (statusFilter) params.set("statusFilter", statusFilter);
    router.push(`/practice?${params.toString()}`);
  }

  const reviewCount = summary ? summary.wrong + summary.uncertain : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {loadError && <p className="mt-4 text-sm font-medium text-red-600">{loadError}</p>}

        {!summary && !loadError && <p className="mt-4 text-sm text-gray-500">読み込み中...</p>}

        {summary && (
          <>
            <p className="mt-1 text-sm text-gray-500">全{summary.total}問</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-xs font-medium text-green-700">〇 正解・理解済み</p>
                <p className="text-xl font-bold text-green-800">{summary.known}問</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-700">△ 正解・自信なし</p>
                <p className="text-xl font-bold text-amber-800">{summary.uncertain}問</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">× 不正解</p>
                <p className="text-xl font-bold text-red-800">{summary.wrong}問</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <p className="text-xs font-medium text-gray-600">未回答</p>
                <p className="text-xl font-bold text-gray-700">{summary.unanswered}問</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => startPractice()}
                className="rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                すべての問題から解く
              </button>
              <button
                type="button"
                onClick={() => startPractice("wrong_uncertain")}
                disabled={reviewCount === 0}
                className="rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                × 不正解 ＋ △ 自信なし のみを復習する（推奨）
              </button>
              <button
                type="button"
                onClick={() => startPractice("unanswered")}
                disabled={summary.unanswered === 0}
                className="rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                未回答問題のみを解く
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
