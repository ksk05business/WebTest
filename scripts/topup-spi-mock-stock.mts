// SPI3の模試専用プール（questions.is_mock_only=1）が在庫目標（perCycle × STOCK_CYCLES、
// src/data/examStockTargets.ts）に届いていない単元について、同じ単元の練習問題
// （is_mock_only=0）を不足分だけ模試専用へ振り替えるマイグレーションSQLを生成する。
// 2026-09-02にSPIを他テスト（GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行した
// （app/test/page.tsxのEXAM_PARTS.spi_basic/spi_english/spi_structuralをmockOnly: trueに変更）
// ための振り替え。scripts/topup-scoa-mock-stock.mtsと同じ自己計算方式（SQLiteのスカラー
// サブクエリで実行時に不足数を自己計算するため、ローカル/本番どちらの在庫数に対しても
// そのまま安全に実行できる）。
//
// 実行: node scripts/topup-spi-mock-stock.mts
// → scripts/topup_spi_mock_stock.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";
import { EXAM_STOCK_TARGETS, STOCK_CYCLES } from "../src/data/examStockTargets.ts";

const SPI_CATEGORIES = ["verbal", "non_verbal", "english", "structural"];

function main() {
  const targets = EXAM_STOCK_TARGETS.filter((t) => SPI_CATEGORIES.includes(t.category));
  console.log(`Found ${targets.length} SPI unit targets.`);

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

  writeFileSync(new URL("./topup_spi_mock_stock.sql", import.meta.url), statements.join("\n\n") + "\n");
  console.log(`Wrote ${statements.length} UPDATE statements to scripts/topup_spi_mock_stock.sql`);
  targets.forEach((t) => {
    console.log(`  ${t.category}::${t.subCategory} -> target ${t.perCycle * STOCK_CYCLES} (perCycle ${t.perCycle} x ${STOCK_CYCLES})`);
  });
}

main();
