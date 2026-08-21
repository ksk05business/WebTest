interface Env {
  DB: D1Database;
}

type QuestionRow = {
  id: number;
  category: string;
  sub_category: string;
  title: string | null;
  question_text: string;
  tables_json: string | null;
  options: string;
  correct_answer: number;
  explanation: string;
  difficulty: number;
};

const CHOICE_LABELS = ["A", "B", "C", "D", "E"] as const;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// D1のquestions行を、/testが従来使っていたQuestion形状（選択肢A〜Eラベル付き）に変換する。
function toClientQuestion(row: QuestionRow) {
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

// 出題対象の問題をランダム取得する。?category= を複数指定するとOR条件、?difficulty= は完全一致、
// ?limit= は取得件数（デフォルト10、最大50）。status='published' の問題のみを対象とする。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const categories = params.getAll("category").filter(Boolean);
  const difficultyRaw = params.get("difficulty");
  const difficulty = difficultyRaw !== null ? Number(difficultyRaw) : null;
  const limitRaw = params.get("limit");
  const limit = Math.min(
    Math.max(limitRaw !== null && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const conditions = ["status = 'published'"];
  const binds: (string | number)[] = [];

  if (categories.length > 0) {
    conditions.push(`category IN (${categories.map(() => "?").join(",")})`);
    binds.push(...categories);
  }
  if (difficulty !== null && !Number.isNaN(difficulty)) {
    conditions.push("difficulty = ?");
    binds.push(difficulty);
  }

  binds.push(limit);

  const rows = await context.env.DB.prepare(
    `SELECT id, category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty
     FROM questions
     WHERE ${conditions.join(" AND ")}
     ORDER BY RANDOM()
     LIMIT ?`
  )
    .bind(...binds)
    .all<QuestionRow>();

  return Response.json({
    questions: (rows.results ?? []).map(toClientQuestion),
  });
};
