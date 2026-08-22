import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type ConsentBody = {
  scoutConsent?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: ConsentBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { scoutConsent } = body;

  if (typeof scoutConsent !== "boolean") {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  try {
    await context.env.DB.prepare("UPDATE users SET scout_consent = ? WHERE id = ?")
      .bind(scoutConsent ? 1 : 0, userId)
      .run();

    await context.env.DB.prepare(
      `INSERT INTO consent_events (user_id, consent_type, granted) VALUES (?, 'scout', ?)`
    )
      .bind(userId, scoutConsent ? 1 : 0)
      .run();
  } catch (err) {
    console.error("Failed to update scout consent", err);
    return Response.json(
      { error: "データベースの更新に失敗しました。管理者にお問い合わせください。" },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, scoutConsent });
};
