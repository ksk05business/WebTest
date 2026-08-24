"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Flame } from "lucide-react";
import { DEFAULT_TEST_ID, PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { TEST_TYPES } from "@/src/data/testTypes";

type UnitCount = { category: string; subCategory: string; count: number };

export function PracticeUnitSelector({ testId = DEFAULT_TEST_ID }: { testId?: string }) {
  const router = useRouter();
  const [unitCounts, setUnitCounts] = useState<UnitCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  // 復習ノート（エビングハウスの忘却曲線に基づく間隔反復キュー）の今日分の件数。
  const [dueReviewCount, setDueReviewCount] = useState(0);
  const [dueReviewLoading, setDueReviewLoading] = useState(true);

  const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testId] ?? PRACTICE_UNIT_GROUPS_BY_TEST[DEFAULT_TEST_ID];
  const testName = TEST_TYPES.find((t) => t.id === testId)?.name ?? "SPI3";

  useEffect(() => {
    fetch("/api/question-units")
      .then((res) => res.json())
      .then((data: { units?: UnitCount[] }) => {
        setUnitCounts(data.units ?? []);
      })
      .catch(() => {
        // 収録問題数の取得に失敗しても単元一覧自体は表示する（バッジが0件になるだけ）
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/review")
      .then((res) => res.json())
      .then((data: { reviews?: unknown[] }) => setDueReviewCount(data.reviews?.length ?? 0))
      .catch(() => {
        // 取得に失敗しても復習カード自体は表示する（0件扱いになるだけ）
      })
      .finally(() => setDueReviewLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  function countFor(category: string, subCategory: string): number {
    return unitCounts.find((u) => u.category === category && u.subCategory === subCategory)?.count ?? 0;
  }

  function handleUnitClick(category: string, subCategory: string, label: string) {
    if (loading) return;
    if (countFor(category, subCategory) === 0) {
      setToast(`「${label}」の問題は準備中です`);
      return;
    }
    const params = new URLSearchParams({ category, subCategory, testType: testId });
    router.push(`/practice?${params.toString()}`);
  }

  function handleReviewNoteClick() {
    if (dueReviewLoading) return;
    router.push("/review");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-gray-900">{testName} 練習する分野・単元を選ぶ</h1>
        <p className="text-sm text-gray-500">
          性格検査は対象外です。能力検査の分野から練習したい単元を選んでください。
        </p>
      </div>

      <button
        type="button"
        onClick={handleReviewNoteClick}
        className="flex items-center justify-between rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-left transition-colors hover:border-orange-300 hover:bg-orange-100"
      >
        <span className="flex items-center gap-2 font-bold text-orange-900">
          <Flame className="h-5 w-5 text-orange-600" />
          復習ノート（今日復習すべき問題）
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-orange-700">
            {dueReviewLoading ? "..." : `${dueReviewCount}問`}
          </span>
          <ChevronRight className="h-4 w-4 text-orange-400" />
        </span>
      </button>

      {groups.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">{group.groupLabel}</p>
          <div className="flex flex-col gap-2">
            {group.units.map((unit) => {
              const count = countFor(group.category, unit.subCategory);
              const disabled = !loading && count === 0;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleUnitClick(group.category, unit.subCategory, unit.label)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                    disabled
                      ? "border-gray-200 bg-white opacity-50"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800">{unit.label}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        disabled ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {loading ? "..." : disabled ? "準備中" : `${count}問`}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Link
        href="/dashboard"
        className="mt-2 rounded-full border border-gray-300 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
      >
        戻る（モード選択へ）
      </Link>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
