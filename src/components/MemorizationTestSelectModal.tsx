"use client";

import { useRouter } from "next/navigation";
import { CATEGORY_TO_GROUP_LABEL, CATEGORY_TO_TEST_ID } from "@/src/data/practiceUnits";
import { TEST_TYPES } from "@/src/data/testTypes";

export type MemorizationBreakdownItem = { category: string; count: number };

// 「スキマ暗記復習」を開始する前に、対象がある「テスト種別×科目」を選ばせるモーダル。
// 選択したcategory（1つのテスト×科目に一意対応）で/practiceへ遷移し、その範囲だけ出題する。
export function MemorizationTestSelectModal({
  breakdown,
  onClose,
}: {
  breakdown: MemorizationBreakdownItem[];
  onClose: () => void;
}) {
  const router = useRouter();

  const options = breakdown
    .filter((b) => b.count > 0)
    .map((b) => {
      const testId = CATEGORY_TO_TEST_ID[b.category];
      const testName = TEST_TYPES.find((t) => t.id === testId)?.name ?? testId ?? b.category;
      const groupLabel = CATEGORY_TO_GROUP_LABEL[b.category] ?? b.category;
      return { category: b.category, count: b.count, testName, groupLabel };
    })
    .sort((a, b) => a.testName.localeCompare(b.testName) || a.groupLabel.localeCompare(b.groupLabel));

  function startReview(category: string) {
    router.push(`/practice?scope=memorization&category=${encodeURIComponent(category)}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900">どのテスト・科目を復習する？</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.category}
              type="button"
              onClick={() => startReview(opt.category)}
              className="flex min-h-12 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-left hover:bg-emerald-100"
            >
              <span className="text-sm font-semibold text-gray-800">
                {opt.testName} ・ {opt.groupLabel}
              </span>
              <span className="text-sm font-bold text-emerald-700">{opt.count}問</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
