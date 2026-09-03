// 問題データの型定義。実データはCloudflare D1の questions テーブルに移行済みで、
// /test は functions/api/questions.ts (GET /api/questions) 経由でこの形状のデータを取得する。
export type TableBlock = {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
};

export type Question = {
  id: number;
  category: string;
  // questions.category（大分類、例: "non_verbal", "tamatebako_math"）。復習ノートでテスト種別・
  // 科目ごとにグルーピング表示するために使う。category（=sub_category、例: "推論"）とは別物。
  rawCategory?: string;
  questionCode?: string;
  title?: string;
  text: string;
  tables?: TableBlock[];
  imageDataUri?: string;
  choices: { label: "A" | "B" | "C" | "D" | "E"; text: string }[];
  answer: "A" | "B" | "C" | "D" | "E";
  explanation: string[];
};

// 基礎能力試験（35分タイムボックス制、app/test/page.tsxのBasicExamFlow）の解答スナップショット。
// 試験中は正誤・解説を出さず、終了後に/resultへ渡して一覧表示するためlocalStorage(spiResultReview)に保存する。
export type ExamReviewEntry = {
  questionId: number;
  questionCode?: string;
  title?: string;
  text: string;
  choices: { label: string; text: string }[];
  correctLabel: string;
  selectedLabel: string | null;
  correct: boolean;
  explanation: string[];
  category: string;
  // questions.category（大分類、例: "non_verbal"）。目標解答時間（src/data/targetTimes.ts）を
  // category（=sub_category）とあわせて引くために使う。
  rawCategory?: string;
  // 問題が表示されてから解答するまでの経過秒数。時間切れ・未回答の場合はnull。
  answerTimeSeconds: number | null;
};
