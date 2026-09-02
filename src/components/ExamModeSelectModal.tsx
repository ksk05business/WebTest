"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MULTI_PART_EXAM_PARTS, type TestType } from "@/src/data/testTypes";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { formatJapaneseDate } from "@/src/lib/formatDate";

type PartEligibility = { eligible: boolean; nextResetAt: string };

export function ExamModeSelectModal({
  testType,
  onClose,
}: {
  testType: TestType;
  onClose: () => void;
}) {
  const router = useRouter();
  const hasPracticeContent = Boolean(PRACTICE_UNIT_GROUPS_BY_TEST[testType.id]);
  // SPI・玉手箱・TG-WEB・GAB/C-GABは形式・セクションごとに個別選択して受験する複数パート方式
  // （MULTI_PART_EXAM_PARTS参照）。SCOA等、単一パートのテスト種別はここに含まれない。
  const multiParts = MULTI_PART_EXAM_PARTS[testType.id];
  const isMultiPart = Boolean(multiParts);

  // テスト種別ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  const [eligibility, setEligibility] = useState<{ eligible: boolean; nextResetAt: string } | null>(
    null
  );
  // 複数パート方式のテスト種別は、パートごとに受験可否を個別に持つ。
  const [multiPartEligibility, setMultiPartEligibility] = useState<Record<string, PartEligibility>>(
    {}
  );

  useEffect(() => {
    if (!testType.available || isMultiPart) return;
    fetch(`/api/exam-eligibility?testType=${encodeURIComponent(testType.id)}`)
      .then((res) => res.json())
      .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
        if (data.error) return;
        setEligibility({ eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" });
      })
      .catch(() => {});
  }, [testType.available, testType.id, isMultiPart]);

  useEffect(() => {
    if (!testType.available || !multiParts) return;
    multiParts.forEach((part) => {
      fetch(`/api/exam-eligibility?testType=${part.id}`)
        .then((res) => res.json())
        .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
          if (data.error) return;
          setMultiPartEligibility((prev) => ({
            ...prev,
            [part.id]: { eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [testType.available, multiParts]);

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

        {!testType.available && !hasPracticeContent ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            現在問題コンテンツを順次準備中です。公開まで今しばらくお待ちください。
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900">模擬試験（本番モード）</p>
              {!testType.available ? (
                <p className="mt-1 rounded-full bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-400">
                  本番模試は準備中です
                </p>
              ) : multiParts ? (
                <div className="mt-1 flex flex-col gap-2">
                  {multiParts.map((part) => {
                    const partEligibility = multiPartEligibility[part.id];
                    return (
                      <div
                        key={part.id}
                        className="flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-800">{part.label}</p>
                        {partEligibility && !partEligibility.eligible ? (
                          <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                            このテストは2ヶ月に1回のみ受験可能です
                            <br />
                            次回一斉リセット: {formatJapaneseDate(partEligibility.nextResetAt)}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push(`/test?part=${part.id}`)}
                            disabled={!partEligibility}
                            className="rounded-full bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            スタート
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : eligibility && !eligibility.eligible ? (
                <div className="mt-1 rounded-lg bg-amber-50 px-3 py-2.5 text-center text-xs font-semibold text-amber-800">
                  このテストは2ヶ月に1回のみ受験可能です
                  <br />
                  次回一斉リセット: {formatJapaneseDate(eligibility.nextResetAt)}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(testType.href)}
                  disabled={!eligibility}
                  className="mt-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  模擬試験をスタート
                </button>
              )}
            </div>

            {hasPracticeContent && (
              <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
                <p className="font-bold text-gray-900">練習問題（トレーニングモード）</p>
                <p className="text-sm leading-relaxed text-gray-600">
                  1問ごとに丁寧な解説つき。時間制限を気にせず分野・単元ごとに自分のペースで練習できます。
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/practice?testType=${testType.id}`)}
                  className="mt-1 rounded-full border border-blue-300 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  練習問題をスタート
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
