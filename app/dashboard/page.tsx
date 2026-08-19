"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { TEST_TYPES } from "@/src/data/testTypes";

type ResultEntry = { score: number; total: number; date: string };
type ExamSummary = {
  attemptCount: number;
  latestDeviationScore: number | null;
  bestAccuracyRate: number | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d
    .getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const [history, setHistory] = useState<ResultEntry[]>([]);
  const [examSummary, setExamSummary] = useState<ExamSummary | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { name?: string; email?: string };
    setUserName(user.name ?? "");

    const rawHistory = localStorage.getItem("spiResultHistory");
    if (rawHistory) {
      setHistory((JSON.parse(rawHistory) as ResultEntry[]).slice().reverse());
    }
    setAuthChecked(true);

    if (user.email) {
      fetch(`/api/exam-results?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data: ExamSummary & { error?: string }) => {
          if (!data.error) setExamSummary(data);
        })
        .catch(() => {
          // 成績サマリーの取得に失敗してもダッシュボード自体は表示する
        });
    }
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <p className="text-gray-600">ようこそ、{userName}さん</p>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900">試験の種類</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEST_TYPES.map((t) =>
              t.available ? (
                <Link
                  key={t.id}
                  href={t.href}
                  className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {t.name}
                </Link>
              ) : (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-400"
                >
                  {t.name}
                  <p className="mt-1 text-xs">準備中</p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900">自分の成績</h2>

          {examSummary && examSummary.attemptCount > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-500">最新の偏差値</p>
                <p className="text-xl font-bold text-blue-700">
                  {examSummary.latestDeviationScore !== null
                    ? examSummary.latestDeviationScore.toFixed(1)
                    : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-500">最高正答率</p>
                <p className="text-xl font-bold text-blue-700">
                  {examSummary.bestAccuracyRate !== null
                    ? `${Math.round(examSummary.bestAccuracyRate * 100)}%`
                    : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <p className="text-xs text-gray-500">受験回数</p>
                <p className="text-xl font-bold text-blue-700">{examSummary.attemptCount}</p>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <p className="text-sm text-gray-500">まだ受験履歴がありません。</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-max border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                      日時
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                      スコア
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={i}>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-700">
                        {formatDate(r.date)}
                      </td>
                      <td className="border-b border-gray-100 px-3 py-2 text-gray-700">
                        {r.score} / {r.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
