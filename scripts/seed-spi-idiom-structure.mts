// SPI3「言語」科目 熟語の成り立ちの問題を生成するスクリプト。
// 元データ: ユーザー提供の spi_jukugo_30mon.md（全30問、解答・解説付き）。
// 全30問で共通の5択（A:主語述語の関係／B:動詞+目的語／C:似た意味の漢字を重ねる／
// D:反対の意味の漢字を重ねる／E:修飾関係）から熟語の成り立ちを選ぶ形式。
// 元データは正解が「問1〜6=A、問7〜12=B、問13〜18=C、問19〜24=D、問25〜30=E」という
// 完全な連続ブロックパターンになっており、内容を読まずに答えられてしまう重大な偏りが
// あったため、出題時の偏りを避けるためスクリプト側で選択肢をシャッフルする
// （5つの選択肢の文言自体は全問共通のため、シャッフルしても意味は変わらない）。
// category=verbal, sub_category=熟語の成り立ち として追加する（新規、実データ0件だった単元）。
// 実行: node scripts/seed-spi-idiom-structure.mts
// → scripts/seed_spi_idiom_structure.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type IdiomQuestion = {
  word: string;
  correctIndex: number; // 共通選択肢内でのインデックス（0=A,1=B,2=C,3=D,4=E）
  explanation: string;
};

// 全問共通の5択
const COMMON_OPTIONS = [
  "主語と述語の関係である。",
  "動詞の後に目的語を置く。",
  "似た意味を持つ漢字を重ねる。",
  "反対の意味を持つ漢字を重ねる。",
  "前の漢字が後の漢字を修飾する。",
];

const QUESTIONS: IdiomQuestion[] = [
  { word: "国営", correctIndex: 0, explanation: "「国が営む」と読むことができ、「国」が主語、「営」が述語の関係になっています。「市営」「県立」なども同じ成り立ちです。" },
  { word: "日照", correctIndex: 0, explanation: "「日が照る」と読むことができ、「日」が主語、「照」が述語の関係になっています。" },
  { word: "骨折", correctIndex: 0, explanation: "「骨が折れる」と読むことができ、「骨」が主語、「折」が述語の関係になっています。「骨を折る」（動詞+目的語）と誤読しやすいですが、日常的には「骨が折れる」という自動詞的な意味で使われるため主語述語の関係が適切です。" },
  { word: "頭痛", correctIndex: 0, explanation: "「頭が痛い」と読むことができ、「頭」が主語、「痛」が述語（状態）の関係になっています。" },
  { word: "年少", correctIndex: 0, explanation: "「年が少ない」と読むことができ、「年」が主語、「少」が述語（状態）の関係になっています。" },
  { word: "地震", correctIndex: 0, explanation: "「地が震う（ふるう）」と読むことができ、「地」が主語、「震」が述語の関係になっています。" },
  { word: "読書", correctIndex: 1, explanation: "「書を読む」と読むことができ、動詞「読（む）」が目的語「書」の後に置かれています。" },
  { word: "登山", correctIndex: 1, explanation: "「山に登る」と読むことができ、動詞「登（る）」の対象「山」が後に置かれています。" },
  { word: "開会", correctIndex: 1, explanation: "「会を開く」と読むことができ、動詞「開（く）」が目的語「会」の後に置かれています。" },
  { word: "避難", correctIndex: 1, explanation: "「難を避ける」と読むことができ、動詞「避（ける）」が目的語「難」の後に置かれています。" },
  { word: "脱帽", correctIndex: 1, explanation: "「帽（子）を脱ぐ」と読むことができ、動詞「脱（ぐ）」が目的語「帽」の後に置かれています。" },
  { word: "就職", correctIndex: 1, explanation: "「職に就く」と読むことができ、動詞「就（く）」の対象「職」が後に置かれています。" },
  { word: "思考", correctIndex: 2, explanation: "「思（う）」も「考（える）」も、どちらも「頭で考えをめぐらせる」という似た意味を持つ漢字を重ねてできています。" },
  { word: "道路", correctIndex: 2, explanation: "「道」も「路」も、どちらも「みち」という似た意味を持つ漢字を重ねてできています。" },
  { word: "樹木", correctIndex: 2, explanation: "「樹」も「木」も、どちらも「き」という似た意味を持つ漢字を重ねてできています。" },
  { word: "豊富", correctIndex: 2, explanation: "「豊（か）」も「富（む）」も、どちらも「満ち足りている」という似た意味を持つ漢字を重ねてできています。" },
  { word: "根本", correctIndex: 2, explanation: "「根」も「本（もと）」も、どちらも「物事のおおもと」という似た意味を持つ漢字を重ねてできています。「根の本（もと）」と修飾関係に誤読しやすい問題です。" },
  { word: "単純", correctIndex: 2, explanation: "「単（ひとつであること）」も「純（まじりけがないこと）」も、どちらも「複雑でない」という似た意味を持つ漢字を重ねてできています。" },
  { word: "売買", correctIndex: 3, explanation: "「売る」と「買う」という、反対の意味を持つ漢字を重ねてできています。" },
  { word: "往復", correctIndex: 3, explanation: "「往（く）」と「復（かえる）」という、反対の意味を持つ漢字を重ねてできています。" },
  { word: "開閉", correctIndex: 3, explanation: "「開く」と「閉じる」という、反対の意味を持つ漢字を重ねてできています。" },
  { word: "需給", correctIndex: 3, explanation: "「需要」と「供給」という、反対（対）の意味を持つ漢字を重ねてできています。" },
  { word: "昇降", correctIndex: 3, explanation: "「昇る」と「降りる」という、反対の意味を持つ漢字を重ねてできています。" },
  { word: "伸縮", correctIndex: 3, explanation: "「伸びる」と「縮む」という、反対の意味を持つ漢字を重ねてできています。" },
  { word: "美人", correctIndex: 4, explanation: "「美しい人」と読むことができ、前の漢字「美」が後の漢字「人」を修飾しています。" },
  { word: "猛暑", correctIndex: 4, explanation: "「猛烈な暑さ」と読むことができ、前の漢字「猛」が後の漢字「暑」を修飾しています。" },
  { word: "新居", correctIndex: 4, explanation: "「新しい住居」と読むことができ、前の漢字「新」が後の漢字「居」を修飾しています。" },
  { word: "弱点", correctIndex: 4, explanation: "「弱い点」と読むことができ、前の漢字「弱」が後の漢字「点」を修飾しています。" },
  { word: "悪臭", correctIndex: 4, explanation: "「悪い臭い」と読むことができ、前の漢字「悪」が後の漢字「臭」を修飾しています。" },
  { word: "急行", correctIndex: 4, explanation: "「急いで行く」と読むことができ、前の漢字「急」が後の漢字「行」の様子・程度を修飾しています。「急を行う」（動詞+目的語）と誤読しやすい問題です。" },
];

const CATEGORY = "verbal";
const SUB_CATEGORY = "熟語の成り立ち";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般知識ベースの創作文）。市販教材・書籍からの引用なし。";

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
    const questionText = `次の熟語の成り立ちとして最も適切なものを選びなさい。\n\n${q.word}`;
    const indexed = COMMON_OPTIONS.map((text, i) => ({ text, isCorrect: i === q.correctIndex }));
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

  writeFileSync(new URL("./seed_spi_idiom_structure.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
