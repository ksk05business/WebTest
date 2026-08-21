// D1のquestions行を、クライアント側のQuestion形状（選択肢A〜Eラベル付き）に変換する共通ロジック。
// functions/api/questions.ts と functions/api/review.ts の両方から使う。
export type QuestionRow = {
  id: number;
  category: string;
  sub_category: string;
  title: string | null;
  question_text: string;
  tables_json: string | null;
  options: string;
  correct_answer: number;
  explanation: string;
};

const CHOICE_LABELS = ["A", "B", "C", "D", "E"] as const;

export function toClientQuestion(row: QuestionRow) {
  let options: string[] = [];
  try {
    options = JSON.parse(row.options);
  } catch {
    options = [];
  }
  let explanation: string[] = [];
  try {
    explanation = JSON.parse(row.explanation);
  } catch {
    explanation = [row.explanation];
  }
  let tables: unknown = undefined;
  if (row.tables_json) {
    try {
      tables = JSON.parse(row.tables_json);
    } catch {
      tables = undefined;
    }
  }

  return {
    id: row.id,
    category: row.sub_category,
    title: row.title ?? undefined,
    text: row.question_text,
    tables,
    choices: options.map((text, i) => ({ label: CHOICE_LABELS[i] ?? String(i), text })),
    answer: CHOICE_LABELS[row.correct_answer] ?? String(row.correct_answer),
    explanation,
  };
}
