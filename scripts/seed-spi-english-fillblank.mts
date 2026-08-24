// SPI3「英語」科目 空欄補充（熟語・イディオム）の問題を生成するスクリプト。
// 元データ: ユーザー提供の SPI_空欄補充問題集.md（全30問）。
// 元データの解答をすべて手動でイディオムの知識と照合し、誤りがないことを確認済み（今回は修正なし）。
// 正解の分布は元データの時点で比較的均等だった（A:5,B:7,C:7,D:6,E:5）が、
// 他の単元と同様の方針としてスクリプト側で選択肢をシャッフルする。
// category=english, sub_category=空欄補充 として挿入する（既存の practiceUnits.ts の
// SPI「英語（能力）」グループに定義済みの単元）。
// 実行: node scripts/seed-spi-english-fillblank.mts
// → scripts/seed_spi_english_fillblank.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type FillBlankQuestion = {
  japanese: string;
  english: string; // （　　　）を空欄として含む英文
  options: [string, string, string, string, string]; // 0番目が正解
  explanation: string;
};

const QUESTIONS: FillBlankQuestion[] = [
  { japanese: "私はもうすぐあなたに会えるのを楽しみにしています。", english: "I am looking forward （　　　） seeing you soon.", options: ["to", "for", "on", "in", "at"], explanation: "「look forward to doing」で「〜するのを楽しみにする」という意味です。" },
  { japanese: "彼は新しい同僚ととてもうまくやっている。", english: "He gets along （　　　） his new coworkers very well.", options: ["with", "on", "to", "for", "by"], explanation: "「get along with 人」で「（人）とうまくやっていく」という意味です。" },
  { japanese: "彼女はその割引を利用することにした。", english: "She decided to take advantage （　　　） the discount.", options: ["of", "in", "on", "for", "at"], explanation: "「take advantage of 〜」で「〜を利用する」という意味です。" },
  { japanese: "彼の失礼な態度にはもう我慢できない。", english: "I can't put （　　　） with his rude behavior anymore.", options: ["up", "down", "on", "through", "over"], explanation: "「put up with 〜」で「〜を我慢する」という意味です。" },
  { japanese: "彼はすばらしいアイデアを思いつくことができた。", english: "He managed to come （　　　） with a brilliant idea.", options: ["up", "out", "in", "down", "through"], explanation: "「come up with 〜」で「〜を思いつく」という意味です。" },
  { japanese: "彼は失った時間を埋め合わせるために残業した。", english: "He worked overtime to make （　　　） for the lost time.", options: ["up", "out", "over", "in", "through"], explanation: "「make up for 〜」で「〜の埋め合わせをする」という意味です。" },
  { japanese: "牛乳を切らしてしまったので、買わなければならない。", english: "We have run （　　　） of milk, so I need to buy some.", options: ["out", "off", "up", "over", "down"], explanation: "「run out of 〜」で「〜を使い果たす、切らす」という意味です。" },
  { japanese: "ピクニックに行くかどうかは天気次第だ。", english: "Whether we go on a picnic depends （　　　） the weather.", options: ["on", "to", "for", "with", "in"], explanation: "「depend on 〜」で「〜次第である、〜に頼る」という意味です。" },
  { japanese: "彼女はそのとき危険に気づいていなかった。", english: "She was not aware （　　　） the danger at that time.", options: ["of", "for", "with", "to", "at"], explanation: "「be aware of 〜」で「〜に気づいている」という意味です。" },
  { japanese: "スミス氏は営業部門を担当している。", english: "Mr. Smith is in charge （　　　） the sales department.", options: ["of", "for", "with", "on", "at"], explanation: "「be in charge of 〜」で「〜を担当している」という意味です。" },
  { japanese: "チームを代表して一言申し上げたいと思います。", english: "I would like to say a few words （　　　） behalf of the team.", options: ["on", "in", "by", "for", "at"], explanation: "「on behalf of 〜」で「〜を代表して」という意味です。" },
  { japanese: "彼はプレッシャーの下で働くことに慣れている。", english: "He is accustomed （　　　） working under pressure.", options: ["to", "with", "for", "at", "on"], explanation: "「be accustomed to doing」で「〜することに慣れている」という意味です。" },
  { japanese: "私が留守の間、犬の世話をしてもらえますか。", english: "Could you take care （　　　） my dog while I'm away?", options: ["of", "for", "with", "on", "about"], explanation: "「take care of 〜」で「〜の世話をする」という意味です。" },
  { japanese: "そのマネージャーはオフィスで下されるすべての決定に責任がある。", english: "The manager is responsible （　　　） all the decisions made in the office.", options: ["for", "of", "to", "with", "on"], explanation: "「be responsible for 〜」で「〜に責任がある」という意味です。" },
  { japanese: "あなたはいつでも私を頼りにしていい。", english: "You can always count （　　　） me for support.", options: ["on", "for", "to", "with", "at"], explanation: "「count on 〜」で「〜を頼りにする」という意味です。" },
  { japanese: "この問題にどう対処すればいいのかわからない。", english: "I don't know how to deal （　　　） this problem.", options: ["with", "on", "to", "for", "in"], explanation: "「deal with 〜」で「〜に対処する」という意味です。" },
  { japanese: "この町は美しい景色で知られている。", english: "This town is known （　　　） its beautiful scenery.", options: ["for", "with", "as", "to", "by"], explanation: "「be known for 〜」で「〜で知られている」という意味です。" },
  { japanese: "その車は昨夜、高速道路で故障した。", english: "The car broke （　　　） on the highway last night.", options: ["down", "up", "off", "out", "over"], explanation: "「break down」で「（機械などが）故障する」という意味です。" },
  { japanese: "その会議は悪天候のため中止になった。", english: "The meeting was called （　　　） due to bad weather.", options: ["off", "up", "down", "out", "in"], explanation: "「call off 〜」で「〜を中止する」という意味です。" },
  { japanese: "その会社は来月そのプロジェクトを実行する予定だ。", english: "The company plans to carry （　　　） the project next month.", options: ["out", "on", "up", "off", "through"], explanation: "「carry out 〜」で「〜を実行する」という意味です。" },
  { japanese: "その新しい政策は大きな変化をもたらした。", english: "The new policy brought （　　　） significant changes.", options: ["about", "up", "on", "out", "over"], explanation: "「bring about 〜」で「〜をもたらす」という意味です。" },
  { japanese: "この機械の使い方がどうしても理解できない。", english: "I can't figure （　　　） how to use this machine.", options: ["out", "up", "on", "in", "off"], explanation: "「figure out 〜」で「〜を理解する、解明する」という意味です。" },
  { japanese: "最新技術についていくのは大変だ。", english: "It's hard to keep （　　　） with the latest technology.", options: ["up", "on", "in", "along", "through"], explanation: "「keep up with 〜」で「〜についていく」という意味です。" },
  { japanese: "多くの若い選手たちが彼をお手本として尊敬している。", english: "Many young players look （　　　） to him as a role model.", options: ["up", "on", "out", "down", "over"], explanation: "「look up to 〜」で「〜を尊敬する」という意味です。" },
  { japanese: "その旅行は嵐のため延期された。", english: "The trip was put （　　　） because of the storm.", options: ["off", "down", "up", "out", "on"], explanation: "「put off 〜」で「〜を延期する」という意味です。" },
  { japanese: "緊急時に備えていくらかお金を取っておくべきだ。", english: "You should set （　　　） some money for emergencies.", options: ["aside", "apart", "away", "off", "down"], explanation: "「set aside 〜」で「〜を取っておく」という意味です。" },
  { japanese: "今日の午後は雨が降りそうだ。", english: "It is likely （　　　） rain this afternoon.", options: ["to", "for", "that", "of", "at"], explanation: "「be likely to do」で「〜しそうである」という意味です。" },
  { japanese: "彼女は困っている人なら誰でも喜んで助ける。", english: "She is willing （　　　） help anyone in need.", options: ["to", "for", "with", "at", "in"], explanation: "「be willing to do」で「喜んで〜する」という意味です。" },
  { japanese: "その研究室は最新の機器を備えている。", english: "The laboratory is equipped （　　　） the latest instruments.", options: ["with", "of", "by", "for", "in"], explanation: "「be equipped with 〜」で「〜を備えている」という意味です。" },
  { japanese: "政府は二酸化炭素排出量の削減に取り組んでいる。", english: "The government is committed （　　　） reducing carbon emissions.", options: ["to", "for", "with", "at", "on"], explanation: "「be committed to doing」で「〜に取り組んでいる、専念している」という意味です。" },
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

  writeFileSync(new URL("./seed_spi_english_fillblank.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
