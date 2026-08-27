"use client";

import { useEffect, useState } from "react";

type CompanyRecommendation = {
  id: number;
  companyName: string;
  corporateSiteUrl: string | null;
  accountType: string;
  industry: string | null;
  shortMessage: string | null;
  appealTags: string[];
  isFeatured: boolean;
};

// /dashboardの「あなたへのおすすめ企業」セクション。旧ScoutInboxの表示枠を置き換えたもの。
// 現状はマッチングロジックを持たない簡易実装（functions/api/company-recommendations.ts参照）。
// 業種（industry）は現状ほとんどの企業で未設定（NULL）のため、無い場合は汎用の案内文にフォールバックする。
// account_type（直接採用企業/就活エージェント）はデモ用の内部区分でありユーザー向けの意味が薄いため非表示にした。
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
        <div className="max-h-96 scroll-smooth overflow-y-auto rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {companies.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {c.isFeatured && (
                    <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-xs font-bold text-white">
                      PR
                    </span>
                  )}
                  <p className="flex-shrink-0 truncate font-semibold text-gray-900 sm:w-44">
                    {c.companyName}
                  </p>
                  {c.industry && (
                    <span className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {c.industry}
                    </span>
                  )}
                  <p className="min-w-0 flex-1 truncate text-xs text-gray-500">
                    {c.shortMessage
                      ? c.shortMessage
                      : c.industry
                      ? `${c.industry}分野で求人情報を掲載中です。`
                      : "求人情報の詳細は企業サイトをご確認ください。"}
                  </p>
                  {c.corporateSiteUrl && (
                    <a
                      href={c.corporateSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 whitespace-nowrap text-xs font-medium text-blue-600 underline"
                    >
                      企業サイトを見る
                    </a>
                  )}
                </div>
                {c.appealTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.appealTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
