"use client";

import { useEffect, useState } from "react";

type CompanyApplication = {
  id: number;
  companyName: string;
  contactName: string;
  department: string | null;
  jobTitle: string | null;
  email: string;
  phoneNumber: string | null;
  corporateSiteUrl: string | null;
  accountType: string;
  inquiryMessage: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  direct_hire: "直接採用企業",
  agency: "就活エージェント/人材紹介会社",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "審査待ち",
  active: "承認済み",
  rejected: "却下",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-green-100 text-green-700",
  rejected: "bg-gray-100 text-gray-500",
};

const STATUS_TABS = ["pending", "active", "rejected", "all"] as const;

// 企業・就活エージェントの審査申請一覧・承認/却下UI。/admin/companies（単独ページ）と
// /admin/dashboard（統合管理画面の企業タブ）の両方から、同じadminTokenを渡して共用する。
export function CompanyManagementPanel({
  adminToken,
  onAuthError,
}: {
  adminToken: string;
  onAuthError: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number]>("pending");
  const [companies, setCompanies] = useState<CompanyApplication[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [approvedResult, setApprovedResult] = useState<{
    companyName: string;
    email: string;
    initialPassword: string;
  } | null>(null);

  useEffect(() => {
    loadCompanies(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, statusFilter]);

  function loadCompanies(status: string) {
    setLoadError(null);
    const query = status === "all" ? "" : `?status=${status}`;
    fetch(`/api/admin/companies${query}`, {
      headers: { "x-admin-token": adminToken },
    })
      .then((res) => res.json())
      .then((data: { companies?: CompanyApplication[]; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setCompanies(data.companies ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  async function handleReview(company: CompanyApplication, action: "approve" | "reject") {
    setActionError(null);
    setActioningId(company.id);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ companyId: company.id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? "処理に失敗しました");
        return;
      }
      if (action === "approve") {
        setApprovedResult({
          companyName: company.companyName,
          email: data.email,
          initialPassword: data.initialPassword,
        });
      }
      loadCompanies(statusFilter);
    } catch {
      setActionError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {approvedResult && (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-green-400 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-bold">承認しました：{approvedResult.companyName}</p>
          <p>
            ログイン用メールアドレス: <span className="font-mono">{approvedResult.email}</span>
          </p>
          <p>
            初期パスワード:{" "}
            <span className="rounded bg-white px-2 py-0.5 font-mono font-bold">
              {approvedResult.initialPassword}
            </span>
          </p>
          <p className="text-xs text-green-700">
            このパスワードは今だけ表示されます。担当者へ個別にご連絡ください（画面を閉じると再表示できません）。
          </p>
          <button
            type="button"
            onClick={() => setApprovedResult(null)}
            className="mt-1 self-start rounded-full border border-green-400 px-3 py-1 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {STATUS_TABS.map((s) => (
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
      {actionError && <p className="text-sm font-medium text-red-600">{actionError}</p>}

      {!companies ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-gray-500">該当する申請はありません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{c.companyName}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[c.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {ACCOUNT_TYPE_LABEL[c.accountType] ?? c.accountType}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{c.createdAt}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-2">
                <p>
                  担当者: {c.contactName}
                  {c.department && ` / ${c.department}`}
                  {c.jobTitle && ` / ${c.jobTitle}`}
                </p>
                <p>メール: {c.email}</p>
                <p>電話番号: {c.phoneNumber ?? "-"}</p>
                <p>
                  サイト:{" "}
                  {c.corporateSiteUrl ? (
                    <a
                      href={c.corporateSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {c.corporateSiteUrl}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              {c.inquiryMessage && (
                <p className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
                  {c.inquiryMessage}
                </p>
              )}

              {c.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={actioningId === c.id}
                    onClick={() => handleReview(c, "approve")}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    承認する
                  </button>
                  <button
                    type="button"
                    disabled={actioningId === c.id}
                    onClick={() => handleReview(c, "reject")}
                    className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    拒否する
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
