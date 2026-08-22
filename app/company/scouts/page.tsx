"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { redirectToCompanyLogin } from "@/src/lib/authRedirect";

type SentScout = {
  id: number;
  status: string;
  isAnonymous: boolean;
  title: string;
  message: string | null;
  createdAt: string;
  universityCategory: string | null;
  facultyType: string;
  industryFirst: string;
  industrySecond: string;
  industryThird: string;
  desiredOccupations: string[];
  lastName: string | null;
  firstName: string | null;
  email: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  sent: "返信待ち",
  accepted: "承諾（実名開示済み）",
  declined: "辞退",
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-gray-100 text-gray-500",
};

export default function CompanyScoutsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [approved, setApproved] = useState(false);

  const [scouts, setScouts] = useState<SentScout[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    const company = JSON.parse(raw) as { companyName?: string; email?: string; approved?: boolean };
    if (!company.email) {
      router.replace("/company/login");
      return;
    }
    setCompanyEmail(company.email);
    setCompanyName(company.companyName ?? "");
    setApproved(Boolean(company.approved));
    setAuthChecked(true);

    if (company.approved) {
      loadScouts(company.email);
    }
  }, [router]);

  function loadScouts(email: string) {
    fetch(`/api/company/sent-scouts?companyEmail=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data: { scouts?: SentScout[]; error?: string }) => {
        if (data.error === "ログインが必要です") {
          redirectToCompanyLogin(router);
          return;
        }
        if (data.scouts) {
          setScouts(data.scouts);
        } else {
          setLoadError(data.error ?? "送信履歴の取得に失敗しました");
        }
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  if (!authChecked) {
    return null;
  }

  const visibleScouts =
    scouts && statusFilter !== "all" ? scouts.filter((s) => s.status === statusFilter) : scouts;

  return (
    <div className="min-h-screen">
      <CompanyHeader companyName={companyName} />

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <h1 className="text-lg font-bold text-gray-900">スカウト送信履歴・ステータス管理</h1>

        {!approved ? (
          <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold">アカウントは運営の承認待ちです。</p>
            <p className="mt-1">承認され次第、送信履歴がご利用いただけるようになります。</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">ステータスで絞り込み:</span>
              {(["all", "sent", "accepted", "declined"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 font-medium ${
                    statusFilter === s
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s === "all" ? "すべて" : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}

            {!scouts ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : visibleScouts && visibleScouts.length === 0 ? (
              <p className="text-sm text-gray-500">該当するスカウトはありません。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleScouts?.map((s) => (
                  <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        <span className="text-xs text-gray-400">{s.createdAt}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{s.title || "(件名なし)"}</p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                        {s.universityCategory ?? "区分未設定"}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">{s.facultyType}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">
                        志望業界: {s.industryFirst} / {s.industrySecond} / {s.industryThird}
                      </span>
                    </div>
                    {s.desiredOccupations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.desiredOccupations.map((o) => (
                          <span
                            key={o}
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                      {s.isAnonymous ? (
                        <p className="text-gray-400">
                          承諾するまで、この候補者の氏名・メールアドレスは開示されません。
                        </p>
                      ) : (
                        <p>
                          <span className="font-semibold text-gray-900">
                            {s.lastName} {s.firstName}
                          </span>
                          <span className="ml-2 text-gray-600">{s.email}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="mt-2 text-xs font-medium text-blue-600 underline"
                    >
                      {expandedId === s.id ? "送信メッセージを閉じる" : "送信メッセージを確認する"}
                    </button>
                    {expandedId === s.id && (
                      <p className="mt-2 whitespace-pre-wrap rounded-md border border-gray-200 p-3 text-sm text-gray-700">
                        {s.message || "(本文なし)"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
