// 2026-09-03に志望業界の細分化（src/data/formOptions.tsのINDUSTRY_GROUPS）に合わせて
// 全12種へ更新。旧分類から移行する既存ユーザーのデータはscripts/migrate-occupation-values.mts
// で新分類へマッピング済み（本番適用済み）。選択肢を増減する際はsrc/data/formOptions.tsの
// DESIRED_OCCUPATIONSも同時に修正すること（マスター一覧を意図的に2箇所へ分離している）。
const DESIRED_OCCUPATIONS = [
  "営業・セールス",
  "企画・マーケティング・事業開発",
  "コンサルタント・M&Aアドバイザリー・アナリスト",
  "金融系専門職（投資銀行・運用・アクチュアリー等）",
  "ITエンジニア・データサイエンティスト",
  "研究開発・設計・生産技術・建築技術",
  "クリエイティブ・編集・メディア制作",
  "コーポレート・管理部門（人事・財務・経理・法務等）",
  "物流・購買・サプライチェーン管理 (SCM)",
  "サービス・接客・販売・店舗運営",
  "公務員・教員・団体職員",
  "こだわりなし・総合職（オープンコース）等",
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
