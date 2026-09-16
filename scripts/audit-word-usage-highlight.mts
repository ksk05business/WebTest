// verbal/語句の用法（「問題文の太字の語と、同じ用法のものを選びなさい」形式）の全問題を対象に、
// 選択肢テキスト内で問題文の【対象語句】に対応する箇所が、フロントエンド
// （src/components/HighlightedText.tsx）でハイライトできる状態になっているかを監査する。
//
// ハイライトできる条件は以下のいずれか:
//   1. 選択肢が対象語句をそのまま含む（文字列一致）
//   2. 選択肢に "[[語句]]" マークアップが付与済み
//
// どちらにも該当しない選択肢は、活用形・送り仮名・同訓異字違いで単純一致しないケースが
// 大半のため、対象語句の活用語尾を落とした「語幹」で再探索し、選択肢内での一致箇所を
// 手がかりとして提示する（自動で[[ ]]を書き込むことはしない。誤った箇所を機械的に
// マークアップしてしまうと、意味の異なる紛らわしい選択肢にまで誤ってハイライトが付き、
// 逆に問題の妥当性を損なうため、最終的な採否は人間が判断する）。
//
// 使い方:
//   1. 監査対象のJSONを用意する:
//      npx wrangler d1 execute DB --remote --command "SELECT id, question_text, options FROM questions WHERE category='verbal' AND sub_category='語句の用法' ORDER BY id" --json > scripts/tmp-word-usage.json
//   2. npx tsx scripts/audit-word-usage-highlight.mts scripts/tmp-word-usage.json
//   3. レポートを見て、"要確認" の選択肢だけ人力で[[ ]]要否を判断し、直接SQLを書いて適用する
//      （本番適用は npx wrangler d1 execute DB --remote --file=<生成したsql>）。

import { readFileSync } from "node:fs";

type Row = { id: number; question_text: string; options: string };

const path = process.argv[2];
if (!path) {
  console.error("Usage: npx tsx scripts/audit-word-usage-highlight.mts <path-to-d1-json-export>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(path, "utf8"));
const rows: Row[] = raw[0].results;

const BRACKET_TARGET_PATTERN = /【([^】]+)】/;

// 活用語尾（長いものから優先的に試す）。対象語句がこれで終わる場合、語幹部分だけを
// 取り出して選択肢内を再探索する。動詞・形容詞・助動詞の主要な活用パターンを
// 網羅的にではなく代表的なもののみカバーする（完全な形態素解析の代替ではない）。
const CONJUGATION_ENDINGS = [
  "られる",
  "させる",
  "かった",
  "くて",
  "けば",
  "んだ",
  "んで",
  "した",
  "して",
  "った",
  "って",
  "いた",
  "いて",
  "れる",
  "せる",
  "たら",
  "れば",
  "ながら",
  "い",
  "る",
  "た",
  "て",
  "く",
  "ぐ",
  "す",
  "つ",
  "ぬ",
  "ぶ",
  "む",
  "う",
  "ば",
];

function stemsOf(target: string): string[] {
  const set = new Set<string>([target]);
  for (const ending of CONJUGATION_ENDINGS) {
    if (target.length > ending.length && target.endsWith(ending)) {
      set.add(target.slice(0, -ending.length));
    }
  }
  return [...set].sort((a, b) => b.length - a.length);
}

let totalChoices = 0;
let exactOrMarked = 0;
let stemCandidates = 0;
let noMatch = 0;
let noBracket = 0;

for (const row of rows) {
  const bracketMatch = row.question_text.match(BRACKET_TARGET_PATTERN);
  if (!bracketMatch) {
    noBracket++;
    console.log(`[要確認] id=${row.id}: 問題文に【】が見つかりません`);
    continue;
  }
  const target = bracketMatch[1];
  const options: string[] = JSON.parse(row.options);

  for (const choice of options) {
    totalChoices++;
    if (choice.includes("[[") || choice.includes(target)) {
      exactOrMarked++;
      continue;
    }
    // 語幹での柔軟一致を試す（最長の語幹から）
    let found: { stem: string; index: number } | null = null;
    for (const stem of stemsOf(target)) {
      if (stem.length === 0) continue;
      const idx = choice.indexOf(stem);
      if (idx !== -1) {
        found = { stem, index: idx };
        break;
      }
    }
    if (found) {
      stemCandidates++;
      console.log(
        `[要確認] id=${row.id} target="${target}" choice="${choice}" -> 語幹"${found.stem}"が位置${found.index}に出現（[[ ]]付与を検討）`
      );
    } else {
      noMatch++;
      console.log(`[意図的な不一致の可能性] id=${row.id} target="${target}" choice="${choice}" -> 語幹一致なし（別の語を使った紛らわしい選択肢の可能性が高い）`);
    }
  }
}

console.log("\n=== サマリー ===");
console.log(`対象問題数: ${rows.length}（うち【】無し: ${noBracket}）`);
console.log(`選択肢総数: ${totalChoices}`);
console.log(`既にハイライト可能（完全一致 or [[ ]]済み）: ${exactOrMarked}`);
console.log(`語幹一致の候補あり（要人力確認）: ${stemCandidates}`);
console.log(`一致なし（意図的な別語の可能性）: ${noMatch}`);
