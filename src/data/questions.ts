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
  questionCode?: string;
  title?: string;
  text: string;
  tables?: TableBlock[];
  imageDataUri?: string;
  choices: { label: "A" | "B" | "C" | "D" | "E"; text: string }[];
  answer: "A" | "B" | "C" | "D" | "E";
  explanation: string[];
};
