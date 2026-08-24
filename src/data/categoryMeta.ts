// questions.category（大分類、例: "non_verbal", "tamatebako_math"）から、
// テスト種別名・科目グループ名を逆引きするためのルックアップ。
// 復習ノート画面でテスト種別・科目ごとに問題をグルーピング表示するために使う。
// PRACTICE_UNIT_GROUPS_BY_TEST（分野・単元選択画面の定義）を単一の情報源として自動生成するため、
// 単元データを追加・変更した際にここを個別に更新する必要はない。
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { TEST_TYPES } from "@/src/data/testTypes";

export type CategoryMeta = {
  testId: string;
  testLabel: string;
  groupLabel: string;
};

const CATEGORY_META_MAP: Record<string, CategoryMeta> = (() => {
  const map: Record<string, CategoryMeta> = {};
  for (const [testId, groups] of Object.entries(PRACTICE_UNIT_GROUPS_BY_TEST)) {
    const testLabel = TEST_TYPES.find((t) => t.id === testId)?.name ?? testId;
    for (const group of groups) {
      map[group.category] = { testId, testLabel, groupLabel: group.groupLabel };
    }
  }
  return map;
})();

// 未知のcategory（分野・単元選択画面が未定義のテスト種別等）でも表示が崩れないよう、
// category文字列そのものをフォールバック表示に使う。
export function getCategoryMeta(category: string | undefined): CategoryMeta {
  if (category && CATEGORY_META_MAP[category]) return CATEGORY_META_MAP[category];
  return { testId: category ?? "unknown", testLabel: category ?? "その他", groupLabel: category ?? "その他" };
}
