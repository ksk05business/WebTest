// 2026-09-03の希望職種細分化（旧: フラット9種類→新: 志望業界の細分化に合わせた全12種、
// src/data/formOptions.tsのDESIRED_OCCUPATIONS）に伴い、既存ユーザーのusers.desired_occupations
// （JSON文字列配列）に残る旧分類の値を新分類へマッピングするマイグレーションSQLを生成する。
// 旧9種類はすべて新12種類のいずれかへ1:1で対応するため、単純な文字列置換ではなく
// 各ユーザーの行をJSONとして読み込み、配列要素ごとにマッピングしてから書き戻す。
//
// 実行: node scripts/migrate-occupation-values.mts
// → scripts/migrate_occupation_values.sql を生成（コミットしない）。
// このスクリプトは対象ユーザーの現在のdesired_occupationsをローカル/本番のD1から
// 事前にJSONエクスポートしておき（scripts/backups/配下）、それを読み込んで変換する。

import { readFileSync, writeFileSync } from "node:fs";

const OLD_TO_NEW: Record<string, string> = {
  "営業・顧客交渉": "営業・セールス",
  "企画・マーケティング・事業開発": "企画・マーケティング・事業開発",
  "IT・エンジニア・Web制作": "ITエンジニア・データサイエンティスト",
  "研究・開発・技術職": "研究開発・設計・生産技術・建築技術",
  "コンサルタント・アナリスト": "コンサルタント・M&Aアドバイザリー・アナリスト",
  "コーポレート・管理部門（人事・総務・経理・法務等）": "コーポレート・管理部門（人事・財務・経理・法務等）",
  "クリエイティブ・編集・デザイン": "クリエイティブ・編集・メディア制作",
  "サービス・店舗運営・各種専門職": "サービス・接客・販売・店舗運営",
  "こだわりなし・幅広く検討したい": "こだわりなし・総合職（オープンコース）等",
};

// scripts/backups/users_occupations_backup_pre_migration.json
// （`npx wrangler d1 execute webtest-db --remote --command "SELECT id, desired_occupations FROM users" --json`
//   の出力をそのまま保存したもの）を読み込み、id単位でUPDATE文を生成する。
const BACKUP_PATH = new URL("./backups/users_occupations_backup_pre_migration.json", import.meta.url);

type Row = { id: number; desired_occupations: string };

function main() {
  const backup = JSON.parse(readFileSync(BACKUP_PATH, "utf-8"));
  const rows: Row[] = backup[0].results;
  console.log(`Loaded ${rows.length} user rows.`);

  const esc = (s: string) => s.replace(/'/g, "''");
  const statements: string[] = [];
  let changedCount = 0;

  for (const row of rows) {
    let occupations: string[];
    try {
      occupations = JSON.parse(row.desired_occupations);
    } catch {
      throw new Error(`user ${row.id}: could not parse desired_occupations JSON: ${row.desired_occupations}`);
    }
    if (!Array.isArray(occupations)) {
      throw new Error(`user ${row.id}: desired_occupations is not an array`);
    }
    const mapped = occupations.map((o) => OLD_TO_NEW[o] ?? o);
    if (JSON.stringify(mapped) === JSON.stringify(occupations)) continue; // 変更なし（既に新分類 or マッピング対象外）
    changedCount++;
    statements.push(
      `UPDATE users SET desired_occupations = '${esc(JSON.stringify(mapped))}' WHERE id = ${row.id};`
    );
  }

  writeFileSync(new URL("./migrate_occupation_values.sql", import.meta.url), statements.join("\n") + "\n");
  console.log(`${changedCount} rows need updating. Wrote ${statements.length} UPDATE statements to scripts/migrate_occupation_values.sql`);
}

main();
