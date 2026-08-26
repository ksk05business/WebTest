"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { PerformanceDashboard } from "@/src/components/PerformanceDashboard";
import { RecommendedCompanies } from "@/src/components/RecommendedCompanies";
import { ExamModeSelectModal } from "@/src/components/ExamModeSelectModal";
import { TEST_TYPES, type TestType } from "@/src/data/testTypes";
import { formatJapaneseDate } from "@/src/lib/formatDate";

type Eligibility = { eligible: boolean; nextResetAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedTestType, setSelectedTestType] = useState<TestType | null>(null);
  const [eligibilityByType, setEligibilityByType] = useState<Record<string, Eligibility>>({});

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { name?: string; email?: string };
    setUserName(user.name ?? "");
    if (user.email) setUserEmail(user.email);
    setAuthChecked(true);
  }, [router]);

  // 受験可能なテスト種別ごとに、本番模試の今期受験状況（2ヶ月に1回・奇数月1日一斉リセット）を取得する。
  useEffect(() => {
    if (!authChecked) return;
    TEST_TYPES.filter((t) => t.available).forEach((t) => {
      fetch(`/api/exam-eligibility?testType=${encodeURIComponent(t.id)}`)
        .then((res) => res.json())
        .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
          if (data.error) return;
          setEligibilityByType((prev) => ({
            ...prev,
            [t.id]: { eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" },
          }));
        })
        .catch(() => {});
    });
  }, [authChecked]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-6 text-gray-600">ようこそ、{userName}さん</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* メインエリア */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-gray-900">試験の種類</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TEST_TYPES.map((t) =>
                  t.available ? (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTestType(t)}
                      className="min-h-12 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      {t.name}
                      <p className="mt-1 text-[10px] font-normal text-gray-500">
                        {!eligibilityByType[t.id]
                          ? "受験状況を確認中..."
                          : eligibilityByType[t.id].eligible
                          ? "今期 受験可能（2ヶ月に1回）"
                          : `受験済み（次回リセット: ${formatJapaneseDate(eligibilityByType[t.id].nextResetAt)}）`}
                      </p>
                    </button>
                  ) : (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTestType(t)}
                      className="min-h-12 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-400 hover:bg-gray-100"
                    >
                      {t.name}
                      <p className="mt-1 text-xs">準備中</p>
                    </button>
                  )
                )}
              </div>
            </div>

            {userEmail && <PerformanceDashboard email={userEmail} />}

            <RecommendedCompanies />
          </div>

          {/* 右サイドバー */}
          <aside className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900">就活記事・コラム</h3>
              <p className="text-xs leading-relaxed text-gray-500">
                近日公開予定です。就活準備に役立つ記事・コラムをここに掲載していきます。
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-bold text-gray-900">適性検査 実施企業・ボーダー一覧</h3>
              <p className="text-xs leading-relaxed text-gray-500">
                近日公開予定です。SPI・玉手箱等の適性検査を実施している企業や、ボーダーラインの目安をここに掲載していきます。
              </p>
            </div>
          </aside>
        </div>
      </main>

      {selectedTestType && (
        <ExamModeSelectModal
          testType={selectedTestType}
          onClose={() => setSelectedTestType(null)}
        />
      )}
    </div>
  );
}
