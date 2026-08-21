"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { PRACTICE_UNIT_GROUPS } from "@/src/data/practiceUnits";

type UnitCount = { category: string; subCategory: string; count: number };

type Selection = { category: string; subCategory: string } | "random";

export function PracticeUnitSelector() {
  const router = useRouter();
  const [unitCounts, setUnitCounts] = useState<UnitCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection>("random");

  useEffect(() => {
    fetch("/api/question-units")
      .then((res) => res.json())
      .then((data: { units?: UnitCount[]; total?: number }) => {
        setUnitCounts(data.units ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        // 収録問題数の取得に失敗しても単元一覧自体は表示する（バッジが0件になるだけ）
      })
      .finally(() => setLoading(false));
  }, []);

  function countFor(category: string, subCategory: string): number {
    return unitCounts.find((u) => u.category === category && u.subCategory === subCategory)?.count ?? 0;
  }

  function handleStart() {
    if (selection === "random") {
      router.push("/practice?category=all");
      return;
    }
    const params = new URLSearchParams({
      category: selection.category,
      subCategory: selection.subCategory,
    });
    router.push(`/practice?${params.toString()}`);
  }

  const selectedCount =
    selection === "random" ? total : countFor(selection.category, selection.subCategory);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-gray-900">練習する分野・単元を選ぶ</h1>
        <p className="text-sm text-gray-500">
          性格検査は対象外です。能力検査の分野から練習したい単元を選んでください。
        </p>
      </div>

      <button
        type="button"
        onClick={() => setSelection("random")}
        className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${
          selection === "random"
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 bg-white hover:border-blue-200"
        }`}
      >
        <span className="flex items-center gap-2 font-bold text-gray-900">
          <Shuffle className="h-5 w-5 text-blue-600" />
          ランダム総合練習
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {loading ? "..." : `${total}問`}
        </span>
      </button>

      {PRACTICE_UNIT_GROUPS.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-700">{group.groupLabel}</p>
          <div className="flex flex-col gap-2">
            {group.units.map((unit) => {
              const count = countFor(group.category, unit.subCategory);
              const isSelected =
                selection !== "random" &&
                selection.category === group.category &&
                selection.subCategory === unit.subCategory;
              const disabled = !loading && count === 0;
              return (
                <button
                  key={unit.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelection({ category: group.category, subCategory: unit.subCategory })}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-800">{unit.label}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      disabled ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {loading ? "..." : disabled ? "準備中" : `${count}問`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={loading || selectedCount === 0}
        onClick={handleStart}
        className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        練習スタート
      </button>
    </main>
  );
}
