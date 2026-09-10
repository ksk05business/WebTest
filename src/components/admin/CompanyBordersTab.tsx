"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { INDUSTRIES } from "@/src/data/formOptions";
import { CompanyBorderEditModal } from "./CompanyBorderEditModal";

export type AdminCompanyBorder = {
  id: number;
  companyName: string;
  companyNameKana: string;
  industry: string;
  testType: string;
  borderLevel: string;
  selectionTiming: string;
  description: string;
  hasEnglish: boolean;
  hasStructural: boolean;
  createdAt: string;
};

// /borders（学生向け公開ページ）に掲載する企業ボーダー情報の管理タブ。企業の追加・編集・削除と、
// 検査種別が未設定（空欄）の企業の洗い出しができる。企業数が増えてもページングは不要な規模
// （数百社程度）のため、全件取得＋クライアント側フィルタ済み結果をそのまま表示する。
export function CompanyBordersTab({
  adminToken,
  onAuthError,
  onDataChanged,
}: {
  adminToken: string;
  onAuthError: () => void;
  onDataChanged?: () => void;
}) {
  const [companies, setCompanies] = useState<AdminCompanyBorder[] | null>(null);
  const [total, setTotal] = useState(0);
  const [incompleteTotal, setIncompleteTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<AdminCompanyBorder | null | "new">(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCompanies();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, search, industryFilter, incompleteOnly]);

  function loadCompanies() {
    setLoadError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (industryFilter) params.set("industry", industryFilter);
    if (incompleteOnly) params.set("incompleteOnly", "true");
    fetch(`/api/admin/company-borders?${params.toString()}`, {
      headers: { "x-admin-token": adminToken },
    })
      .then((res) => res.json())
      .then((data: { companyBorders?: AdminCompanyBorder[]; total?: number; incompleteTotal?: number; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setCompanies(data.companyBorders ?? []);
        setTotal(data.total ?? 0);
        setIncompleteTotal(data.incompleteTotal ?? 0);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  async function handleDelete(company: AdminCompanyBorder) {
    if (!confirm(`「${company.companyName}」を削除します。よろしいですか？`)) return;
    setActionError(null);
    setDeletingId(company.id);
    try {
      const res = await fetch(`/api/admin/company-borders/${company.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        setActionError(data.error ?? "削除に失敗しました");
        return;
      }
      loadCompanies();
      onDataChanged?.();
    } catch {
      setActionError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>
            全<span className="font-bold text-gray-900">{total}</span>社
          </span>
          {incompleteTotal > 0 && (
            <button
              type="button"
              onClick={() => setIncompleteOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                incompleteOnly ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              }`}
            >
              検査種別未設定 {incompleteTotal}社{incompleteOnly ? "（表示中）" : ""}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingCompany("new")}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          企業を追加
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="企業名・ふりがなで検索"
          className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">すべての業界</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}
      {actionError && <p className="text-sm font-medium text-red-600">{actionError}</p>}

      {!companies ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-gray-500">該当する企業はありません。</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-semibold">企業名</th>
                <th className="px-3 py-2 font-semibold">業界</th>
                <th className="px-3 py-2 font-semibold">検査種別</th>
                <th className="px-3 py-2 font-semibold">ボーダー</th>
                <th className="px-3 py-2 font-semibold">英語/構造</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-gray-900">{c.companyName}</p>
                    <p className="text-xs text-gray-400">{c.companyNameKana}</p>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.industry}</td>
                  <td className="px-3 py-2">
                    {c.testType ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {c.testType}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        未設定
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{c.borderLevel || "-"}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {c.hasEnglish && <span className="mr-1 rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">英語</span>}
                    {c.hasStructural && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">構造</span>
                    )}
                    {!c.hasEnglish && !c.hasStructural && "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCompany(c)}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                        aria-label="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c)}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingCompany !== null && (
        <CompanyBorderEditModal
          company={editingCompany === "new" ? null : editingCompany}
          adminToken={adminToken}
          onClose={() => setEditingCompany(null)}
          onSaved={() => {
            setEditingCompany(null);
            loadCompanies();
            onDataChanged?.();
          }}
          onAuthError={onAuthError}
        />
      )}
    </div>
  );
}
