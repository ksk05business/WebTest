"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ResultEntry = { score: number; total: number; date: string };

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

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { name?: string };
    setUserName(user.name ?? "");

    const rawHistory = localStorage.getItem("spiResultHistory");
    if (rawHistory) {
      setHistory((JSON.parse(rawHistory) as ResultEntry[]).slice().reverse());
    }
    setAuthChecked(true);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("spiUser");
    router.push("/");
  }

  if (!authChecked) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          ようこそ、{userName}さん
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 underline"
        >
          ログアウト
        </button>
      </div>

      <Link
        href="/test"
        className="rounded-lg bg-blue-600 px-6 py-4 text-center font-semibold text-white shadow hover:bg-blue-700"
      >
        SPI非言語 模試・練習問題を始める
      </Link>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-gray-900">自分の成績</h2>
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
  );
}
