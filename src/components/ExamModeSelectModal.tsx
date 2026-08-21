"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
import type { TestType } from "@/src/data/testTypes";

export function ExamModeSelectModal({
  testType,
  onClose,
}: {
  testType: TestType;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">{testType.name} 対策</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {!testType.available ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            現在問題コンテンツを順次準備中です。公開まで今しばらくお待ちください。
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {testType.id === "spi" && (
              <details className="group rounded-xl border border-gray-200">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-blue-600" />
                    SPI3とは？（特徴・形式の解説）
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-700">概要</p>
                    <p>
                      日本リクルートマネジメントソリューションズ社が提供する、就活で最もポピュラーな適性検査です。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">受験形式</p>
                    <p>テストセンター、インハウスCBT、WEBテスティング、ペーパーテスト</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">出題領域</p>
                    <p>能力検査（非言語・言語・構造的把握）。※性格検査は当アプリの対象外です。</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">対策ポイント</p>
                    <p>
                      誤謬率（間違いの割合）は測定されないため、「解ける問題を確実に素早く解く」ことが重要です。
                    </p>
                  </div>
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900">模擬試験（本番モード）</p>
              <p className="text-sm leading-relaxed text-gray-600">
                本番同様の制限時間で全範囲から出題。成績・偏差値が記録され、企業スカウトの評価対象になります。
              </p>
              <button
                type="button"
                onClick={() => router.push(testType.href)}
                className="mt-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                模擬試験をスタート
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900">練習問題（トレーニングモード）</p>
              <p className="text-sm leading-relaxed text-gray-600">
                1問ごとに丁寧な解説つき。時間制限を気にせず分野・単元ごとに自分のペースで練習できます。
              </p>
              <button
                type="button"
                onClick={() => router.push("/practice")}
                className="mt-1 rounded-full border border-blue-300 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                練習問題をスタート
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
