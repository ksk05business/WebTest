interface Env {
  DB: D1Database;
}

type ConsentBody = {
  email?: unknown;
  scoutConsent?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  let body: ConsentBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, scoutConsent } = body;

  if (typeof email !== "string" || !email.trim() || typeof scoutConsent !== "boolean") {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();

  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  try {
    await context.env.DB.prepare("UPDATE users SET scout_consent = ? WHERE id = ?")
      .bind(scoutConsent ? 1 : 0, user.id)
      .run();

    await context.env.DB.prepare(
      `INSERT INTO consent_events (user_id, consent_type, granted) VALUES (?, 'scout', ?)`
    )
      .bind(user.id, scoutConsent ? 1 : 0)
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
