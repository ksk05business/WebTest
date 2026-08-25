import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

const VALID_STATUSES = ["known", "uncertain", "wrong"] as const;

type PostBody = {
  questionId?: unknown;
  status?: unknown;
};

// 練習問題の解答直後の自己評価（〇known/△uncertain/×wrong）を1問1行でupsertする。
// 既に行がある場合は最新の自己評価で上書きする（履歴は積まない）。
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

  const { questionId, status } = body;
  if (
    typeof questionId !== "number" ||
    typeof status !== "string" ||
    !(VALID_STATUSES as readonly string[]).includes(status)
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  await context.env.DB.prepare(
    `INSERT INTO user_question_statuses (user_id, question_id, status, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, question_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`
  )
    .bind(userId, questionId, status)
    .run();

  return Response.json({ ok: true });
};
