// SCOAの模試専用プール（questions.is_mock_only=1）が在庫目標（perCycle × STOCK_CYCLES、
// src/data/examStockTargets.ts）に届いていない単元について、同じ単元の練習問題
// （is_mock_only=0）を不足分だけ模試専用へ振り替えるマイグレーションSQLを生成する。
//
// 各UPDATE文はSQLiteのスカラーサブクエリで実行時に不足数を自己計算するため、事前に
// ローカル/本番それぞれの在庫数を調べて数値を出し分ける必要がない（どちらの環境に対しても
// そのまま安全に実行でき、既に目標達成済みの単元はLIMIT 0相当になり何も動かさない・
// 練習問題の在庫が不足分より少ない場合は存在する分だけ全て振り替える）。
//
// 実行: node scripts/topup-scoa-mock-stock.mts
// → scripts/topup_scoa_mock_stock.sql を生成（このsqlファイル自体はコミットしない）。
//   生成後、wrangler d1 execute webtest-db --local --file=... / --remote --file=... で適用する。

import { writeFileSync } from "node:fs";
import { EXAM_STOCK_TARGETS, STOCK_CYCLES } from "../src/data/examStockTargets.ts";

function main() {
  const scoaTargets = EXAM_STOCK_TARGETS.filter((t) => t.category.startsWith("scoa_"));
  console.log(`Found ${scoaTargets.length} SCOA unit targets.`);

  const statements = scoaTargets.map((t) => {
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

  writeFileSync(
    new URL("./topup_scoa_mock_stock.sql", import.meta.url),
    statements.join("\n\n") + "\n"
  );
  console.log(`Wrote ${statements.length} UPDATE statements to scripts/topup_scoa_mock_stock.sql`);
  scoaTargets.forEach((t) => {
    console.log(`  ${t.category}::${t.subCategory} -> target ${t.perCycle * STOCK_CYCLES} (perCycle ${t.perCycle} x ${STOCK_CYCLES})`);
  });
}

main();
