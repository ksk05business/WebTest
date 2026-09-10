import { INDUSTRIES } from "../../src/data/formOptions";
import { TEST_TYPES } from "../../src/data/testTypes";

// company_borders テーブルへの登録・更新で共通利用する入力検証ロジック。
// functions/api/admin/company-borders.ts（一覧取得・新規登録）と
// functions/api/admin/company-borders/[id].ts（個別編集・削除）の両方から使う。
const VALID_INDUSTRIES = new Set<string>(INDUSTRIES);
const VALID_TEST_TYPES = new Set<string>(TEST_TYPES.map((t) => t.name));
const VALID_BORDER_LEVELS = new Set(["S", "A", "B", "C", "D"]);
// 五十音順ソート（company_name_kana ASC）が正しく機能するよう、ふりがなは全てひらがなで
// 統一することを強制する（カタカナ・漢字・英数字が混在すると/bordersのソート順が崩れるため）。
const HIRAGANA_ONLY = /^[ぁ-んー]+$/;

export type CompanyBorderInput = {
  companyName?: unknown;
  companyNameKana?: unknown;
  industry?: unknown;
  testType?: unknown;
  borderLevel?: unknown;
  selectionTiming?: unknown;
  description?: unknown;
  hasEnglish?: unknown;
  hasStructural?: unknown;
};

export type ValidatedCompanyBorder = {
  companyName: string;
  companyNameKana: string;
  industry: string;
  testType: string;
  borderLevel: string;
  selectionTiming: string;
  description: string;
  hasEnglish: number;
  hasStructural: number;
};

export function validateCompanyBorder(
  input: CompanyBorderInput,
  label: string
): ValidatedCompanyBorder | { error: string } {
  if (typeof input.companyName !== "string" || !input.companyName.trim()) {
    return { error: `${label}: companyNameは必須です` };
  }
  const companyName = input.companyName.trim();
  if (companyName.length > 100) {
    return { error: `${label}: companyNameは100文字以内で入力してください` };
  }

  if (typeof input.companyNameKana !== "string" || !input.companyNameKana.trim()) {
    return { error: `${label}: companyNameKana（ふりがな）は必須です` };
  }
  const companyNameKana = input.companyNameKana.trim();
  if (!HIRAGANA_ONLY.test(companyNameKana)) {
    return { error: `${label}: companyNameKanaはひらがなのみで入力してください（五十音順ソートのため）` };
  }

  if (typeof input.industry !== "string" || !VALID_INDUSTRIES.has(input.industry)) {
    return { error: `${label}: industryが不正です` };
  }
  const industry = input.industry;

  const testType = typeof input.testType === "string" ? input.testType.trim() : "";
  if (testType && !VALID_TEST_TYPES.has(testType)) {
    return { error: `${label}: testTypeが不正です（空欄または${[...VALID_TEST_TYPES].join("/")}のいずれか）` };
  }

  const borderLevel = typeof input.borderLevel === "string" ? input.borderLevel.trim() : "";
  if (borderLevel && !VALID_BORDER_LEVELS.has(borderLevel)) {
    return { error: `${label}: borderLevelが不正です（空欄またはS/A/B/C/Dのいずれか）` };
  }

  const selectionTiming = typeof input.selectionTiming === "string" ? input.selectionTiming.trim() : "";

  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!description) {
    return { error: `${label}: descriptionは必須です` };
  }
  if (description.length > 500) {
    return { error: `${label}: descriptionは500文字以内で入力してください` };
  }

  return {
    companyName,
    companyNameKana,
    industry,
    testType,
    borderLevel,
    selectionTiming,
    description,
    hasEnglish: input.hasEnglish === true ? 1 : 0,
    hasStructural: input.hasStructural === true ? 1 : 0,
  };
}
