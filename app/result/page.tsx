"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExamReviewEntry } from "@/src/data/questions";
import { IndustryBenchmarkCard } from "@/src/components/IndustryBenchmarkCard";

type Result = { score: number; total: number; part?: string };

function getComment(rate: number) {
  if (rate >= 0.8) return "素晴らしい！本番でも高得点が期待できます。";
  if (rate >= 0.5) return "まずまずです。苦手分野を復習しましょう。";
  return "基礎からの復習がおすすめです。繰り返し練習しましょう。";
}

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [review, setReview] = useState<ExamReviewEntry[] | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("spiResult");
    if (raw) setResult(JSON.parse(raw));
    const rawReview = localStorage.getItem("spiResultReview");
    if (rawReview) {
      try {
        setReview(JSON.parse(rawReview));
      } catch {
        setReview(null);
      }
    }
  }, []);

  if (!result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-600">結果データがありません。</p>
        <Link href="/test?part=spi_basic" className="text-blue-600 underline">
          試験を受ける
        </Link>
      </main>
    );
  }

  const rate = result.total > 0 ? result.score / result.total : 0;
  const retryHref = `/test?part=${result.part ?? "spi_basic"}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 px-6 py-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900">結果発表</h1>

      <p className="text-5xl font-extrabold text-blue-600">
        {result.score} <span className="text-2xl text-gray-500">/ {result.total}</span>
      </p>

      <p className="text-gray-700">{getComment(rate)}</p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href={retryHref}
          className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow hover:bg-blue-700"
        >
          もう一度挑戦する
        </Link>
        <Link href="/dashboard" className="rounded-full px-4 py-3 text-sm text-gray-500 underline">
          ダッシュボードに戻る
        </Link>
      </div>

      <div className="w-full text-left">
        <IndustryBenchmarkCard />
      </div>

      {review && review.length > 0 && (
        <section className="mt-4 w-full text-left">
          <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
            解答一覧（全{review.length}問）
          </h2>
          <div className="flex flex-col gap-4">
            {review.map((entry, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  entry.correct ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold ${
                      entry.correct ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    }`}
                  >
                    {entry.correct ? "正解" : "不正解"}
                  </span>
                  <span className="text-gray-500">問{i + 1}</span>
                  {entry.questionCode && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-gray-400">
                      {entry.questionCode}
                    </span>
                  )}
                </div>

                {entry.title && (
                  <p className="mb-1 text-sm font-semibold text-blue-700">{entry.title}</p>
                )}
                <p className="whitespace-pre-wrap text-sm font-medium text-gray-900">{entry.text}</p>

                <div className="mt-3 flex flex-col gap-1.5">
                  {entry.choices.map((choice) => {
                    const isCorrectChoice = choice.label === entry.correctLabel;
                    const isSelectedChoice = choice.label === entry.selectedLabel;
                    let style = "border-gray-200 text-gray-600";
                    if (isCorrectChoice) style = "border-green-500 bg-green-50 font-semibold text-green-800";
                    else if (isSelectedChoice) style = "border-red-500 bg-red-50 text-red-800";
                    return (
                      <div key={choice.label} className={`rounded-md border px-3 py-1.5 text-sm ${style}`}>
                        <span className="mr-2 font-bold">{choice.label}.</span>
                        {choice.text}
                        {isSelectedChoice && !isCorrectChoice && (
                          <span className="ml-2 text-xs font-semibold">（あなたの解答）</span>
                        )}
                        {isCorrectChoice && <span className="ml-2 text-xs font-semibold">（正解）</span>}
                      </div>
                    );
                  })}
                  {entry.selectedLabel === null && (
                    <p className="text-xs font-semibold text-gray-500">未回答（時間切れ）</p>
                  )}
                </div>

                <div className="mt-3 rounded-md bg-white/70 p-3">
                  <p className="mb-1 text-xs font-bold text-gray-500">解説</p>
                  <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-gray-700">
                    {entry.explanation.map((step, si) => (
                      <li key={si}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
