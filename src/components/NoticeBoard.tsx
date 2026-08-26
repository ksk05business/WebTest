"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ScoutNotice = {
  id: number;
  companyName: string;
};

// 模試受験権のリセット（奇数月1日 0:00 UTCの一斉リセット、functions/_lib/mockExamCycle.ts参照）が
// 当月中に発生しているかどうかの表示用判定（現在の月が奇数月かどうかで判定する簡易実装）。
function isMockExamResetMonth(): boolean {
  return (new Date().getUTCMonth() + 1) % 2 === 1;
}

export function NoticeBoard() {
  const router = useRouter();
  const [scoutNotices, setScoutNotices] = useState<ScoutNotice[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) return;
    fetch("/api/scouts")
      .then((res) => res.json())
      .then(
        (data: {
          scouts?: { id: number; companyName: string; status: string; isRead: boolean }[];
        }) => {
          if (!data.scouts) return;
          setScoutNotices(
            data.scouts
              .filter((s) => s.status === "sent" && !s.isRead)
              .map((s) => ({ id: s.id, companyName: s.companyName }))
          );
        }
      )
      .catch(() => {
        // お知らせの取得に失敗しても致命的ではないため握りつぶす
      });
  }, []);

  const showResetNotice = isMockExamResetMonth();
  const hasNotices = scoutNotices.length > 0 || showResetNotice;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold text-gray-900">お知らせ</h3>
      {hasNotices ? (
        <ul className="flex flex-col gap-2">
          {scoutNotices.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => router.push("/dashboard/scouts")}
                className="text-left text-xs leading-relaxed text-blue-600 underline hover:text-blue-700"
              >
                {s.companyName}からスカウトが届きました
              </button>
            </li>
          ))}
          {showResetNotice && (
            <li className="text-xs leading-relaxed text-gray-600">
              今月の模試受験権がリセットされました
            </li>
          )}
        </ul>
      ) : (
        <p className="text-xs leading-relaxed text-gray-500">現在新しいお知らせはありません</p>
      )}
    </div>
  );
}
