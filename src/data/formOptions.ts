export const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);
export const GRADUATION_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const FACULTY_TYPES = [
  "文系学部",
  "理系学部",
  "リベラルアーツ学部",
  "文系大学院",
  "理系大学院",
  "リベラルアーツ大学院",
] as const;

// 就活で一般的な業界区分に合わせ、2026-09-03に大分類10グループ・計38業種へ細分化した
// （旧: フラットな大分類10種類のみ。2026-08-20に43業種グループから一度この大分類10種類へ
// 統合していたが、企業とのマッチング精度を上げるため再度グループ付き細分類へ移行した）。
// IndustrySelect（学生の登録・マイページ）・管理者画面のフィルター等は、この
// INDUSTRY_GROUPSをoptgroup付きで表示する。既存ユーザーの登録データには旧分類・旧旧分類の
// 値が残っている場合がある（scripts/migrate-industry-values.mts参照、本番適用済み）。
export type IndustryGroup = { group: string; items: readonly string[] };

export const INDUSTRY_GROUPS: readonly IndustryGroup[] = [
  {
    group: "コンサル・M&A",
    items: ["戦略コンサル", "外資系総合コンサル", "日系総合コンサル", "M&A"],
  },
  {
    group: "金融",
    items: ["外資系金融", "メガバンク", "日系証券・保険", "日系投資運用", "公的金融", "その他日系金融"],
  },
  {
    group: "商社",
    items: ["総合商社", "専門商社"],
  },
  {
    group: "外資系企業",
    items: ["外資メーカー", "外資サービス", "外資IT"],
  },
  {
    group: "日系メーカー",
    items: ["自動車", "食品", "化学", "製薬", "アパレル", "日系その他メーカー"],
  },
  {
    group: "日系IT・通信",
    items: ["インターネット", "情報システム・通信・その他IT"],
  },
  {
    group: "日系サービス・インフラ",
    items: ["運輸", "エネルギー", "人材・教育", "旅行代理店", "小売・サービス"],
  },
  {
    group: "不動産・建設",
    items: ["不動産（デベロッパー）", "建設"],
  },
  {
    group: "マスコミ・広告",
    items: ["広告代理店", "テレビ局", "新聞・出版・通信社", "その他メディア"],
  },
  {
    group: "公的機関・その他",
    items: ["国家公務員", "地方公務員", "公的機関・公益法人", "その他"],
  },
] as const;

// 業種名の妥当性チェックや、グループを問わない一覧表示（企業側検索フィルター等）向けの
// フラット化済みリスト。中身はINDUSTRY_GROUPSと完全に同期する（追加・変更は上のみで行うこと）。
export const INDUSTRIES = INDUSTRY_GROUPS.flatMap((g) => g.items);

// 希望職種（最大3つまで選択可）。DBのdesired_occupationsにはJSON文字列配列として保存する。
export const DESIRED_OCCUPATIONS = [
  "営業・顧客交渉",
  "企画・マーケティング・事業開発",
  "IT・エンジニア・Web制作",
  "研究・開発・技術職",
  "コンサルタント・アナリスト",
  "コーポレート・管理部門（人事・総務・経理・法務等）",
  "クリエイティブ・編集・デザイン",
  "サービス・店舗運営・各種専門職",
  "こだわりなし・幅広く検討したい",
] as const;

export const DEFAULT_DESIRED_OCCUPATIONS = ["こだわりなし・幅広く検討したい"];
export const MAX_DESIRED_OCCUPATIONS = 3;

// 企業プロフィール画面で設定する、学生向け「あなたへのおすすめ企業」用のアピールタグ（複数選択可）。
// company_profiles.appeal_tagsにJSON文字列配列として保存する。
export const APPEAL_TAGS = [
  "20代1,000万円以上",
  "30歳時800万円以上",
  "30歳時1,500万円以上",
  "初年度500万円以上",
  "初年度600万円以上",
  "海外勤務・海外駐在あり",
  "20代管理職登用実績あり",
  "配属確約",
  "社費での海外留学制度(MBA等)",
  "職種別採用",
  "転勤なし",
  "住宅補助・社宅制度等あり",
] as const;

export const SHORT_MESSAGE_MAX_LENGTH = 25;
