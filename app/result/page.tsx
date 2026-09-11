"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExamReviewEntry } from "@/src/data/questions";
import { IndustryBenchmarkCard } from "@/src/components/IndustryBenchmarkCard";
import { ExamReviewList } from "@/src/components/ExamReviewList";

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
          <ExamReviewList review={review} />
        </section>
      )}
    </main>
  );
}
