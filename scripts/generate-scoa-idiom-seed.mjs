// SCOA「熟語・ことわざ・慣用句・故事成語」単元の問題データ（ユーザー提供のMarkdown）をパースし、
// questionsテーブルへのINSERT文（scoa_idiom_seed.sql）を生成する一度きりの投入スクリプト。
import fs from "node:fs";

const SRC = "C:/Users/Keisuke Fukui/Downloads/SCOA練習問題_四字熟語ことわざ慣用句故事成語.md";
const OUT = "scoa_idiom_seed.sql";

const text = fs.readFileSync(SRC, "utf8");

const PROMPTS = {
  1: "次の四字熟語の意味として最も適切なものを選びなさい。",
  2: "次に示すことわざの意味として、正しいものを選びなさい。",
  3: "次の慣用句の意味として、正しいものを選びなさい。",
  4: "次の故事成語の意味として、正しいものを選びなさい。",
};

// 問題本文の抽出（第1〜4章、問1〜40）
const questionBlocks = [...text.matchAll(/\*\*問(\d+)\.\*\* 次の?[^\n]*\n\*\*([^\n*]+)\*\*\n([\s\S]*?)(?=\n\*\*問\d+\.|\n---)/g)];

const questions = questionBlocks.map((m) => {
  const num = Number(m[1]);
  const term = m[2].trim();
  const choicesRaw = m[3].trim();
  const choices = [...choicesRaw.matchAll(/^\d+\.\s*(.+)$/gm)].map((c) => c[1].trim());
  const chapter = num <= 10 ? 1 : num <= 20 ? 2 : num <= 30 ? 3 : 4;
  return { num, term, choices, prompt: PROMPTS[chapter] };
});

// 解答・解説の抽出
const answerBlocks = [...text.matchAll(/\*\*問(\d+)\. 正解:(\d+)\*\*\n([^\n]+)/g)];
const answerMap = new Map(
  answerBlocks.map((m) => [Number(m[1]), { correctAnswer: Number(m[2]) - 1, explanation: m[3].trim() }])
);

if (questions.length !== 40) {
  throw new Error(`想定外の問題数: ${questions.length}件（40件のはず）`);
}
if (answerMap.size !== 40) {
  throw new Error(`想定外の解答数: ${answerMap.size}件（40件のはず）`);
}

function escapeSql(s) {
  return s.replace(/'/g, "''");
}

const lines = questions.map((q) => {
  const a = answerMap.get(q.num);
  if (!a) throw new Error(`問${q.num}の解答が見つかりません`);
  if (q.choices.length !== 5) throw new Error(`問${q.num}の選択肢数が5件ではありません: ${q.choices.length}`);
  const questionText = `${q.prompt}\n\n${q.term}`;
  const options = JSON.stringify(q.choices);
  const explanation = JSON.stringify([a.explanation]);
  return `INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('scoa_language', '熟語・ことわざ・慣用句・故事成語', NULL, '${escapeSql(
    questionText
  )}', NULL, '${escapeSql(options)}', ${a.correctAnswer}, '${escapeSql(explanation)}', 3, 'published', 'ユーザー提供のオリジナル問題（SCOA言語分野: 四字熟語・ことわざ・慣用句・故事成語）');`;
});

fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`生成完了: ${OUT}（${lines.length}件）`);
