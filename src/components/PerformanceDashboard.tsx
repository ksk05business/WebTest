"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryBreakdownItem = {
  category: string;
  label: string;
  correct: number;
  total: number;
  accuracyRate: number | null;
  deviationScore: number | null;
};

type SubCategoryBreakdownItem = {
  category: string;
  subCategory: string;
  label: string;
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
  subCategoryBreakdown: SubCategoryBreakdownItem[];
  testTypeFamily: string;
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-blue-700">{value}</p>
    </div>
  );
}

// 特定のテスト種別（testType、例: "tamatebako"）に絞った成績サマリー（最高/直近偏差値・
// 受検回数・偏差値推移グラフ・カテゴリ別分析）を表示する。試験別専用ページ（/dashboard/[testId]）
// 専用のコンポーネントで、メインダッシュボードには表示しない（成績・偏差値表示は
// 各試験の専用ページに一本化したため）。
export function PerformanceDashboard({ email, testType }: { email: string; testType: string }) {
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/exam-results?testType=${encodeURIComponent(testType)}`)
      .then((res) => res.json())
      .then((data: (ExamData & { error?: string }) | { error: string }) => {
        if ("error" in data) {
          if (data.error === "ログインが必要です") redirectToLogin(router);
          return;
        }
        setExamData(data);
      })
      .catch(() => {
        // 成績サマリーの取得に失敗してもページ自体は表示する
      });
  }, [email, testType, router]);

  return (
    <div className="flex flex-col gap-4">
      {!examData || examData.attemptCount === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          まだこのテストの模試を受験していません。模試を受けると成績推移・弱点分析がここに表示されます。
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="最高偏差値" value={examData.bestDeviationScore?.toFixed(1) ?? "-"} />
            <SummaryCard
              label="直近偏差値"
              value={examData.latestDeviationScore?.toFixed(1) ?? "-"}
            />
            <SummaryCard label="受検回数" value={`${examData.attemptCount}回`} />
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
                        <span className="font-medium text-gray-800">{c.label}</span>
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
                        得意分野: {strongest.label}
                      </span>
                    )}
                    {weakest && weakest.category !== strongest?.category && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        克服すべき弱点: {weakest.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {(() => {
            const withData = examData.subCategoryBreakdown.filter((c) => c.total > 0);
            if (withData.length === 0) return null;

            // 大分類（category）ごとにグルーピングし、大分類の表示ラベルはcategoryBreakdownから引く。
            const labelByBroad = new Map(examData.categoryBreakdown.map((c) => [c.category, c.label]));
            const groups = new Map<string, SubCategoryBreakdownItem[]>();
            for (const item of examData.subCategoryBreakdown) {
              const list = groups.get(item.category) ?? [];
              list.push(item);
              groups.set(item.category, list);
            }

            // レーダーチャートは軸が多すぎると読みにくくなるため、データのある単元のうち
            // 出題数が多い（＝信頼度が高い）上位12件までに絞る。
            const radarData = [...withData]
              .sort((a, b) => b.total - a.total)
              .slice(0, 12)
              .map((c) => ({ subject: c.label, 正答率: Math.round((c.accuracyRate ?? 0) * 100) }));

            function practiceHref(item: SubCategoryBreakdownItem) {
              const params = new URLSearchParams({
                testType: examData!.testTypeFamily,
                category: item.category,
                subCategory: item.subCategory,
              });
              return `/practice?${params.toString()}`;
            }

            return (
              <>
                {radarData.length >= 3 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-800">単元別・正答率レーダーチャート</p>
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <RadarChart data={radarData} outerRadius="75%">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar
                            name="正答率"
                            dataKey="正答率"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.35}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">単元別・詳細分析</p>
                  <div className="flex flex-col gap-4">
                    {[...groups.entries()].map(([broad, items]) => (
                      <div key={broad}>
                        <p className="mb-2 text-xs font-bold text-gray-500">{labelByBroad.get(broad) ?? broad}</p>
                        <div className="flex flex-col gap-2">
                          {items.map((item) => {
                            const hasData = item.total > 0;
                            const isWeak = hasData && (item.accuracyRate ?? 1) < 0.65;
                            return (
                              <div
                                key={item.subCategory}
                                className={`flex flex-col gap-1.5 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                                  isWeak ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                                    {isWeak && (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                        苦手単元
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {hasData
                                      ? `正解率 ${Math.round((item.accuracyRate ?? 0) * 100)}%（${item.correct}/${item.total}問） ／偏差値 ${
                                          item.deviationScore?.toFixed(1) ?? "-"
                                        }`
                                      : "データなし"}
                                  </p>
                                </div>
                                {hasData && (
                                  <a
                                    href={practiceHref(item)}
                                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
                                      isWeak
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    この単元を復習する
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
