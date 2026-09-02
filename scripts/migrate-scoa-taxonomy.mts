// SCOAの科目・単元分類を新しい18単元構成（言語4・数理4・論理5・英語3・常識2）へ再編する
// ワンショットのマイグレーションスクリプト。
//
// 分類方針（ユーザー承認済み、2026-09-02）:
// - 常識（社会・理科）は単元名を変更しない（perCycleの数値のみ定義側で調整）。
// - 言語「熟語・ことわざ・慣用句・故事成語」→「熟語・ことわざ・慣用句」に単元名変更。
//   「漢字・語句の意味」「類義語・対義語」は既存データ無しのため空のまま（新設単元）。
// - 数理は元のoriginality_noteのテーマ別に再分類:
//   二次方程式→方程式・不等式／数列+規則性→数列・規則性／濃度算→文章題（割合・確率・濃度など）。
// - 論理の「推論」→「推論・命題」、「場合の数・順列」→「順序・位置関係」。
// - 論理の「場合の数確率」のうち順列以外（非復元抽出/独立試行の確率・組み合わせ・整数を作る、
//   計48問）はcategoryごとscoa_mathへ移し、「文章題（割合・確率・濃度など）」に統合する
//   （ユーザー指示）。「サイコロ・空間図形」「ベン図」「暗号・法則性」は既存データ無し。
// - 英語は語彙系（イディオム・アクセント・類義語反意語・発音）→「単語・熟語・アクセント」、
//   文法→「英文法・語法」、読解要素のある英会話・英文和訳・和文英訳→「長文読解」に統合。
//
// 実行前に本番の (id, category, sub_category, originality_note) を
// scripts/backups/scoa_backup_pre_migration.json にバックアップ済み（ロールバック用）。
//
// 実行: node scripts/migrate-scoa-taxonomy.mts
// → scripts/migrate_scoa_taxonomy.sql を生成（UPDATE文、これをwrangler d1 executeで適用する）。
//   このsqlファイル自体はコミットしない。

import { readFileSync, writeFileSync } from "node:fs";

type BackupRow = { id: number; category: string; sub_category: string; originality_note: string | null };

type Target = { category: string; subCategory: string };

function classify(row: BackupRow): Target {
  const note = row.originality_note ?? "";

  if (row.category === "scoa_common_sense") {
    // 単元名は変更しない。
    return { category: row.category, subCategory: row.sub_category };
  }

  if (row.category === "scoa_language") {
    if (row.sub_category === "熟語・ことわざ・慣用句・故事成語") {
      return { category: "scoa_language", subCategory: "熟語・ことわざ・慣用句" };
    }
    if (row.sub_category === "長文読解") {
      return { category: "scoa_language", subCategory: "長文読解" };
    }
    throw new Error(`未知のscoa_language sub_category: ${row.sub_category} (id=${row.id})`);
  }

  if (row.category === "scoa_math") {
    if (note.includes("複雑な四則演算")) return { category: "scoa_math", subCategory: "四則計算" };
    if (note.includes("二次方程式")) return { category: "scoa_math", subCategory: "方程式・不等式" };
    if (note.includes("数列")) return { category: "scoa_math", subCategory: "数列・規則性" };
    if (note.includes("規則性")) return { category: "scoa_math", subCategory: "数列・規則性" };
    if (note.includes("濃度算")) return { category: "scoa_math", subCategory: "文章題（割合・確率・濃度など）" };
    throw new Error(`未分類のscoa_math originality_note: ${note} (id=${row.id})`);
  }

  if (row.category === "scoa_logic") {
    if (note.includes("推論")) return { category: "scoa_logic", subCategory: "推論・命題" };
    if (note.includes("場合の数・順列")) return { category: "scoa_logic", subCategory: "順序・位置関係" };
    if (
      note.includes("非復元抽出の確率") ||
      note.includes("独立試行の確率") ||
      note.includes("場合の数・組み合わせ") ||
      note.includes("場合の数・整数を作る")
    ) {
      // ユーザー指示: 数理の「文章題」へ統合（categoryごと移動）。
      return { category: "scoa_math", subCategory: "文章題（割合・確率・濃度など）" };
    }
    throw new Error(`未分類のscoa_logic originality_note: ${note} (id=${row.id})`);
  }

  if (row.category === "scoa_english") {
    if (
      note.includes("イディオム") ||
      note.includes("アクセント") ||
      note.includes("類義語・反意語") ||
      note.includes("発音")
    ) {
      return { category: "scoa_english", subCategory: "単語・熟語・アクセント" };
    }
    if (note.includes("SCOA英語分野: 文法）")) return { category: "scoa_english", subCategory: "英文法・語法" };
    if (note.includes("英文和訳") || note.includes("和文英訳") || note.includes("英会話")) {
      return { category: "scoa_english", subCategory: "長文読解" };
    }
    throw new Error(`未分類のscoa_english originality_note: ${note} (id=${row.id})`);
  }

  throw new Error(`未知のcategory: ${row.category} (id=${row.id})`);
}

function main() {
  const backup: { results: BackupRow[] }[] = JSON.parse(
    readFileSync(new URL("./backups/scoa_backup_pre_migration.json", import.meta.url), "utf8")
  );
  const rows = backup[0].results;
  console.log(`Loaded ${rows.length} rows.`);

  // (現在のcategory::sub_category) -> (新category::sub_category) -> id[] の対応表を作り、
  // 変化があるものだけ効率的にUPDATE文をまとめる（WHERE id IN (...)方式）。
  const groups = new Map<string, { target: Target; ids: number[] }>();
  let unchanged = 0;
  for (const row of rows) {
    const target = classify(row);
    if (target.category === row.category && target.subCategory === row.sub_category) {
      unchanged++;
      continue;
    }
    const key = `${target.category}::${target.subCategory}`;
    const g = groups.get(key) ?? { target, ids: [] };
    g.ids.push(row.id);
    groups.set(key, g);
  }

  console.log(`Unchanged (already matches new taxonomy): ${unchanged}`);
  console.log(`Groups requiring UPDATE: ${groups.size}`);

  const statements: string[] = [];
  for (const [key, g] of groups) {
    console.log(`  -> ${key}: ${g.ids.length} rows`);
    statements.push(
      `UPDATE questions SET category = '${g.target.category}', sub_category = '${g.target.subCategory}' WHERE id IN (${g.ids.join(",")});`
    );
  }

  writeFileSync(new URL("./migrate_scoa_taxonomy.sql", import.meta.url), statements.join("\n") + "\n");
  console.log(`Wrote ${statements.length} UPDATE statements to scripts/migrate_scoa_taxonomy.sql`);

  // 最終的な新分類ごとの件数サマリー（検証用）。
  const finalCounts = new Map<string, number>();
  for (const row of rows) {
    const t = classify(row);
    const key = `${t.category}::${t.subCategory}`;
    finalCounts.set(key, (finalCounts.get(key) ?? 0) + 1);
  }
  console.log("\n--- Final classification summary ---");
  for (const [key, cnt] of [...finalCounts.entries()].sort()) {
    console.log(`  ${key}: ${cnt}`);
  }
  const total = [...finalCounts.values()].reduce((a, b) => a + b, 0);
  console.log(`Total: ${total} (expect 832)`);
}

main();
