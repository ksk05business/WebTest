import { checkAdminAuth } from "../../_lib/adminAuth";
import { type QuestionInput, type ValidatedQuestion, validateQuestion } from "../../_lib/questionValidation";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
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
  status: string;
  originality_note: string | null;
  passage_group_id: number | null;
  image_data_uri: string | null;
  is_reviewed: number;
  is_mock_only: number;
  created_at: string;
};

function parseJsonArray(value: string, fallback: unknown[] = []): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toAdminQuestion(row: QuestionRow) {
  let tables: unknown = null;
  if (row.tables_json) {
    try {
      tables = JSON.parse(row.tables_json);
    } catch {
      tables = null;
    }
  }

  return {
    id: row.id,
    category: row.category,
    subCategory: row.sub_category,
    title: row.title,
    questionText: row.question_text,
    tables,
    options: parseJsonArray(row.options) as string[],
    correctAnswer: row.correct_answer,
    explanation: parseJsonArray(row.explanation, [row.explanation]) as string[],
    difficulty: row.difficulty,
    status: row.status,
    originalityNote: row.originality_note,
    passageGroupId: row.passage_group_id,
    imageDataUri: row.image_data_uri,
    isReviewed: row.is_reviewed === 1,
    isMockOnly: row.is_mock_only === 1,
    createdAt: row.created_at,
  };
}

// 問題検品機能用の一覧取得API。テスト種別ではなくcategory（大分類、例: "non_verbal"）/
// subCategory（単元、例: "推論"）の実データ値でフィルタする（テスト種別への割り当てはフロント側の
// src/data/categoryMeta.ts / practiceUnits.ts で解決し、対応するcategory値をクエリに渡す想定）。
// クエリパラメータ:
//   category, subCategory（複数指定可、いずれも省略時は全件対象）
//   reviewed = "true" | "false"（省略時はレビュー状態を問わず全件）
//   mockOnly = "true" | "false"（省略時は練習問題・模試専用問わず全件。"true"で模試専用のみ、
//     "false"で練習問題のみ。問題データ管理ダッシュボードのフィルタ用）
//   search（問題文・タイトルの部分一致キーワード検索）
//   limit（デフォルト50、最大200）, offset（デフォルト0）
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const params = new URL(context.request.url).searchParams;
  const categories = params.getAll("category").filter(Boolean);
  const subCategories = params.getAll("subCategory").filter(Boolean);
  const reviewed = params.get("reviewed");
  const mockOnly = params.get("mockOnly");
  const search = params.get("search")?.trim();
  const limitRaw = params.get("limit");
  const offsetRaw = params.get("offset");
  const limit = Math.min(
    Math.max(limitRaw !== null && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : 50, 1),
    200
  );
  const offset = Math.max(offsetRaw !== null && !Number.isNaN(Number(offsetRaw)) ? Number(offsetRaw) : 0, 0);

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (categories.length > 0) {
    conditions.push(`category IN (${categories.map(() => "?").join(",")})`);
    binds.push(...categories);
  }
  if (subCategories.length > 0) {
    conditions.push(`sub_category IN (${subCategories.map(() => "?").join(",")})`);
    binds.push(...subCategories);
  }
  if (reviewed === "true") {
    conditions.push("is_reviewed = 1");
  } else if (reviewed === "false") {
    conditions.push("is_reviewed = 0");
  }
  if (mockOnly === "true") {
    conditions.push("is_mock_only = 1");
  } else if (mockOnly === "false") {
    conditions.push("is_mock_only = 0");
  }
  if (search) {
    conditions.push("(question_text LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\')");
    const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
    binds.push(`%${escaped}%`, `%${escaped}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRow = await context.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM questions ${whereClause}`)
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = await context.env.DB.prepare(
    `SELECT id, category, sub_category, title, question_text, tables_json, options, correct_answer, explanation,
            difficulty, status, originality_note, passage_group_id, image_data_uri, is_reviewed, is_mock_only, created_at
     FROM questions
     ${whereClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all<QuestionRow>();

  return Response.json({
    questions: (rows.results ?? []).map(toAdminQuestion),
    total: totalRow?.cnt ?? 0,
    limit,
    offset,
  });
};

// 開発者・管理者用の問題追加API。単発（1オブジェクト）または一括（{questions:[...]}）どちらの
// リクエストボディにも対応する。x-admin-token ヘッダーが ADMIN_API_TOKEN と一致しない限り拒否する
// （このアプリには管理者ログイン機構が無いため、共有シークレットによる簡易ゲートとした）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const inputs: QuestionInput[] = Array.isArray((body as { questions?: unknown })?.questions)
    ? ((body as { questions: QuestionInput[] }).questions)
    : [body as QuestionInput];

  if (inputs.length === 0) {
    return Response.json({ error: "questionsが空です" }, { status: 400 });
  }

  const validated: ValidatedQuestion[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const result = validateQuestion(inputs[i] ?? {}, `questions[${i}]`);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    validated.push(result);
  }

  const insertedIds: number[] = [];
  for (const q of validated) {
    const row = await context.env.DB.prepare(
      `INSERT INTO questions
        (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id, image_data_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
      .bind(
        q.category,
        q.subCategory,
        q.title,
        q.questionText,
        q.tablesJson,
        q.optionsJson,
        q.correctAnswer,
        q.explanationJson,
        q.difficulty,
        q.status,
        q.originalityNote,
        q.passageGroupId,
        q.imageDataUri
      )
      .first<{ id: number }>();
    if (row) insertedIds.push(row.id);
  }

  return Response.json({ ok: true, insertedIds, count: insertedIds.length });
};
