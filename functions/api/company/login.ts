import { verifyPassword } from "../../_lib/password";

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
  approved: number;
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
    "SELECT id, company_name, password_hash, password_salt, approved FROM company_profiles WHERE email = ?"
  )
    .bind(email)
    .first<CompanyRow>();

  if (!company) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  const valid = await verifyPassword(password, company.password_hash, company.password_salt);
  if (!valid) {
    return Response.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
  }

  return Response.json({
    ok: true,
    companyName: company.company_name,
    approved: Boolean(company.approved),
  });
};
