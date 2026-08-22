"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryBreakdownItem = {
  category: string; // "verbal" | "non_verbal" | "structural"
  correct: number;
  total: number;
  accuracyRate: number | null;
  deviationScore: number | null;
};

type ExamHistoryItem = {
  score: number;
  total: number;
  accuracyRate: number;
  deviationScore: number | null;
  takenAt: string;
};

type ExamData = {
  history: ExamHistoryItem[];
  attemptCount: number;
  latestDeviationScore: number | null;
  bestDeviationScore: number | null;
  bestAccuracyRate: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
};

const CATEGORY_LABEL: Record<string, string> = {
  verbal: "言語",
  non_verbal: "非言語",
  structural: "構造的把握",
  english: "英語",
};

function getRank(deviation: number | null): string {
  if (deviation === null) return "-";
  if (deviation >= 70) return "S";
  if (deviation >= 60) return "A";
  if (deviation >= 50) return "B";
  if (deviation >= 40) return "C";
  return "D";
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-blue-700">{value}</p>
    </div>
  );
}

export function PerformanceDashboard({ email }: { email: string }) {
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [reviewDueCount, setReviewDueCount] = useState(0);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/exam-results?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data: (ExamData & { error?: string }) | { error: string }) => {
        if ("error" in data) {
          if (data.error === "ログインが必要です") redirectToLogin(router);
          return;
        }
        setExamData(data);
      })
      .catch(() => {
        // 成績サマリーの取得に失敗してもマイページ自体は表示する
      });

    fetch(`/api/review?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data: { reviews?: unknown[]; error?: string }) => {
        if (data.error === "ログインが必要です") {
          redirectToLogin(router);
          return;
        }
        if (data.reviews) setReviewDueCount(data.reviews.length);
      })
      .catch(() => {
        // 復習件数の取得に失敗してもマイページ自体は表示する
      });
  }, [email]);

  return (
    <div className="flex flex-col gap-4">
      {reviewDueCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
          <div>
            <p className="font-bold text-amber-800">今日復習すべき問題（{reviewDueCount}件）</p>
            <p className="mt-0.5 text-xs text-amber-700">
              忘却曲線に基づき、今がちょうど復習のタイミングです。
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/review")}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            今すぐ復習する
          </button>
        </div>
      )}

      {!examData || examData.attemptCount === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          まだ模試を受験していません。模試を受けると成績推移・弱点分析がここに表示されます。
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="最高偏差値" value={examData.bestDeviationScore?.toFixed(1) ?? "-"} />
            <SummaryCard
              label="直近偏差値"
              value={examData.latestDeviationScore?.toFixed(1) ?? "-"}
            />
            <SummaryCard label="累計受検回数" value={`${examData.attemptCount}回`} />
            <SummaryCard label="評価ランク" value={getRank(examData.latestDeviationScore)} />
          </div>

          {(() => {
            const chartData = [...examData.history]
              .filter((h) => h.deviationScore !== null)
              .reverse()
              .map((h) => ({
                date: new Date(h.takenAt).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                }),
                deviation: h.deviationScore as number,
              }));
            if (chartData.length === 0) return null;
            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-gray-800">偏差値推移</p>
                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="deviation"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {(() => {
            const withData = examData.categoryBreakdown.filter((c) => c.total > 0);
            const strongest =
              withData.length > 0
                ? withData.reduce((a, b) => ((a.accuracyRate ?? 0) >= (b.accuracyRate ?? 0) ? a : b))
                : null;
            const weakest =
              withData.length > 0
                ? withData.reduce((a, b) => ((a.accuracyRate ?? 1) <= (b.accuracyRate ?? 1) ? a : b))
                : null;

            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">カテゴリ別分析</p>
                <div className="flex flex-col gap-3">
                  {examData.categoryBreakdown.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium text-gray-800">
                          {CATEGORY_LABEL[c.category] ?? c.category}
                        </span>
                        <span>
                          {c.total > 0
                            ? `正解率 ${Math.round((c.accuracyRate ?? 0) * 100)}% ／偏差値 ${
                                c.deviationScore?.toFixed(1) ?? "-"
                              }`
                            : "データなし"}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.round((c.accuracyRate ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {(strongest || weakest) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {strongest && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        得意分野: {CATEGORY_LABEL[strongest.category] ?? strongest.category}
                      </span>
                    )}
                    {weakest && weakest.category !== strongest?.category && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        克服すべき弱点: {CATEGORY_LABEL[weakest.category] ?? weakest.category}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
