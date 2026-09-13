"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import { MULTI_PART_EXAM_PARTS, type TestType } from "@/src/data/testTypes";

type HistoryItem = {
  id: number;
  testType: string;
  score: number;
  total: number;
  deviationScore: number | null;
  takenAt: string;
};

// 「模試を復習する」ボタンから開く、対象テストの過去の模試受験履歴選択モーダル。
// GET /api/exam-results?testType= は試験別専用ページ（PerformanceDashboard）と同じエンドポイントで、
// 指定テスト種別（testType.id）の受験履歴のみに絞り込まれたhistoryを返す。
// 一覧から1件選ぶと、その回の詳細（出題・自分の解答・正解・解説）を表示する既存の
// /result/history?id=<exam_results.id> へ遷移する。
export function MockHistorySelectModal({
  testType,
  onClose,
}: {
  testType: TestType;
  onClose: () => void;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[] | null>(null);

  // 複数パート方式のテスト（TG-WEB等）は、exam_results.test_typeがパートごとのid
  // （例: "tgweb_traditional_verbal"）になっている。src/data/testTypes.tsのMULTI_PART_EXAM_PARTSから
  // 「従来型・言語（12問/12分）」のような表示ラベルを取り、末尾の（問題数/制限時間）部分を除いた
  // 科目名だけをバッジ表示する。単一パート方式のテスト（SCOA等）はtest_typeがtestType.id自身になり
  // 該当エントリが無いため、バッジは表示しない（モーダルのタイトルに既にテスト名があるため冗長）。
  const partLabelByTestType = new Map(
    (MULTI_PART_EXAM_PARTS[testType.id] ?? []).map((p) => [p.id, p.label.replace(/（[^）]*）$/, "")])
  );

  useEffect(() => {
    fetch(`/api/exam-results?testType=${encodeURIComponent(testType.id)}`)
      .then((res) => res.json())
      .then((data: { history?: HistoryItem[]; error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") redirectToLogin(router);
          return;
        }
        setHistory((data.history ?? []).filter((h) => h.id));
      })
      .catch(() => setHistory([]));
  }, [testType.id, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">{testType.name} の模試履歴から復習</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="mt-4">
          {history === null ? (
            <p className="py-6 text-center text-sm text-gray-500">読み込み中...</p>
          ) : history.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              まだこのテストの模試を受験していません。模試を受けると、ここから過去の回を振り返れます。
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {history.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => router.push(`/result/history?id=${h.id}`)}
                  className="flex items-center justify-between gap-3 py-3 text-left text-sm hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    {new Date(h.takenAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                    })}
                    {partLabelByTestType.has(h.testType) && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {partLabelByTestType.get(h.testType)}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">
                    {h.score}/{h.total}問
                    {h.deviationScore !== null && `　偏差値 ${h.deviationScore.toFixed(1)}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
