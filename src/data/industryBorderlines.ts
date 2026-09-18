import { INDUSTRY_GROUPS } from "./formOptions";

// 業界別のWebテスト突破目安（偏差値ボーダーライン）。あくまで一般的な傾向をもとにした仮の目安値であり、
// 企業ごとの実際の合格基準を保証するものではない（マイページ・模試結果画面の注記に明記する）。
// src/data/formOptions.tsのINDUSTRY_GROUPS（全38業種）の葉ノードすべてを網羅する。
export const INDUSTRY_BORDERLINE_DEVIATION: Record<string, number> = {
  // コンサル・M&A
  戦略コンサル: 65,
  外資系総合コンサル: 63,
  日系総合コンサル: 58,
  "M&A/FAS": 64,
  // 金融
  外資系金融: 64,
  メガバンク: 58,
  "日系証券・保険": 55,
  日系投資運用: 60,
  公的金融: 56,
  その他日系金融: 53,
  // 商社
  総合商社: 62,
  専門商社: 55,
  // 外資系企業
  外資メーカー: 60,
  外資サービス: 58,
  外資IT: 60,
  // 日系メーカー
  自動車: 55,
  食品: 54,
  化学: 54,
  製薬: 57,
  アパレル: 52,
  日系その他メーカー: 50,
  // 日系IT・通信
  インターネット: 56,
  "情報システム・通信・その他IT": 52,
  // 日系サービス・インフラ
  運輸: 48,
  エネルギー: 52,
  "人材・教育": 50,
  旅行代理店: 48,
  "小売・サービス": 47,
  // 不動産・建設
  "不動産（デベロッパー）": 56,
  建設: 50,
  // マスコミ・広告
  広告代理店: 58,
  テレビ局: 60,
  "新聞・出版・通信社": 57,
  その他メディア: 52,
  // 公的機関・その他
  国家公務員: 58,
  地方公務員: 52,
  "公的機関・公益法人": 52,
  その他: 50,
};

export const DEFAULT_BORDERLINE_DEVIATION = 50;

export function getBorderlineDeviation(industry: string | null | undefined): number {
  if (!industry) return DEFAULT_BORDERLINE_DEVIATION;
  return INDUSTRY_BORDERLINE_DEVIATION[industry] ?? DEFAULT_BORDERLINE_DEVIATION;
}

// 定義漏れが無いことをビルド時に検知するための整合性チェック（開発時の参照用途、実行はしない）。
export function assertAllIndustriesHaveBorderline(): void {
  const allLeaves = INDUSTRY_GROUPS.flatMap((g) => g.items);
  const missing = allLeaves.filter((i) => !(i in INDUSTRY_BORDERLINE_DEVIATION));
  if (missing.length > 0) {
    throw new Error(`Missing borderline deviation for industries: ${missing.join(", ")}`);
  }
}
