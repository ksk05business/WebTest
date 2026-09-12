import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

// ログイン中の学生が/bordersでお気に入り登録した企業ボーダーのidを一覧取得する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await context.env.DB.prepare(
    "SELECT company_border_id FROM user_favorite_companies WHERE user_id = ?"
  )
    .bind(userId)
    .all<{ company_border_id: number }>();

  return Response.json({
    companyBorderIds: (rows.results ?? []).map((r) => r.company_border_id),
  });
};

type PostBody = {
  companyBorderId?: unknown;
};

// お気に入り登録のトグル（未登録なら追加、登録済みなら解除）。
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

  const companyBorderId = body.companyBorderId;
  if (typeof companyBorderId !== "number" || !Number.isInteger(companyBorderId)) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const existing = await context.env.DB.prepare(
    "SELECT id FROM user_favorite_companies WHERE user_id = ? AND company_border_id = ?"
  )
    .bind(userId, companyBorderId)
    .first<{ id: number }>();

  if (existing) {
    await context.env.DB.prepare("DELETE FROM user_favorite_companies WHERE id = ?")
      .bind(existing.id)
      .run();
    return Response.json({ favorited: false });
  }

  await context.env.DB.prepare(
    "INSERT INTO user_favorite_companies (user_id, company_border_id) VALUES (?, ?)"
  )
    .bind(userId, companyBorderId)
    .run();
  return Response.json({ favorited: true });
};
