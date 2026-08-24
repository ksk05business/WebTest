// SPI3「英語」科目 空欄補充（熟語・イディオム）の問題（第2弾）を生成するスクリプト。
// 元データ: ユーザー提供の SPI_空欄補充問題集2.md（全30問）。
// 元データの解答をすべて手動でイディオムの知識と照合し、誤りがないことを確認済み（今回は修正なし）。
// ただし正解が A,B,C,D,E,A,B,C,D,E...という完全な周期パターンになっており、
// 読まずに順番で解答しても全問正解できてしまう重大な偏りがあったため、
// 選択肢を必ずシャッフルしてから投入する。
// category=english, sub_category=空欄補充 として追加する（第1弾30問に続く追加分。計60問になる）。
// 実行: node scripts/seed-spi-english-fillblank-2.mts
// → scripts/seed_spi_english_fillblank_2.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type FillBlankQuestion = {
  japanese: string;
  english: string; // （　　　）を空欄として含む英文
  options: [string, string, string, string, string]; // 0番目が正解
  explanation: string;
};

const QUESTIONS: FillBlankQuestion[] = [
  { japanese: "彼はその仕事をこなす能力がある。", english: "He is capable （　　　） handling the job.", options: ["of", "for", "to", "with", "in"], explanation: "「be capable of doing」で「〜する能力がある」という意味です。" },
  { japanese: "彼女は遅刻したことを謝った。", english: "She apologized （　　　） being late.", options: ["for", "to", "on", "about", "with"], explanation: "「apologize for 〜」で「〜について謝る」という意味です。" },
  { japanese: "彼は自分のやり方でやることを主張した。", english: "He insisted （　　　） doing it his own way.", options: ["on", "to", "for", "in", "at"], explanation: "「insist on 〜」で「〜を主張する」という意味です。" },
  { japanese: "委員会は10人のメンバーから成る。", english: "The committee consists （　　　） ten members.", options: ["of", "in", "for", "with", "to"], explanation: "「consist of 〜」で「〜から成る」という意味です。" },
  { japanese: "その事故は交通渋滞を引き起こした。", english: "The accident resulted （　　　） a traffic jam.", options: ["in", "to", "for", "with", "on"], explanation: "「result in 〜」で「〜という結果になる」という意味です。" },
  { japanese: "運動不足は健康問題につながることがある。", english: "Lack of exercise can lead （　　　） health problems.", options: ["to", "for", "with", "on", "in"], explanation: "「lead to 〜」で「〜につながる」という意味です。" },
  { japanese: "彼の研究は医学の進歩に貢献した。", english: "His research contributed （　　　） the advancement of medicine.", options: ["to", "for", "with", "on", "in"], explanation: "「contribute to 〜」で「〜に貢献する」という意味です。" },
  { japanese: "会社は彼の損失を補償した。", english: "The company compensated （　　　） his loss.", options: ["for", "to", "with", "on", "in"], explanation: "「compensate for 〜」で「〜を補償する、埋め合わせる」という意味です。" },
  { japanese: "多くの学生がそのイベントに参加した。", english: "Many students participated （　　　） the event.", options: ["in", "on", "with", "to", "for"], explanation: "「participate in 〜」で「〜に参加する」という意味です。" },
  { japanese: "住民たちはその計画に反対した。", english: "The residents objected （　　　） the plan.", options: ["to", "for", "with", "on", "in"], explanation: "「object to 〜」で「〜に反対する」という意味です。" },
  { japanese: "このグラフは昨年の売上を指している。", english: "This graph refers （　　　） last year's sales.", options: ["to", "with", "on", "for", "in"], explanation: "「refer to 〜」で「〜を指す、言及する」という意味です。" },
  { japanese: "私たちはあなたの経験に頼っている。", english: "We rely （　　　） your experience.", options: ["on", "in", "to", "for", "with"], explanation: "「rely on 〜」で「〜に頼る」という意味です。" },
  { japanese: "彼女は自分の研究に集中することにした。", english: "She decided to focus （　　　） her research.", options: ["on", "to", "in", "for", "with"], explanation: "「focus on 〜」で「〜に集中する」という意味です。" },
  { japanese: "この医師は心臓外科を専門としている。", english: "This doctor specializes （　　　） heart surgery.", options: ["in", "on", "with", "for", "to"], explanation: "「specialize in 〜」で「〜を専門とする」という意味です。" },
  { japanese: "彼はついにその試験に合格することに成功した。", english: "He finally succeeded （　　　） passing the exam.", options: ["in", "on", "with", "for", "to"], explanation: "「succeed in doing」で「〜することに成功する」という意味です。" },
  { japanese: "彼らはその議論に積極的に加わった。", english: "They actively engaged （　　　） the discussion.", options: ["in", "on", "with", "to", "for"], explanation: "「engage in 〜」で「〜に従事する、参加する」という意味です。" },
  { japanese: "騒音が彼の集中を妨げた。", english: "The noise interfered （　　　） his concentration.", options: ["with", "in", "on", "to", "for"], explanation: "「interfere with 〜」で「〜を妨げる」という意味です。" },
  { japanese: "彼女はストレスにうまく対処している。", english: "She copes （　　　） stress very well.", options: ["with", "on", "for", "to", "in"], explanation: "「cope with 〜」で「〜に対処する」という意味です。" },
  { japanese: "すべての従業員は安全規則に従わなければならない。", english: "All employees must comply （　　　） the safety regulations.", options: ["with", "to", "on", "for", "in"], explanation: "「comply with 〜」で「〜に従う」という意味です。" },
  { japanese: "動物は新しい環境に適応しなければならない。", english: "Animals must adapt （　　　） new environments.", options: ["to", "with", "for", "on", "in"], explanation: "「adapt to 〜」で「〜に適応する」という意味です。" },
  { japanese: "彼女はその仕事に応募することにした。", english: "She decided to apply （　　　） the job.", options: ["for", "to", "with", "on", "in"], explanation: "「apply for 〜」で「〜に応募する」という意味です。" },
  { japanese: "この要因が売上減少の理由を説明している。", english: "This factor accounts （　　　） the drop in sales.", options: ["for", "to", "with", "on", "in"], explanation: "「account for 〜」で「〜の理由を説明する」という意味です。" },
  { japanese: "そのレストランは様々な好みに応えている。", english: "The restaurant caters （　　　） various tastes.", options: ["to", "for", "with", "on", "in"], explanation: "「cater to 〜」で「〜の要求に応える」という意味です。" },
  { japanese: "彼の意見は私の意見と異なる。", english: "His opinion differs （　　　） mine.", options: ["from", "to", "with", "by", "in"], explanation: "「differ from 〜」で「〜と異なる」という意味です。" },
  { japanese: "学生たちはその新しいプログラムから恩恵を受けた。", english: "The students benefited （　　　） the new program.", options: ["from", "by", "with", "to", "in"], explanation: "「benefit from 〜」で「〜から利益を得る」という意味です。" },
  { japanese: "多くの人々がその病気に苦しんでいる。", english: "Many people suffer （　　　） the disease.", options: ["from", "by", "with", "to", "in"], explanation: "「suffer from 〜」で「〜に苦しむ」という意味です。" },
  { japanese: "彼は病気からゆっくり回復している。", english: "He is slowly recovering （　　　） his illness.", options: ["from", "by", "with", "to", "in"], explanation: "「recover from 〜」で「〜から回復する」という意味です。" },
  { japanese: "彼女は去年大学を卒業した。", english: "She graduated （　　　） college last year.", options: ["from", "by", "with", "to", "in"], explanation: "「graduate from 〜」で「〜を卒業する」という意味です。" },
  { japanese: "その単語はラテン語に由来する。", english: "The word derives （　　　） Latin.", options: ["from", "by", "with", "to", "in"], explanation: "「derive from 〜」で「〜に由来する」という意味です。" },
  { japanese: "会議中は電話の使用を控えてください。", english: "Please refrain （　　　） using your phone during the meeting.", options: ["from", "by", "with", "to", "in"], explanation: "「refrain from doing」で「〜することを控える」という意味です。" },
];

const CATEGORY = "english";
const SUB_CATEGORY = "空欄補充";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般的な英熟語・イディオムの空欄補充）。市販教材・書籍からの引用なし。";

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
    const questionText = `${q.japanese}\n${q.english}`;
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === 0 }));
    const shuffled = shuffle(indexed);
    const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
    const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
    const explanationJson = JSON.stringify([q.explanation]);

    return `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('${escapeSql(
      CATEGORY
    )}', '${escapeSql(SUB_CATEGORY)}', NULL, '${escapeSql(questionText)}', '${escapeSql(
      optionsJson
    )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(ORIGINALITY_NOTE)}');`;
  });

  writeFileSync(new URL("./seed_spi_english_fillblank_2.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
