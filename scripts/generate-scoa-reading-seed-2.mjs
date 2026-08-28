// SCOA「長文読解」単元向けの接続詞穴埋め問題・第2弾（ユーザー提供のMarkdown、文章5本×設問2問=10問）をパースし、
// questionsテーブルへのINSERT文（scoa_reading_seed_2.sql）を生成する一度きりの投入スクリプト。
// passage_group_id は本番DBで既に1〜75番まで使用済み（玉手箱GAB長文・SCOA長文読解第1弾）のため76番から採番する。
import fs from "node:fs";

const SRC = "C:/Users/Keisuke Fukui/Downloads/SCOA練習問題_長文読解接続詞穴埋め2.md";
const OUT = "scoa_reading_seed_2.sql";
const FIRST_GROUP_ID = 76;

const TITLES = [
  "本格カレー作りへの挑戦",
  "知らない町での新生活",
  "朝のランニング習慣",
  "実家で見つけた古いアルバム",
  "初めてのオンライン読書会",
];

const text = fs.readFileSync(SRC, "utf8");

const passageBlocks = [...text.matchAll(/## 文章(\d+)\n\n([\s\S]*?)\n\n\*\*【設問1】\*\* ([^\n]+)\n(A\.[^\n]+)\n\n\*\*【設問2】\*\* ([^\n]+)\n(A\.[^\n]+)/g)];

if (passageBlocks.length !== 5) {
  throw new Error(`想定外の文章数: ${passageBlocks.length}件（5件のはず）`);
}

function parseChoices(line) {
  const parts = line.split("　　").map((p) => p.trim());
  return parts.map((p) => {
    const m = p.match(/^([A-D])\.\s*(.+)$/);
    if (!m) throw new Error(`選択肢のパースに失敗: ${p}`);
    return m[2].trim();
  });
}

const answerSection = text.slice(text.indexOf("# 解答・解説"));
const answerPassageBlocks = [...answerSection.matchAll(/## 文章(\d+)\n\n\*\*設問1\. 正解:([A-D])\*\*\n([^\n]+)\n\n\*\*設問2\. 正解:([A-D])\*\*\n([^\n]+)/g)];

if (answerPassageBlocks.length !== 5) {
  throw new Error(`想定外の解答文章数: ${answerPassageBlocks.length}件（5件のはず）`);
}

const answerMap = new Map(
  answerPassageBlocks.map((m) => [
    Number(m[1]),
    {
      q1: { correctLabel: m[2], explanation: m[3].trim() },
      q2: { correctLabel: m[4], explanation: m[5].trim() },
    },
  ])
);

const LABEL_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function escapeSql(s) {
  return s.replace(/'/g, "''");
}

const rows = [];
passageBlocks.forEach((m) => {
  const num = Number(m[1]);
  const passage = m[2].trim();
  const q1Prompt = m[3].trim();
  const q1Choices = parseChoices(m[4]);
  const q2Prompt = m[5].trim();
  const q2Choices = parseChoices(m[6]);
  const ans = answerMap.get(num);
  if (!ans) throw new Error(`文章${num}の解答が見つかりません`);

  const groupId = FIRST_GROUP_ID + num - 1;
  const title = TITLES[num - 1];

  rows.push({
    title,
    questionText: `${passage}\n\n【設問1】${q1Prompt}`,
    options: q1Choices,
    correctAnswer: LABEL_INDEX[ans.q1.correctLabel],
    explanation: ans.q1.explanation,
    groupId,
  });
  rows.push({
    title,
    questionText: `${passage}\n\n【設問2】${q2Prompt}`,
    options: q2Choices,
    correctAnswer: LABEL_INDEX[ans.q2.correctLabel],
    explanation: ans.q2.explanation,
    groupId,
  });
});

if (rows.length !== 10) {
  throw new Error(`想定外の生成件数: ${rows.length}件（10件のはず）`);
}

const lines = rows.map((r) => {
  const options = JSON.stringify(r.options);
  const explanation = JSON.stringify([r.explanation]);
  return `INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id) VALUES ('scoa_language', '長文読解', '${escapeSql(
    r.title
  )}', '${escapeSql(r.questionText)}', NULL, '${escapeSql(options)}', ${r.correctAnswer}, '${escapeSql(
    explanation
  )}', 3, 'published', 'ユーザー提供のオリジナル問題（SCOA言語分野: 長文読解・接続詞穴埋め第2弾）', ${r.groupId});`;
});

fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`生成完了: ${OUT}（${lines.length}件、passage_group_id ${FIRST_GROUP_ID}〜${FIRST_GROUP_ID + 4}）`);
