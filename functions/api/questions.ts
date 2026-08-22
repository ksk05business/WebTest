import { toClientQuestion, type QuestionRow } from "../_lib/questionFormat";

interface Env {
  DB: D1Database;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type Row = QuestionRow & { passage_group_id: number | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 出題対象の問題を取得する。?category= / ?subCategory= はそれぞれ複数指定するとOR条件、
// ?difficulty= は完全一致、?limit= は取得件数（デフォルト10、最大50）。status='published' の問題のみを対象とする。
// 同じ長文から出題される設問（GAB形式の論理的読解等、passage_group_idが同一の問題）は、
// シャッフル後も常にグループ内の順序（id昇順）を保ったまま連続して出題されるようにする。
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

  const rows = await context.env.DB.prepare(
    `WITH ranked AS (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS seq FROM questions
     )
     SELECT q.id, q.category, q.sub_category, q.title, q.question_text, q.tables_json, q.options, q.correct_answer, q.explanation, q.difficulty, q.passage_group_id, q.image_data_uri, r.seq
     FROM questions q
     JOIN ranked r ON r.id = q.id
     WHERE ${conditions.join(" AND ")}`
  )
    .bind(...binds)
    .all<Row>();

  const groups = new Map<string, Row[]>();
  for (const row of rows.results ?? []) {
    const key = row.passage_group_id !== null ? `g${row.passage_group_id}` : `q${row.id}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.id - b.id);
  }

  const shuffledGroups = shuffle([...groups.values()]);
  const selected: Row[] = [];
  for (const group of shuffledGroups) {
    if (selected.length >= limit) break;
    if (selected.length + group.length <= limit || selected.length === 0) {
      selected.push(...group.slice(0, limit - selected.length));
    }
  }

  return Response.json({
    questions: selected.map(toClientQuestion),
  });
};
