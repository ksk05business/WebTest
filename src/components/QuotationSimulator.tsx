"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Users, FileText } from "lucide-react";
import { QUOTATION_PLANS, calculateQuotation, type QuotationPlanId } from "@/src/data/quotationPlans";
import { QuotationDownloadButton } from "@/src/components/pdf/QuotationDownloadButton";

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

// 御見積書の自動作成フォーム（企業名・プラン選択・利用人数の入力→リアルタイム金額計算→PDF
// ダウンロード）。学生非ログイン向けの/enterprise/quotationと、企業ログイン後の/company/quotation
// の両方から共通コンポーネントとして呼び出す（フォームロジック・PDF生成ロジックの重複を避けるため）。
export function QuotationSimulator({
  initialCompanyName = "",
  title = "御見積書の自動作成",
  description = "企業名・プラン・利用人数を入力すると、その場で概算のお見積り金額をご確認いただけます。内容をご確認のうえ、PDFとしてダウンロードいただけます。",
  showBadge = true,
}: {
  initialCompanyName?: string;
  title?: string;
  description?: string;
  showBadge?: boolean;
}) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [planId, setPlanId] = useState<QuotationPlanId>(QUOTATION_PLANS[0].id);
  const [userCount, setUserCount] = useState(10);

  // ログイン済み企業の場合、認証情報の取得が非同期のため初回マウント後に確定するcompanyNameを
  // 入力欄へ反映する（ユーザーが既に手入力していた場合は上書きしない）。
  useEffect(() => {
    if (initialCompanyName) setCompanyName((prev) => prev || initialCompanyName);
  }, [initialCompanyName]);

  const breakdown = useMemo(() => calculateQuotation(planId, userCount), [planId, userCount]);
  const plan = breakdown.plan;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
        {showBadge && (
          <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            <FileText className="h-3.5 w-3.5" />
            企業向け 見積シミュレーション
          </span>
        )}
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="text-sm leading-relaxed text-gray-500 sm:text-base">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 入力フォーム */}
        <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="quotationCompanyName" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Building2 className="h-4 w-4 text-blue-600" />
              企業名
            </label>
            <input
              id="quotationCompanyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社サンプル"
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quotationPlanId" className="text-sm font-semibold text-gray-700">
              プラン選択
            </label>
            <select
              id="quotationPlanId"
              value={planId}
              onChange={(e) => setPlanId(e.target.value as QuotationPlanId)}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            >
              {QUOTATION_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.description}）
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quotationUserCount" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Users className="h-4 w-4 text-blue-600" />
              利用人数
            </label>
            <div className="relative">
              <input
                id="quotationUserCount"
                type="number"
                min={0}
                value={userCount}
                onChange={(e) => setUserCount(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                名
              </span>
            </div>
          </div>

          <div className="mt-1 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
            月額基本料金 {formatCurrency(plan.baseFee)} ＋ 利用人数 × {formatCurrency(plan.perUserFee)}
            （税込10%）で自動計算しています。
          </div>
        </div>

        {/* 見積プレビュー */}
        <div className="flex flex-col gap-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900">御見積り内容</h2>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">プラン</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">利用人数</span>
              <span className="font-semibold text-gray-900">{userCount}名</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-500">小計</span>
              <span className="font-semibold text-gray-900">{formatCurrency(breakdown.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">消費税（10%）</span>
              <span className="font-semibold text-gray-900">{formatCurrency(breakdown.tax)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-white">
            <span className="text-xs font-semibold text-blue-100">合計金額（税込）</span>
            <span className="text-xl font-bold">{formatCurrency(breakdown.total)}</span>
          </div>

          <QuotationDownloadButton
            companyName={companyName}
            planName={plan.name}
            userCount={userCount}
            totalPrice={breakdown.total}
          />

          <p className="text-center text-[11px] leading-relaxed text-gray-400">
            本シミュレーションは概算です。正式なお見積りはお問い合わせ後にご案内いたします。
          </p>
        </div>
      </div>
    </div>
  );
}
