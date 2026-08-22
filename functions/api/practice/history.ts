import { toClientQuestion, type QuestionRow } from "../../_lib/questionFormat";

interface Env {
  DB: D1Database;
}

type AnswerInput = { questionId: number; correct: boolean };

type PostBody = {
  email?: unknown;
  testType?: unknown;
  answers?: unknown;
  isPractice?: unknown;
};

function isAnswers(value: unknown): value is AnswerInput[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as { questionId?: unknown }).questionId === "number" &&
      typeof (v as { correct?: unknown }).correct === "boolean"
  );
}

// テスト種別・単元・出題モード（練習/模試）を問わず、1回答=1行として user_question_history に記録する。
// テスト種別の異なる問題を混同しないよう、testTypeも保存する。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, answers } = body;
  const testType = typeof body.testType === "string" && body.testType ? body.testType : "spi";
  const isPractice = body.isPractice !== false;

  if (typeof email !== "string" || !email.trim() || !isAnswers(answers) || answers.length === 0) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  for (const a of answers) {
    await context.env.DB.prepare(
      `INSERT INTO user_question_history (user_id, question_id, test_type, correct, is_practice)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(user.id, a.questionId, testType, a.correct ? 1 : 0, isPractice ? 1 : 0)
      .run();
  }

  return Response.json({ ok: true, count: answers.length });
};

type WrongRow = QuestionRow;

// ?countOnly=1 の場合は件数のみ、それ以外は復習用に問題本体（Question[]）も返す。
// 「間違えた問題」は、同じ問題への最新の解答（answered_at降順の1件）が不正解のものを指す
// （その後正解していれば対象から外れる）。テスト種別ごとに独立してカウント・出題する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const email = params.get("email");
  const testType = params.get("testType");
  const countOnly = params.get("countOnly") === "1";
  const limitRaw = params.get("limit");
  const limit = Math.min(
    Math.max(limitRaw !== null && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : 20, 1),
    50
  );

  if (!email || !testType) {
    return Response.json({ error: "emailとtestTypeを指定してください" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const countRow = await context.env.DB.prepare(
    `WITH latest AS (
       SELECT question_id, correct,
              ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC, id DESC) AS rn
       FROM user_question_history
       WHERE user_id = ? AND test_type = ?
     )
     SELECT COUNT(*) AS cnt FROM latest WHERE rn = 1 AND correct = 0`
  )
    .bind(user.id, testType)
    .first<{ cnt: number }>();
  const count = countRow?.cnt ?? 0;

  if (countOnly || count === 0) {
    return Response.json({ count, questions: [] });
  }

  const rows = await context.env.DB.prepare(
    `WITH latest AS (
       SELECT question_id, correct,
              ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC, id DESC) AS rn
       FROM user_question_history
       WHERE user_id = ? AND test_type = ?
     ),
     wrong AS (
       SELECT question_id FROM latest WHERE rn = 1 AND correct = 0
     ),
     ranked AS (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS seq FROM questions
     )
     SELECT q.id, q.category, q.sub_category, q.title, q.question_text, q.tables_json, q.options, q.correct_answer, q.explanation, q.image_data_uri, r.seq
     FROM wrong w
     JOIN questions q ON q.id = w.question_id
     JOIN ranked r ON r.id = q.id
     WHERE q.status = 'published'
     ORDER BY RANDOM()
     LIMIT ?`
  )
    .bind(user.id, testType, limit)
    .all<WrongRow>();

  return Response.json({
    count,
    questions: (rows.results ?? []).map(toClientQuestion),
  });
};
