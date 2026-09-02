import { checkAdminAuth } from "../../_lib/adminAuth";
import { CATEGORY_TO_TEST_ID } from "../../../src/data/practiceUnits";
import { TEST_TYPES } from "../../../src/data/testTypes";
import { EXAM_STOCK_TARGETS, STOCK_CYCLES } from "../../../src/data/examStockTargets";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

type CountRow = { category: string; sub_category: string; is_mock_only: number; cnt: number };

const TEST_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  TEST_TYPES.map((t) => [t.id, t.name])
);

// 問題データ管理ダッシュボード用の集計API。category/sub_category/is_mock_onlyごとの件数を、
// テスト種別・単元単位に整形し、模試専用プール（is_mock_only=1）の在庫目標（3回分、
// src/data/examStockTargets.ts）に対する達成状況を付加して返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const rows = await context.env.DB.prepare(
    `SELECT category, sub_category, is_mock_only, COUNT(*) AS cnt
     FROM questions
     GROUP BY category, sub_category, is_mock_only`
  ).all<CountRow>();

  const byUnit = new Map<
    string,
    { category: string; subCategory: string; practiceCount: number; mockCount: number }
  >();
  for (const r of rows.results ?? []) {
    const key = `${r.category}::${r.sub_category}`;
    const entry = byUnit.get(key) ?? {
      category: r.category,
      subCategory: r.sub_category,
      practiceCount: 0,
      mockCount: 0,
    };
    if (r.is_mock_only) entry.mockCount += r.cnt;
    else entry.practiceCount += r.cnt;
    byUnit.set(key, entry);
  }

  // 在庫目標が定義されているのに実問題データが1件も無い単元（新設単元等）も、
  // 0問（不足）として管理画面に表示できるよう、EXAM_STOCK_TARGETS側からも補完する。
  for (const target of EXAM_STOCK_TARGETS) {
    const key = `${target.category}::${target.subCategory}`;
    if (!byUnit.has(key)) {
      byUnit.set(key, {
        category: target.category,
        subCategory: target.subCategory,
        practiceCount: 0,
        mockCount: 0,
      });
    }
  }

  const units = Array.from(byUnit.values()).map((u) => {
    const target = EXAM_STOCK_TARGETS.find(
      (t) => t.category === u.category && t.subCategory === u.subCategory
    );
    const testId = CATEGORY_TO_TEST_ID[u.category] ?? null;
    const mockTarget = target ? target.perCycle * STOCK_CYCLES : null;
    // SPI等、模試専用プール（is_mock_only=1）を持たず練習問題と同一プールから出題する単元は、
    // mockCountが常に0のままになるため、在庫達成判定はpracticeCountを基準にする。
    const stockBasis = target?.sharesPoolWithPractice ? u.practiceCount : u.mockCount;
    const stockStatus: "not_applicable" | "achieved" | "insufficient" =
      mockTarget === null ? "not_applicable" : stockBasis >= mockTarget ? "achieved" : "insufficient";
    return {
      testId,
      testName: testId ? TEST_NAME_BY_ID[testId] ?? testId : "その他",
      sectionLabel: target?.sectionLabel ?? null,
      category: u.category,
      subCategory: u.subCategory,
      practiceCount: u.practiceCount,
      mockCount: u.mockCount,
      total: u.practiceCount + u.mockCount,
      perCycle: target?.perCycle ?? null,
      mockTarget,
      stockShortfall: mockTarget !== null ? Math.max(0, mockTarget - stockBasis) : 0,
      stockStatus,
    };
  });

  units.sort((a, b) => {
    if (a.testName !== b.testName) return a.testName.localeCompare(b.testName, "ja");
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.subCategory.localeCompare(b.subCategory, "ja");
  });

  const totals = units.reduce(
    (acc, u) => {
      acc.practiceCount += u.practiceCount;
      acc.mockCount += u.mockCount;
      return acc;
    },
    { practiceCount: 0, mockCount: 0 }
  );

  return Response.json({ units, totals });
};
