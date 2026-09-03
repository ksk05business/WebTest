// 2026-09-03の志望業界細分化（大分類10種類→大分類10グループ・計38業種、src/data/formOptions.ts
// のINDUSTRY_GROUPS）に伴い、既存ユーザーのusers.industry_first/second/thirdに残る旧分類
// （2026-08-20に一度統合した大分類10種類のフラット値）を新しい葉ノードへマッピングする
// マイグレーションSQLを生成する。
//
// マッピング方針: 新分類の各グループに「その他系」の葉ノードがある場合はそれを優先的に使う
// （旧分類自体が複数の新カテゴリにまたがる曖昧な括りだったため、特定の葉ノードへ断定しない）。
// 「その他」系の葉ノードが無いグループは、旧分類の文言に最も近い葉ノード、または
// グループ内で最初に列挙された葉ノードを採用する。
//
// 実行: node scripts/migrate-industry-values.mts
// → scripts/migrate_industry_values.sql を生成（コミットしない）。

import { writeFileSync } from "node:fs";

const OLD_TO_NEW: Record<string, string> = {
  "コンサル・シンクタンク": "日系総合コンサル",
  "金融（銀行・証券・保険・投資）": "その他日系金融",
  "メーカー（自動車・食品・化学・製薬等）": "日系その他メーカー",
  "商社（総合・専門）": "総合商社",
  "IT・通信・Web": "情報システム・通信・その他IT",
  "マスコミ・広告・出版": "その他メディア",
  "不動産・建設・デベロッパー": "不動産（デベロッパー）",
  "サービス・インフラ（運輸・エネルギー・人材・旅行等）": "小売・サービス",
  "公的機関・公務員": "公的機関・公益法人",
  // "その他" はマイグレーション後も新分類（公的機関・その他グループ）にそのまま存在するため対象外。
};

function main() {
  const esc = (s: string) => s.replace(/'/g, "''");
  const statements: string[] = [];
  for (const col of ["industry_first", "industry_second", "industry_third"]) {
    for (const [oldValue, newValue] of Object.entries(OLD_TO_NEW)) {
      statements.push(
        `UPDATE users SET ${col} = '${esc(newValue)}' WHERE ${col} = '${esc(oldValue)}';`
      );
    }
  }
  writeFileSync(new URL("./migrate_industry_values.sql", import.meta.url), statements.join("\n") + "\n");
  console.log(`Wrote ${statements.length} UPDATE statements to scripts/migrate_industry_values.sql`);
}

main();
