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

// 就活生が選びやすいよう、また企業とのマッチング率を上げるため大分類10種類に絞っている。
// 旧: 10グループ・計43業種（INDUSTRY_GROUPS）から移行。既存ユーザーの登録データには
// 旧分類の値が残っている可能性があるため、マイページで表示が空欄になる場合がある。
export const INDUSTRIES = [
  "コンサル・シンクタンク",
  "金融（銀行・証券・保険・投資）",
  "メーカー（自動車・食品・化学・製薬等）",
  "商社（総合・専門）",
  "IT・通信・Web",
  "マスコミ・広告・出版",
  "不動産・建設・デベロッパー",
  "サービス・インフラ（運輸・エネルギー・人材・旅行等）",
  "公的機関・公務員",
  "その他",
] as const;

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
