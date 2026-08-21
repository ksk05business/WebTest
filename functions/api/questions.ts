import { toClientQuestion, type QuestionRow } from "../_lib/questionFormat";

interface Env {
  DB: D1Database;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// 出題対象の問題をランダム取得する。?category= / ?subCategory= はそれぞれ複数指定するとOR条件、
// ?difficulty= は完全一致、?limit= は取得件数（デフォルト10、最大50）。status='published' の問題のみを対象とする。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const categories = params.getAll("category").filter(Boolean);
  const subCategories = params.getAll("subCategory").filter(Boolean);
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
  if (subCategories.length > 0) {
    conditions.push(`sub_category IN (${subCategories.map(() => "?").join(",")})`);
    binds.push(...subCategories);
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
