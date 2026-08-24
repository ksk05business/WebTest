// SPI3「英語」科目 英英辞典の問題を生成するスクリプト。
// 元データ: ユーザー提供の SPI_英英辞典問題集.md（全30問）。
// 元データの解答をすべて手動で単語の意味と照合し、誤りがないことを確認済み（今回は修正なし）。
// 正解の分布は元データの時点で比較的均等だった（A:4,B:8,C:7,D:6,E:5）が、
// 他の単元と同様の方針としてスクリプト側で選択肢をシャッフルする。
// category=english, sub_category=英英辞典 として挿入する（既存の practiceUnits.ts の
// SPI「英語（能力）」グループに定義済みの単元。これで同グループ4単元すべてにデータが揃う）。
// 実行: node scripts/seed-spi-english-dictionary.mts
// → scripts/seed_spi_english_dictionary.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type DictionaryQuestion = {
  definition: string;
  options: [string, string, string, string, string]; // 0番目が正解
  explanation: string;
};

const QUESTIONS: DictionaryQuestion[] = [
  { definition: "a result or effect of an action or condition", options: ["consequence", "origin", "purpose", "method", "opinion"], explanation: "「consequence」は「結果」という意味です。" },
  { definition: "something that blocks progress or makes it difficult to achieve something", options: ["obstacle", "solution", "advantage", "decision", "instruction"], explanation: "「obstacle」は「障害」という意味です。" },
  { definition: "an agreement in a dispute reached by each side making concessions", options: ["compromise", "argument", "victory", "refusal", "demand"], explanation: "「compromise」は「妥協」という意味です。" },
  { definition: "a stock or supply of something that can be drawn on when needed", options: ["resource", "waste", "debt", "expense", "shortage"], explanation: "「resource」は「資源」という意味です。" },
  { definition: "a plan of action designed to achieve a long-term goal", options: ["strategy", "accident", "habit", "mistake", "routine"], explanation: "「strategy」は「戦略」という意味です。" },
  { definition: "facts or information that indicate whether a belief or proposition is true", options: ["evidence", "opinion", "rumor", "assumption", "guess"], explanation: "「evidence」は「証拠」という意味です。" },
  { definition: "the circumstances that form the setting for an event, statement, or idea", options: ["context", "content", "concept", "consent", "conduct"], explanation: "「context」は「文脈」という意味です。" },
  { definition: "an abstract idea or general notion", options: ["concept", "contact", "context", "consent", "content"], explanation: "「concept」は「概念」という意味です。" },
  { definition: "standards or principles by which something may be judged or decided", options: ["criteria", "opinions", "results", "examples", "categories"], explanation: "「criteria」は「基準」という意味です。" },
  { definition: "a situation in which a difficult choice has to be made between two or more options", options: ["dilemma", "decision", "solution", "conclusion", "agreement"], explanation: "「dilemma」は「ジレンマ」という意味です。" },
  { definition: "a distinctive attribute or aspect of something", options: ["feature", "function", "factor", "fraction", "fixture"], explanation: "「feature」は「特徴」という意味です。" },
  { definition: "the special activity or purpose of a person or thing", options: ["function", "feature", "fashion", "formation", "foundation"], explanation: "「function」は「機能」という意味です。" },
  { definition: "a proposed explanation made on the basis of limited evidence as a starting point for further investigation", options: ["hypothesis", "conclusion", "fact", "law", "proof"], explanation: "「hypothesis」は「仮説」という意味です。" },
  { definition: "a marked effect or influence", options: ["impact", "import", "input", "incident", "instance"], explanation: "「impact」は「影響」という意味です。" },
  { definition: "an innate, typically fixed pattern of behavior in response to certain stimuli", options: ["instinct", "instruction", "institution", "intention", "invention"], explanation: "「instinct」は「本能」という意味です。" },
  { definition: "a reason for doing something", options: ["motive", "emotion", "movement", "motion", "moment"], explanation: "「motive」は「動機」という意味です。" },
  { definition: "the way a thing turns out; a result", options: ["outcome", "income", "overcome", "outset", "output"], explanation: "「outcome」は「結果」という意味です。" },
  { definition: "a particular attitude toward or way of regarding something; a point of view", options: ["perspective", "prospect", "proposal", "position", "possession"], explanation: "「perspective」は「視点」という意味です。" },
  { definition: "a fact or situation that is observed to exist or happen", options: ["phenomenon", "incident", "episode", "occasion", "circumstance"], explanation: "「phenomenon」は「現象」という意味です。" },
  { definition: "a fundamental truth or proposition that serves as the foundation for a system of belief or reasoning", options: ["principle", "principal", "policy", "practice", "premise"], explanation: "「principle」は「原則」という意味です。" },
  { definition: "a thing that is regarded as more important than another", options: ["priority", "property", "proximity", "proportion", "probability"], explanation: "「priority」は「優先事項」という意味です。" },
  { definition: "an established or official way of doing something", options: ["procedure", "progress", "project", "proposal", "prospect"], explanation: "「procedure」は「手順」という意味です。" },
  { definition: "unwillingness or disinclination to do something", options: ["reluctance", "resistance", "refusal", "rejection", "resentment"], explanation: "「reluctance」は「気が進まないこと」という意味です。" },
  { definition: "a particular order in which related events, movements, or things follow each other", options: ["sequence", "consequence", "frequency", "presence", "essence"], explanation: "「sequence」は「連続、順序」という意味です。" },
  { definition: "an inclination to behave or think in a particular way", options: ["tendency", "trend", "attempt", "attitude", "ability"], explanation: "「tendency」は「傾向」という意味です。" },
  { definition: "the process or period of changing from one state or condition to another", options: ["transition", "translation", "transaction", "transmission", "transformation"], explanation: "「transition」は「移行」という意味です。" },
  { definition: "the area near or surrounding a particular place", options: ["vicinity", "visibility", "validity", "variety", "vitality"], explanation: "「vicinity」は「近辺」という意味です。" },
  { definition: "something that is given to help achieve or provide something", options: ["contribution", "distribution", "attribution", "retribution", "institution"], explanation: "「contribution」は「貢献」という意味です。" },
  { definition: "a lack or shortage of something", options: ["deficiency", "efficiency", "sufficiency", "proficiency", "competency"], explanation: "「deficiency」は「不足」という意味です。" },
  { definition: "something, typically money, awarded to someone to make up for loss, injury, or suffering", options: ["compensation", "sensation", "consultation", "reservation", "reputation"], explanation: "「compensation」は「補償」という意味です。" },
];

const CATEGORY = "english";
const SUB_CATEGORY = "英英辞典";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般的な英単語の英英辞典形式定義）。市販教材・書籍からの引用なし。";

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function main() {
  const lines = QUESTIONS.map((q) => {
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === 0 }));
    const shuffled = shuffle(indexed);
    const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
    const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
    const explanationJson = JSON.stringify([q.explanation]);

    return `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('${escapeSql(
      CATEGORY
    )}', '${escapeSql(SUB_CATEGORY)}', NULL, '${escapeSql(q.definition)}', '${escapeSql(
      optionsJson
    )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(ORIGINALITY_NOTE)}');`;
  });

  writeFileSync(new URL("./seed_spi_english_dictionary.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
