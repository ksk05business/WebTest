import { verifyPassword } from "../_lib/password";
import { createSession, sessionCookieHeader } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type UserRow = {
  id: number;
  last_name: string;
  first_name: string;
  password_hash: string;
  password_salt: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: LoginBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, password } = body;

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return Response.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  const user = await context.env.DB.prepare(
    "SELECT id, last_name, first_name, password_hash, password_salt FROM users WHERE email = ?"
  )
    .bind(email)
    .first<UserRow>();

  if (!user) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash, user.password_salt);
  if (!valid) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const token = await createSession(context.env.DB, "user", user.id);

  return new Response(
    JSON.stringify({ ok: true, name: `${user.last_name} ${user.first_name}` }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookieHeader("user", token),
      },
    }
  );
};
