"use client";

// 企業PRカードの合間に挟み込む「就活記事コラム」の告知カード（旧・ダッシュボード右サイドバーの
// 独立セクションから、PR一覧の中に挟み込むインライン形式に変更した）。コンテンツは現状プレースホルダーのみ。
function ColumnPromoRow() {
  return (
    <div className="flex flex-col gap-1 bg-emerald-50/50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
          コラム
        </span>
        <p className="font-semibold text-gray-900">就活記事・コラム</p>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        近日公開予定です。就活準備に役立つ記事・コラムをここに掲載していきます。
      </p>
    </div>
  );
}

// /dashboardの「あなたへのおすすめ企業」セクション。旧ScoutInboxの表示枠を置き換えたもの。
// 参画企業の掲載・スカウト機能の本格稼働前のため、`GET /api/company-recommendations`（審査承認済み
// 企業を返す実装、functions/api/company-recommendations.ts参照）は呼ばず、常に「近日公開予定」の
// プレースホルダーを表示する（本番DBの`company_profiles`に残るデモ企業データを学生向けに表示しないため）。
// 実企業の掲載を開始する際は、このプレースホルダー分岐を元の動的フェッチ表示に戻すこと。
export function RecommendedCompanies() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-bold text-gray-900">
          あなたに関心を持つ企業
          <span className="ml-2 inline-block rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 align-middle text-xs font-medium text-gray-600">
            PR
          </span>
        </h2>
        <p className="text-xs text-gray-400">
          ※本エリアは企業からの広告配信（ターゲティングPR）により表示されています
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 p-4">
          <p className="font-semibold text-gray-900">【近日公開】スカウト参加企業</p>
          <p className="text-sm leading-relaxed text-gray-500">
            現在、複数の企業とスカウト・PR連携の準備を進めています。参画企業の公開およびスカウト機能の本格稼働まで今しばらくお待ちください。
          </p>
          <button
            type="button"
            disabled
            className="mt-1 w-fit cursor-not-allowed rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-400"
          >
            準備中
          </button>
        </div>
        <div className="border-t border-gray-100">
          <ColumnPromoRow />
        </div>
      </div>
    </div>
  );
}
