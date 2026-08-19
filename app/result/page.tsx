"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = { score: number; total: number };

function getComment(rate: number) {
  if (rate >= 0.8) return "素晴らしい！本番でも高得点が期待できます。";
  if (rate >= 0.5) return "まずまずです。苦手分野を復習しましょう。";
  return "基礎からの復習がおすすめです。繰り返し練習しましょう。";
}

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("spiResult");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-600">結果データがありません。</p>
        <Link href="/test" className="text-blue-600 underline">
          試験を受ける
        </Link>
      </main>
    );
  }

  const rate = result.score / result.total;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 px-6 py-10 text-center">
      <h1 className="text-2xl font-bold text-gray-900">結果発表</h1>

      <p className="text-5xl font-extrabold text-blue-600">
        {result.score} <span className="text-2xl text-gray-500">/ {result.total}</span>
      </p>

      <p className="text-gray-700">{getComment(rate)}</p>

      <a
        href="#"
        className="block w-full rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-4 text-amber-800 hover:bg-amber-100"
      >
        <span className="font-bold">
          高スコア者向け就活エージェントに無料登録 →
        </span>
        <p className="mt-1 text-sm">（広告枠プレースホルダー）</p>
      </a>

      <Link
        href="/test"
        className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow hover:bg-blue-700"
      >
        もう一度挑戦する
      </Link>
      <Link href="/" className="text-sm text-gray-500 underline">
        トップに戻る
      </Link>
    </main>
  );
}
