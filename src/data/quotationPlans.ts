// 企業向け見積書機能（/enterprise/quotation）の料金プラン定義。
// 見積フォーム（合計金額のリアルタイム計算）とQuotationPDF（内訳テーブルの表示）の
// 両方から参照する単一の情報源（分散定義によるドリフトを避けるため）。
// ここに設定した金額はプレースホルダーであり、実際の営業金額ではない
// （公開・営業利用前に運営側で正式な料金へ差し替える前提）。
export type QuotationPlanId = "light" | "standard" | "enterprise";

export type QuotationPlan = {
  id: QuotationPlanId;
  name: string;
  baseFee: number; // 月額基本料金（税抜）
  perUserFee: number; // 利用人数1名あたりの追加料金（税抜）
  description: string;
};

export const QUOTATION_PLANS: QuotationPlan[] = [
  {
    id: "light",
    name: "ライトプラン",
    baseFee: 50000,
    perUserFee: 3000,
    description: "小規模な採用活動向け",
  },
  {
    id: "standard",
    name: "スタンダードプラン",
    baseFee: 120000,
    perUserFee: 2500,
    description: "中堅企業の通年採用向け",
  },
  {
    id: "enterprise",
    name: "エンタープライズプラン",
    baseFee: 300000,
    perUserFee: 2000,
    description: "大規模採用・複数拠点向け",
  },
];

export const TAX_RATE = 0.1;

export type QuotationBreakdown = {
  plan: QuotationPlan;
  userFeeSubtotal: number;
  subtotal: number;
  tax: number;
  total: number;
};

export function calculateQuotation(planId: QuotationPlanId, userCount: number): QuotationBreakdown {
  const plan = QUOTATION_PLANS.find((p) => p.id === planId) ?? QUOTATION_PLANS[0];
  const safeUserCount = Number.isFinite(userCount) && userCount > 0 ? userCount : 0;
  const userFeeSubtotal = plan.perUserFee * safeUserCount;
  const subtotal = plan.baseFee + userFeeSubtotal;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  return { plan, userFeeSubtotal, subtotal, tax, total };
}
