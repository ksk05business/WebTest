interface Env {
  DB: D1Database;
}

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

// お問い合わせフォームの送信。未ログインの公開エンドポイント。/company/apply と同様、
// メール送信機能は未設定のためD1へ保存するのみ（自動返信・通知メールは送らない）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ContactBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { name, email, message } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }

  await context.env.DB.prepare(
    `INSERT INTO contact_inquiries (name, email, message) VALUES (?, ?, ?)`
  )
    .bind(name.trim(), email.trim(), message.trim())
    .run();

  return Response.json({ ok: true });
};
