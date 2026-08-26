"use client";

import { useEffect, useState } from "react";

type CompanyRecommendation = {
  id: number;
  companyName: string;
  corporateSiteUrl: string | null;
  accountType: string;
  industry: string | null;
};

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  direct_hire: "直接採用企業",
  agency: "就活エージェント",
};

// /dashboardの「あなたへのおすすめ企業」セクション。旧ScoutInboxの表示枠を置き換えたもの。
// 現状はマッチングロジックを持たない簡易実装（functions/api/company-recommendations.ts参照）。
export function RecommendedCompanies() {
  const [companies, setCompanies] = useState<CompanyRecommendation[] | null>(null);

  useEffect(() => {
    fetch("/api/company-recommendations")
      .then((res) => res.json())
      .then((data: { companies?: CompanyRecommendation[] }) => setCompanies(data.companies ?? []))
      .catch(() => setCompanies([]));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-gray-900">あなたへのおすすめ企業</h2>

      {companies === null ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : companies.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          現在掲載中のおすすめ企業はありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4"
            >
              <p className="truncate font-semibold text-gray-900">{c.companyName}</p>
              <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {ACCOUNT_TYPE_LABEL[c.accountType] ?? c.accountType}
              </span>
              {c.industry && <p className="text-xs text-gray-500">{c.industry}</p>}
              {c.corporateSiteUrl && (
                <a
                  href={c.corporateSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex min-h-6 items-center text-xs font-medium text-blue-600 underline"
                >
                  企業サイトを見る
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
