import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

// 模試の中断・再開機能用のスナップショット保管庫。app/test/page.tsxのBasicExamFlow/
// SectionedExamFlowどちらから呼ばれても、questions_jsonは常にQuestion[][]（セクションごとの
// 配列の配列。BasicExamFlowは単一セクション扱い＝要素数1の配列）として保存する前提で、
// このAPI自体はフロー種別を一切意識しない単純な状態の保存・取得・削除のみを行う。

type SessionRow = {
  test_type: string;
  section_index: number;
  question_index: number;
  time_left_seconds: number;
  questions_json: string;
  answers_json: string;
};

// 中断中のセッションが存在するか取得する。ExamModeSelectModal（スタートボタンの文言切り替え）と、
// 模試画面自体（再開時の状態復元）の両方から使う。存在しなければsession: nullを返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const testType = new URL(context.request.url).searchParams.get("testType");
  if (!testType) {
    return Response.json({ error: "testTypeを指定してください" }, { status: 400 });
  }

  const row = await context.env.DB.prepare(
    `SELECT test_type, section_index, question_index, time_left_seconds, questions_json, answers_json
     FROM exam_sessions WHERE user_id = ? AND test_type = ?`
  )
    .bind(userId, testType)
    .first<SessionRow>();

  if (!row) {
    return Response.json({ session: null });
  }

  let questions: unknown;
  let answers: unknown;
  try {
    questions = JSON.parse(row.questions_json);
    answers = JSON.parse(row.answers_json);
  } catch {
    // 壊れたスナップショットは再開不可として扱う（新規に受験し直させる）。
    return Response.json({ session: null });
  }

  return Response.json({
    session: {
      testType: row.test_type,
      sectionIndex: row.section_index,
      questionIndex: row.question_index,
      timeLeftSeconds: row.time_left_seconds,
      questions,
      answers,
    },
  });
};

type PostBody = {
  testType?: unknown;
  sectionIndex?: unknown;
  questionIndex?: unknown;
  timeLeftSeconds?: unknown;
  questions?: unknown;
  answers?: unknown;
};

// 「中断して戻る」ボタンから呼ぶ保存処理。1ユーザー・1test_typeにつき常に最新の1件のみを保持する
// （既存の中断データがあれば上書き）。
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

  const { testType, sectionIndex, questionIndex, timeLeftSeconds, questions, answers } = body;
  if (
    typeof testType !== "string" ||
    !testType ||
    typeof sectionIndex !== "number" ||
    typeof questionIndex !== "number" ||
    typeof timeLeftSeconds !== "number" ||
    !Array.isArray(questions)
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  await context.env.DB.prepare(
    `INSERT INTO exam_sessions (user_id, test_type, section_index, question_index, time_left_seconds, questions_json, answers_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, test_type) DO UPDATE SET
       section_index = excluded.section_index,
       question_index = excluded.question_index,
       time_left_seconds = excluded.time_left_seconds,
       questions_json = excluded.questions_json,
       answers_json = excluded.answers_json,
       updated_at = datetime('now')`
  )
    .bind(
      userId,
      testType,
      sectionIndex,
      questionIndex,
      timeLeftSeconds,
      JSON.stringify(questions),
      JSON.stringify(answers ?? [])
    )
    .run();

  return Response.json({ ok: true });
};

// 模試が正常に完走した際に呼ぶ削除処理。中断データを残したままにすると、次に同じtest_typeを
// 開始しようとしたときに誤って「前回の続きから再開」の対象として扱われてしまうため。
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const testType = new URL(context.request.url).searchParams.get("testType");
  if (!testType) {
    return Response.json({ error: "testTypeを指定してください" }, { status: 400 });
  }

  await context.env.DB.prepare("DELETE FROM exam_sessions WHERE user_id = ? AND test_type = ?")
    .bind(userId, testType)
    .run();

  return Response.json({ ok: true });
};
