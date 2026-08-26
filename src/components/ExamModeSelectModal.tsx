"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
import type { TestType } from "@/src/data/testTypes";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { TEST_EXPLAINERS } from "@/src/data/testExplainers";
import { formatJapaneseDate } from "@/src/lib/formatDate";

// SPIの本番模試は「基礎能力試験（言語・非言語）」「英語」「構造把握」の3パートに分けて受験する。
// パートごとに独立した受験可否（2ヶ月に1回リセット）を持つ（functions/api/exam-eligibility.tsのtestType）。
const SPI_EXAM_PARTS = [
  { id: "spi_basic", label: "基礎能力試験（言語・非言語）" },
  { id: "spi_english", label: "英語" },
  { id: "spi_structural", label: "構造把握" },
] as const;

type PartEligibility = { eligible: boolean; nextResetAt: string };

export function ExamModeSelectModal({
  testType,
  onClose,
}: {
  testType: TestType;
  onClose: () => void;
}) {
  const router = useRouter();
  const explainer = TEST_EXPLAINERS[testType.id];
  const hasPracticeContent = Boolean(PRACTICE_UNIT_GROUPS_BY_TEST[testType.id]);
  const isSpi = testType.id === "spi";

  // テスト種別ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  const [eligibility, setEligibility] = useState<{ eligible: boolean; nextResetAt: string } | null>(
    null
  );
  // SPIのみ、基礎能力試験・英語・構造把握の3パートそれぞれの受験可否を個別に持つ。
  const [spiPartEligibility, setSpiPartEligibility] = useState<Record<string, PartEligibility>>({});

  useEffect(() => {
    if (!testType.available || isSpi) return;
    fetch(`/api/exam-eligibility?testType=${encodeURIComponent(testType.id)}`)
      .then((res) => res.json())
      .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
        if (data.error) return;
        setEligibility({ eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" });
      })
      .catch(() => {});
  }, [testType.available, testType.id, isSpi]);

  useEffect(() => {
    if (!testType.available || !isSpi) return;
    SPI_EXAM_PARTS.forEach((part) => {
      fetch(`/api/exam-eligibility?testType=${part.id}`)
        .then((res) => res.json())
        .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
          if (data.error) return;
          setSpiPartEligibility((prev) => ({
            ...prev,
            [part.id]: { eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [testType.available, isSpi]);

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
            {explainer && (
              <details className="group rounded-xl border border-gray-200">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-blue-600" />
                    {explainer.heading}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                  {explainer.sections.map((section) => (
                    <div key={section.title}>
                      <p className="font-semibold text-gray-700">{section.title}</p>
                      {section.body && <p>{section.body}</p>}
                      {section.groups && (
                        <div className="mt-1.5 flex flex-col gap-2">
                          {section.groups.map((group) => (
                            <div key={group.label}>
                              <p className="text-xs font-bold text-gray-500">【{group.label}】</p>
                              <ul className="list-disc space-y-0.5 pl-5">
                                {group.items.map((item) => (
                                  <li key={item}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900">模擬試験（本番モード）</p>
              <p className="text-sm leading-relaxed text-gray-600">
                本番同様の制限時間で出題。成績・偏差値が記録され、企業スカウトの評価対象になります。
                {isSpi && "「基礎能力試験（言語・非言語）」「英語」「構造把握」の3つに分かれており、それぞれ独立して受験できます。"}
              </p>
              {!testType.available ? (
                <p className="mt-1 rounded-full bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-400">
                  本番模試は準備中です
                </p>
              ) : isSpi ? (
                <div className="mt-1 flex flex-col gap-2">
                  {SPI_EXAM_PARTS.map((part) => {
                    const partEligibility = spiPartEligibility[part.id];
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
