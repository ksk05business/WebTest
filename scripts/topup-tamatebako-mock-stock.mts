// 玉手箱の「計数・表の空欄推測」「英語・論理的読解（GAB形式）」「英語・長文読解（IMAGES形式）」
// （＝ユーザー確認済みの「英語（全形式＝英語カテゴリの実在2形式）」＋「計数（表推測）」の3単元）で、
// 模試専用プール（questions.is_mock_only=1）が在庫目標（perCycle × STOCK_CYCLES、
// src/data/examStockTargets.ts）に届いていない分を、同じ単元の練習問題（is_mock_only=0）から
// 振り替えるマイグレーションSQLを生成する。
// scripts/topup-scoa-mock-stock.mts / topup-spi-mock-stock.mts と同じ自己計算方式
// （SQLiteのスカラーサブクエリで実行時に不足数を自己計算するため、ローカル/本番どちらの
// 在庫数に対してもそのまま安全に実行できる。練習問題ストックが目標に満たない場合は
// LIMIT MAX(0, MIN(...))が自動的に「存在する全数」に丸められる）。
//
// 実行: node scripts/topup-tamatebako-mock-stock.mts
// → scripts/topup_tamatebako_mock_stock.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";
import { EXAM_STOCK_TARGETS, STOCK_CYCLES } from "../src/data/examStockTargets.ts";

const TARGET_UNITS: { category: string; subCategory: string }[] = [
  { category: "tamatebako_math", subCategory: "表の空欄推測" },
  { category: "tamatebako_english", subCategory: "論理的読解（GAB形式）" },
  { category: "tamatebako_english", subCategory: "長文読解（IMAGES形式）" },
];

function main() {
  const targets = TARGET_UNITS.map((u) => {
    const t = EXAM_STOCK_TARGETS.find(
      (t) => t.category === u.category && t.subCategory === u.subCategory
    );
    if (!t) throw new Error(`No stock target found for ${u.category}::${u.subCategory}`);
    return t;
  });
  console.log(`Found ${targets.length} target units.`);

  const statements = targets.map((t) => {
    const target = t.perCycle * STOCK_CYCLES;
    const category = t.category.replace(/'/g, "''");
    const subCategory = t.subCategory.replace(/'/g, "''");
    return `UPDATE questions
SET is_mock_only = 1
WHERE id IN (
  SELECT id FROM questions
  WHERE category = '${category}' AND sub_category = '${subCategory}' AND is_mock_only = 0
  ORDER BY id
  LIMIT MAX(0, MIN(
    ${target} - (SELECT COUNT(*) FROM questions WHERE category = '${category}' AND sub_category = '${subCategory}' AND is_mock_only = 1),
    (SELECT COUNT(*) FROM questions WHERE category = '${category}' AND sub_category = '${subCategory}' AND is_mock_only = 0)
  ))
);`;
  });

  writeFileSync(new URL("./topup_tamatebako_mock_stock.sql", import.meta.url), statements.join("\n\n") + "\n");
  console.log(`Wrote ${statements.length} UPDATE statements to scripts/topup_tamatebako_mock_stock.sql`);
  targets.forEach((t) => {
    console.log(`  ${t.category}::${t.subCategory} -> target ${t.perCycle * STOCK_CYCLES} (perCycle ${t.perCycle} x ${STOCK_CYCLES})`);
  });
}

main();
