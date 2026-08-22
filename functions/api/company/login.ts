import { verifyPassword } from "../../_lib/password";
import { createSession, sessionCookieHeader } from "../../_lib/session";

interface Env {
  DB: D1Database;
}

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type CompanyRow = {
  id: number;
  company_name: string;
  password_hash: string;
  password_salt: string;
  status: string;
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

  const company = await context.env.DB.prepare(
    "SELECT id, company_name, password_hash, password_salt, status FROM company_profiles WHERE email = ?"
  )
    .bind(email)
    .first<CompanyRow>();

  if (!company) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  // 審査中('pending')・却下('rejected')のアカウントは、パスワード照合の前にログイン自体を遮断する
  // （いたずら登録・未審査アカウントの利用防止）。
  if (company.status !== "active") {
    return Response.json(
      { error: "現在アカウントの審査中または無効化されています" },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, company.password_hash, company.password_salt);
  if (!valid) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const token = await createSession(context.env.DB, "company", company.id);

  return new Response(
    JSON.stringify({ ok: true, companyName: company.company_name, approved: true }),
    {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookieHeader("company", token),
      },
    }
  );
};
