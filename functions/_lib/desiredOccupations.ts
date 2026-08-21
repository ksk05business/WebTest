const DESIRED_OCCUPATIONS = [
  "営業・顧客交渉",
  "企画・マーケティング・事業開発",
  "IT・エンジニア・Web制作",
  "研究・開発・技術職",
  "コンサルタント・アナリスト",
  "コーポレート・管理部門（人事・総務・経理・法務等）",
  "クリエイティブ・編集・デザイン",
  "サービス・店舗運営・各種専門職",
  "こだわりなし・幅広く検討したい",
];

const MAX_DESIRED_OCCUPATIONS = 3;

// 希望職種の入力値を検証し、DB保存用のJSON文字列を返す。不正な場合はnull。
export function parseDesiredOccupations(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0 || value.length > MAX_DESIRED_OCCUPATIONS) return null;
  if (!value.every((v) => typeof v === "string" && DESIRED_OCCUPATIONS.includes(v))) return null;
  if (new Set(value).size !== value.length) return null;
  return JSON.stringify(value);
}
