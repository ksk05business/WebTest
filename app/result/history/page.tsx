"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExamReviewEntry } from "@/src/data/questions";
import { ExamReviewList } from "@/src/components/ExamReviewList";
import { redirectToLogin } from "@/src/lib/authRedirect";

type ExamResultDetail = {
  testType: string;
  score: number;
  total: number;
  accuracyRate: number;
  deviationScore: number | null;
  takenAt: string;
  review: ExamReviewEntry[];
};

// 過去の受験結果1回分の詳細画面。成績画面（PerformanceDashboard）の受験履歴一覧から
// /result/history?id=<exam_results.id> で遷移してくる。動的セグメント（/result/history/[id]）
// ではなくクエリパラメータにしているのは、output: "export"（静的サイト）ではユーザーごとに
// 無数に増える受験IDをビルド時にgenerateStaticParamsで列挙できないため
// （/dashboard/[testId]等、既存の動的ルートは全てビルド時に列挙可能な固定の値のみ）。
export default function ResultHistoryPage() {
  return (
    <Suspense fallback={null}>
      <ResultHistoryPageInner />
    </Suspense>
  );
}

function ResultHistoryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [detail, setDetail] = useState<ExamResultDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("IDが指定されていません");
      return;
    }
    fetch(`/api/exam-result-detail?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data: ExamResultDetail | { error: string }) => {
        if ("error" in data) {
          if (data.error === "ログインが必要です") {
            redirectToLogin(router);
            return;
          }
          setError(data.error);
          return;
        }
        setDetail(data);
      })
      .catch(() => setError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [id, router]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-600">{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-blue-600 underline"
        >
          前のページに戻る
        </button>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 text-center text-gray-500">
        読み込み中...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 px-6 py-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900">過去の受験結果</h1>

      <p className="text-sm text-gray-500">
        {new Date(detail.takenAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
        受験
      </p>

      <p className="text-5xl font-extrabold text-blue-600">
        {detail.score} <span className="text-2xl text-gray-500">/ {detail.total}</span>
      </p>

      {detail.deviationScore !== null && (
        <p className="text-sm text-gray-600">偏差値 {detail.deviationScore.toFixed(1)}</p>
      )}

      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-full px-4 py-3 text-sm text-gray-500 underline"
      >
        前のページに戻る
      </button>

      {detail.review.length > 0 ? (
        <section className="mt-4 w-full text-left">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
            解答一覧（全{detail.review.length}問）
          </h2>
          <ExamReviewList review={detail.review} />
        </section>
      ) : (
        <p className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          この回の受験は問題ごとの詳細記録機能の追加前に受験されたため、解答一覧は表示できません。
        </p>
      )}
    </main>
  );
}
