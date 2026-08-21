// 【一度きりのD1移行用スクリプト】src/data/questions.ts にあった旧ハードコード問題データを
// D1のquestions テーブル用INSERT文（seed_questions.sql）に変換した。移行後、questions.ts側の
// データ配列は削除済み（型定義のみ残す）のため、このスクリプトは再実行できない。
// 出力済みのseed_questions.sqlは`wrangler d1 execute --file`でそのまま投入できる。
// 実行時のコマンド: node scripts/generate-seed-questions.mts
import { writeFileSync } from "node:fs";
import { questions } from "../src/data/questions.ts";

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

function sqlString(value: string | null): string {
  return value === null ? "NULL" : `'${sqlEscape(value)}'`;
}

// 既存の "大分類-小分類"（例: "非言語-損益算"）を、大分類（英語コード）と小分類に分割する。
const GROUP_CODE: Record<string, string> = {
  非言語: "non_verbal",
  言語: "verbal",
  構造的把握力: "structural",
};

function splitCategory(category: string): { category: string; subCategory: string } {
  const [group, ...rest] = category.split("-");
  const subCategory = rest.length > 0 ? rest.join("-") : group;
  return { category: GROUP_CODE[group] ?? "non_verbal", subCategory };
}

const lines: string[] = [];
for (const q of questions) {
  const { category, subCategory } = splitCategory(q.category);
  const options = JSON.stringify(q.choices.map((c) => c.text));
  const correctAnswer = q.choices.findIndex((c) => c.label === q.answer);
  const explanation = JSON.stringify(q.explanation);
  const tablesJson = q.tables ? JSON.stringify(q.tables) : null;

  const columns = [
    "category",
    "sub_category",
    "title",
    "question_text",
    "tables_json",
    "options",
    "correct_answer",
    "explanation",
    "difficulty",
    "status",
    "originality_note",
  ];
  const values = [
    sqlString(category),
    sqlString(subCategory),
    sqlString(q.title ?? null),
    sqlString(q.text),
    sqlString(tablesJson),
    sqlString(options),
    String(correctAnswer),
    sqlString(explanation),
    "3",
    "'published'",
    sqlString("src/data/questions.tsからの移設（自作問題）"),
  ];

  lines.push(`INSERT INTO questions (${columns.join(", ")}) VALUES (${values.join(", ")});`);
}

const output = lines.join("\n") + "\n";
writeFileSync(new URL("../seed_questions.sql", import.meta.url), output, "utf-8");
console.log(`seed_questions.sql に${questions.length}件の問題を書き出しました。`);
