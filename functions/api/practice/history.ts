import { toClientQuestion, type QuestionRow } from "../../_lib/questionFormat";
import { getAuthenticatedSubjectId } from "../../_lib/session";
import { getMemorizationUnitKeys } from "../../../src/data/practiceUnits";

interface Env {
  DB: D1Database;
}

type AnswerInput = { questionId: number; correct: boolean };

type PostBody = {
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
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { answers } = body;
  const testType = typeof body.testType === "string" && body.testType ? body.testType : "spi";
  const isPractice = body.isPractice !== false;

  if (!isAnswers(answers) || answers.length === 0) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  for (const a of answers) {
    await context.env.DB.prepare(
      `INSERT INTO user_question_history (user_id, question_id, test_type, correct, is_practice)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(userId, a.questionId, testType, a.correct ? 1 : 0, isPractice ? 1 : 0)
      .run();
  }

  return Response.json({ ok: true, count: answers.length });
};

type WrongRow = QuestionRow;

// ?countOnly=1 の場合は件数のみ、それ以外は復習用に問題本体（Question[]）も返す。
// 「間違えた問題」は、同じ問題への最新の解答（answered_at降順の1件）が不正解のものを指す
// （その後正解していれば対象から外れる）。
//
// 2つのモードを持つ:
//   - ?testType=<id>: そのテストの全分野（非言語・言語・英語等を問わない）を対象に独立してカウント・出題する
//     （各テスト単元選択ページ上部の「復習ノート」用）。
//   - ?scope=memorization（testType省略時）: テスト種別を問わず、src/data/practiceUnits.tsで
//     memorization: true とマークされた単元（スマホで手軽に解ける暗記・知識系単元のみ、長文読解等は除く）
//     を横断して対象にする（ダッシュボードの「スキマ暗記復習」用）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const params = new URL(context.request.url).searchParams;
  const testType = params.get("testType");
  const isMemorizationScope = !testType && params.get("scope") === "memorization";
  const countOnly = params.get("countOnly") === "1";
  const limitRaw = params.get("limit");
  const limit = Math.min(
    Math.max(limitRaw !== null && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : 20, 1),
    50
  );

  if (!testType && !isMemorizationScope) {
    return Response.json({ error: "testTypeまたはscope=memorizationを指定してください" }, { status: 400 });
  }

  // testType指定時: user_question_history.test_type で絞り込む（そのテストの全分野が対象）。
  // memorizationスコープ時: questionsをJOINし、暗記系単元の(category, subCategory)ペアで絞り込む
  // （test_typeを問わず全テスト横断）。
  const memorizationUnits = isMemorizationScope ? getMemorizationUnitKeys() : [];
  if (isMemorizationScope && memorizationUnits.length === 0) {
    return Response.json({ count: 0, questions: [] });
  }
  const memorizationCondition = memorizationUnits.map(() => "(q.category = ? AND q.sub_category = ?)").join(" OR ");
  const memorizationBinds = memorizationUnits.flatMap((u) => [u.category, u.subCategory]);

  const latestCte = isMemorizationScope
    ? `SELECT h.question_id, h.correct,
              ROW_NUMBER() OVER (PARTITION BY h.question_id ORDER BY h.answered_at DESC, h.id DESC) AS rn
       FROM user_question_history h
       JOIN questions q ON q.id = h.question_id
       WHERE h.user_id = ? AND (${memorizationCondition})`
    : `SELECT question_id, correct,
              ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC, id DESC) AS rn
       FROM user_question_history
       WHERE user_id = ? AND test_type = ?`;
  const latestBinds = isMemorizationScope ? [userId, ...memorizationBinds] : [userId, testType];

  const countRow = await context.env.DB.prepare(
    `WITH latest AS (${latestCte})
     SELECT COUNT(*) AS cnt
     FROM latest l
     JOIN questions q ON q.id = l.question_id
     WHERE l.rn = 1 AND l.correct = 0 AND q.is_mock_only = 0`
  )
    .bind(...latestBinds)
    .first<{ cnt: number }>();
  const count = countRow?.cnt ?? 0;

  if (countOnly || count === 0) {
    return Response.json({ count, questions: [] });
  }

  const rows = await context.env.DB.prepare(
    `WITH latest AS (${latestCte}),
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
     WHERE q.status = 'published' AND q.is_mock_only = 0
     ORDER BY RANDOM()
     LIMIT ?`
  )
    .bind(...latestBinds, limit)
    .all<WrongRow>();

  return Response.json({
    count,
    questions: (rows.results ?? []).map(toClientQuestion),
  });
};
