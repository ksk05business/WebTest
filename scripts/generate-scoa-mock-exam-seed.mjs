// SCOA本番模試（新設のtest?part=scoaパート）向けオリジナル問題120問
// （熟語・慣用句・四字熟語・故事成語 各20問 + 長文読解・接続詞穴埋め40問(20文章×2問)）を
// ユーザー提供のMarkdownからパースし、questionsテーブルへのINSERT文（scoa_mock_exam_seed.sql）を生成する
// 一度きりの投入スクリプト。
// 熟語・慣用句・四字熟語・故事成語は既存の練習問題単元と同じ sub_category
// （'熟語・ことわざ・慣用句・故事成語'）に統合し、長文読解も既存単元（'長文読解'）に追加する
// （模試と練習問題は同じ questions プールを共有する設計のため、SPIの英語/構造把握パートと同様）。
// passage_group_id は本番DBで既に1〜80番まで使用済み（玉手箱GAB長文・SCOA長文読解第1・2弾）のため
// 81番から採番する。
import fs from "node:fs";

const SRC = "C:/Users/Keisuke Fukui/Downloads/SCOA模試_言語問題.md";
const OUT = "scoa_mock_exam_seed.sql";
const FIRST_GROUP_ID = 81;

const IDIOM_SUB_CATEGORY = "熟語・ことわざ・慣用句・故事成語";
const READING_SUB_CATEGORY = "長文読解";

const PROMPTS = {
  1: "次の熟語の意味として最も適切なものを選びなさい。",
  2: "次の慣用句の意味として、正しいものを選びなさい。",
  3: "次の四字熟語の意味として最も適切なものを選びなさい。",
  4: "次の故事成語の意味として、正しいものを選びなさい。",
};

function sectionOf(num) {
  if (num <= 20) return 1;
  if (num <= 40) return 2;
  if (num <= 60) return 3;
  return 4;
}

const READING_TITLES = [
  "陶芸教室での挑戦",
  "自転車通勤への切り替え",
  "祖父の形見の腕時計",
  "フルマラソン挑戦",
  "行きつけのカフェ",
  "語学アプリでの継続学習",
  "ベランダでのハーブ栽培",
  "古本屋巡り",
  "公園清掃ボランティア",
  "初めての一人暮らし",
  "友人への手紙",
  "初めての登山",
  "カメラでの風景撮影",
  "出張先の朝市",
  "クローゼットの整理",
  "オンライン英会話",
  "近所の神社の四季",
  "手作りパン",
  "図書館の本整理ボランティア",
  "小学生の頃の将来の夢",
];

const text = fs.readFileSync(SRC, "utf8");
const readingSectionStart = text.indexOf("# 第5部 長文読解");
const idiomSectionText = text.slice(0, readingSectionStart);
const readingSectionText = text.slice(readingSectionStart, text.indexOf("# 解答・解説"));
const answerSectionText = text.slice(text.indexOf("# 解答・解説"));

function escapeSql(s) {
  return s.replace(/'/g, "''");
}

// --- 第1〜4部: 熟語・慣用句・四字熟語・故事成語（問1〜80、5択） ---
const idiomBlocks = [
  ...idiomSectionText.matchAll(
    /\*\*問(\d+)\.\*\* 次の?[^\n]*\n\*\*([^\n*]+)\*\*\n([\s\S]*?)(?=\n\*\*問\d+\.|\n---)/g
  ),
];
const idiomQuestions = idiomBlocks.map((m) => {
  const num = Number(m[1]);
  const term = m[2].trim();
  const choices = [...m[3].matchAll(/^\d+\.\s*(.+)$/gm)].map((c) => c[1].trim());
  return { num, term, choices, prompt: PROMPTS[sectionOf(num)] };
});
if (idiomQuestions.length !== 80) {
  throw new Error(`想定外の熟語系問題数: ${idiomQuestions.length}件（80件のはず）`);
}

const idiomAnswerMap = new Map(
  [...answerSectionText.matchAll(/\*\*問(\d+)\. 正解:(\d)\*\*\s*(.+)/g)].map((m) => [
    Number(m[1]),
    { correctAnswer: Number(m[2]) - 1, explanation: m[3].trim() },
  ])
);
if (idiomAnswerMap.size !== 80) {
  throw new Error(`想定外の熟語系解答数: ${idiomAnswerMap.size}件（80件のはず）`);
}

const idiomRows = idiomQuestions.map((q) => {
  const a = idiomAnswerMap.get(q.num);
  if (!a) throw new Error(`問${q.num}の解答が見つかりません`);
  if (q.choices.length !== 5) throw new Error(`問${q.num}の選択肢数が5件ではありません: ${q.choices.length}`);
  const questionText = `${q.prompt}\n\n${q.term}`;
  return `INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('scoa_language', '${IDIOM_SUB_CATEGORY}', NULL, '${escapeSql(
    questionText
  )}', NULL, '${escapeSql(JSON.stringify(q.choices))}', ${a.correctAnswer}, '${escapeSql(
    JSON.stringify([a.explanation])
  )}', 3, 'published', 'ユーザー提供のオリジナル問題（SCOA模試: 熟語・慣用句・四字熟語・故事成語）');`;
});

// --- 第5部: 長文読解・接続詞穴埋め（問81〜120、20文章×2問、4択） ---
const passageBlocks = [
  ...readingSectionText.matchAll(
    /## 文章(\d+)\n\n([\s\S]*?)\n\n\*\*【問(\d+)】\*\* ([^\n]+)\n(A\.[^\n]+)\n\n\*\*【問(\d+)】\*\* ([^\n]+)\n(A\.[^\n]+)/g
  ),
];
if (passageBlocks.length !== 20) {
  throw new Error(`想定外の文章数: ${passageBlocks.length}件（20件のはず）`);
}

function parseChoices(line) {
  return line
    .split("　　")
    .map((p) => p.trim())
    .map((p) => {
      const m = p.match(/^([A-D])\.\s*(.+)$/);
      if (!m) throw new Error(`選択肢のパースに失敗: ${p}`);
      return m[2].trim();
    });
}

const readingAnswerMap = new Map(
  [...answerSectionText.matchAll(/\*\*問(\d+)\. 正解:([A-D])\*\*\s*(.+)/g)].map((m) => [
    Number(m[1]),
    { correctLabel: m[2], explanation: m[3].trim() },
  ])
);
if (readingAnswerMap.size !== 40) {
  throw new Error(`想定外の長文読解解答数: ${readingAnswerMap.size}件（40件のはず）`);
}

const LABEL_INDEX = { A: 0, B: 1, C: 2, D: 3 };
const readingRows = [];
passageBlocks.forEach((m) => {
  const passageNum = Number(m[1]);
  const passage = m[2].trim();
  const q1Num = Number(m[3]);
  const q1Prompt = m[4].trim();
  const q1Choices = parseChoices(m[5]);
  const q2Num = Number(m[6]);
  const q2Prompt = m[7].trim();
  const q2Choices = parseChoices(m[8]);
  const a1 = readingAnswerMap.get(q1Num);
  const a2 = readingAnswerMap.get(q2Num);
  if (!a1 || !a2) throw new Error(`文章${passageNum}（問${q1Num}/${q2Num}）の解答が見つかりません`);

  const groupId = FIRST_GROUP_ID + passageNum - 1;
  const title = READING_TITLES[passageNum - 1];

  [
    { prompt: q1Prompt, choices: q1Choices, ans: a1, qLabel: "問1" },
    { prompt: q2Prompt, choices: q2Choices, ans: a2, qLabel: "問2" },
  ].forEach(({ prompt, choices, ans }) => {
    const questionText = `${passage}\n\n${prompt}`;
    readingRows.push(
      `INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id) VALUES ('scoa_language', '${READING_SUB_CATEGORY}', '${escapeSql(
        title
      )}', '${escapeSql(questionText)}', NULL, '${escapeSql(JSON.stringify(choices))}', ${LABEL_INDEX[
        ans.correctLabel
      ]}, '${escapeSql(JSON.stringify([ans.explanation]))}', 3, 'published', 'ユーザー提供のオリジナル問題（SCOA模試: 長文読解・接続詞穴埋め）', ${groupId});`
    );
  });
});
if (readingRows.length !== 40) {
  throw new Error(`想定外の長文読解生成件数: ${readingRows.length}件（40件のはず）`);
}

const allRows = [...idiomRows, ...readingRows];
fs.writeFileSync(OUT, allRows.join("\n") + "\n", "utf8");
console.log(
  `生成完了: ${OUT}（熟語系${idiomRows.length}件 + 長文読解${readingRows.length}件 = 計${allRows.length}件、passage_group_id ${FIRST_GROUP_ID}〜${FIRST_GROUP_ID + 19}）`
);
