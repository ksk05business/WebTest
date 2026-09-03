"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getBorderlineDeviation } from "@/src/data/industryBorderlines";

type BenchmarkData = {
  industryFirst: string | null;
  myDeviationScore: number | null;
  rivalCount: number;
  rivalAverageDeviation: number | null;
  rivalTop: { universityCategory: string | null; facultyBucket: string; deviationScore: number }[];
};

const MIN_SCALE = 35;
const MAX_SCALE = 75;
const RIVAL_MIN_COUNT = 5;

function toPercent(score: number): number {
  const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, score));
  return ((clamped - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100;
}

// マイページ・模試結果画面に置く、志望業界（第一志望）に基づく「足切りボーダーライン判定」＋
// 「匿名ライバル比較」カード。/api/industry-benchmarkからセッション認証で取得する
// （本人の全テスト横断ベスト偏差値と、同じ第一志望業界の他ユーザーの匿名集計）。
export function IndustryBenchmarkCard() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetch("/api/industry-benchmark")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((json: BenchmarkData) => setData(json))
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed || !data || !data.industryFirst) {
    return null;
  }

  const { industryFirst, myDeviationScore, rivalCount, rivalAverageDeviation, rivalTop } = data;
  const border = getBorderlineDeviation(industryFirst);

  let statusLabel = "";
  let statusStyle = "";
  if (myDeviationScore !== null) {
    if (myDeviationScore >= border + 3) {
      statusLabel = "足切り突破圏内（安全）";
      statusStyle = "bg-green-100 text-green-800";
    } else if (myDeviationScore >= border - 3) {
      statusLabel = "ボーダー上（注意）";
      statusStyle = "bg-amber-100 text-amber-800";
    } else {
      statusLabel = "足切り圏外（危険）";
      statusStyle = "bg-red-100 text-red-800";
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5">
      <div>
        <h2 className="text-sm font-bold text-gray-900">
          業界別足切りボーダーライン判定（第一志望: {industryFirst}）
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          ※あくまで一般的な傾向をもとにした目安の基準値です。企業ごとの実際の合格基準を保証するものではありません。
        </p>
      </div>

      {myDeviationScore === null ? (
        <p className="text-sm text-gray-500">模試を受験すると、ボーダーライン判定が表示されます。</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              あなたの偏差値: <span className="font-bold text-gray-900">{myDeviationScore}</span>
              <span className="ml-2 text-xs text-gray-400">（目安ボーダー: 偏差値{border}）</span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-gray-100">
            <div
              className="h-3 rounded-full bg-blue-500"
              style={{ width: `${toPercent(myDeviationScore)}%` }}
            />
            <div
              className="absolute top-[-4px] h-5 w-0.5 bg-gray-700"
              style={{ left: `${toPercent(border)}%` }}
              title={`目安ボーダーライン: 偏差値${border}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>偏差値{MIN_SCALE}</span>
            <span>偏差値{MAX_SCALE}</span>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Users className="h-4 w-4 text-blue-600" />
          匿名ライバル比較（同じ第一志望業界の受験者）
        </h3>

        {rivalCount < RIVAL_MIN_COUNT ? (
          <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            現在ライバルデータを集計中です。同じ業界を志望する受験者が増えると表示されます。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              ライバル平均偏差値:{" "}
              <span className="font-bold text-gray-900">{rivalAverageDeviation}</span>
              <span className="ml-1.5 text-xs text-gray-400">（{rivalCount}人中）</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {rivalTop.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-700"
                >
                  <span>
                    {r.universityCategory ?? "大学区分未設定"}・{r.facultyBucket}
                  </span>
                  <span className="font-bold text-gray-900">偏差値{r.deviationScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
