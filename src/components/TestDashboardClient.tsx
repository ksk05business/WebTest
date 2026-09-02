"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { ExamModeSelectModal } from "./ExamModeSelectModal";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { TEST_TYPES, type TestType } from "@/src/data/testTypes";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { TEST_EXPLAINERS } from "@/src/data/testExplainers";

// 試験別専用ページ（/dashboard/[testId]）の実体。テストの説明・アクションボタン（練習問題／模試）・
// そのテストに絞った成績分析（PerformanceDashboard）をまとめて表示する。メインダッシュボードから
// 成績・偏差値表示を分離した結果、ここが各テストの成績を確認する唯一の場所になる。
export function TestDashboardClient({ testId }: { testId: string }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [examModalOpen, setExamModalOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { email?: string };
    if (user.email) setUserEmail(user.email);
    setAuthChecked(true);
  }, [router]);

  const testType: TestType | undefined = TEST_TYPES.find((t) => t.id === testId);
  const explainer = TEST_EXPLAINERS[testId];
  const hasPracticeContent = Boolean(PRACTICE_UNIT_GROUPS_BY_TEST[testId]);

  if (!authChecked || !testType) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          試験の種類選択に戻る
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{testType.name}</h1>
          {!testType.available && !hasPracticeContent && (
            <p className="mt-2 text-sm text-amber-700">
              現在問題コンテンツを順次準備中です。公開まで今しばらくお待ちください。
            </p>
          )}
        </div>

        {/* テストの説明エリア */}
        {explainer && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <Info className="h-4 w-4 text-blue-600" />
              {explainer.heading}
            </div>
            <div className="flex flex-col gap-4 text-sm text-gray-600">
              {explainer.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-semibold text-gray-700">{section.title}</p>
                  {section.body && <p className="mt-0.5">{section.body}</p>}
                  {section.table && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-max border-collapse text-xs">
                        <thead>
                          <tr>
                            {section.table.headers.map((header) => (
                              <th
                                key={header}
                                className="border border-gray-300 bg-gray-100 px-3 py-1.5 text-left font-semibold text-gray-800"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className="border border-gray-300 px-3 py-1.5 align-top text-gray-700"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
          </section>
        )}

        {/* アクションボタン */}
        {(hasPracticeContent || testType.available) && (
          <section className="flex flex-col gap-3 sm:flex-row">
            {hasPracticeContent && (
              <button
                type="button"
                onClick={() => router.push(`/practice?testType=${testId}`)}
                className="flex-1 rounded-full border-2 border-blue-300 bg-white px-6 py-3.5 text-center text-sm font-bold text-blue-700 hover:bg-blue-50"
              >
                練習問題をする
              </button>
            )}
            {testType.available && (
              <button
                type="button"
                onClick={() => setExamModalOpen(true)}
                className="flex-1 rounded-full bg-blue-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow hover:bg-blue-700"
              >
                模試を受験する
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/practice?testType=${testId}&scope=wrong`)}
              className="flex-1 rounded-full border-2 border-orange-300 bg-orange-50 px-6 py-3.5 text-center text-sm font-bold text-orange-700 hover:bg-orange-100"
            >
              復習をする
            </button>
          </section>
        )}

        {/* このテスト専用の成績・分析エリア */}
        {testType.available && userEmail && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-900">{testType.name}の成績</h2>
            <PerformanceDashboard email={userEmail} testType={testId} />
          </section>
        )}
      </main>

      {examModalOpen && (
        <ExamModeSelectModal testType={testType} onClose={() => setExamModalOpen(false)} />
      )}
    </div>
  );
}
