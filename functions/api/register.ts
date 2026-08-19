import { hashPassword } from "../_lib/password";

interface Env {
  DB: D1Database;
}

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  facultyType?: unknown;
  university?: unknown;
  industry?: unknown;
  graduationYear?: unknown;
  graduationMonth?: unknown;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: RegisterBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    name,
    email,
    password,
    facultyType,
    university,
    industry,
    graduationYear,
    graduationMonth,
  } = body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8 ||
    typeof facultyType !== "string" ||
    !facultyType ||
    typeof university !== "string" ||
    !university ||
    typeof industry !== "string" ||
    !industry ||
    typeof graduationYear !== "number" ||
    typeof graduationMonth !== "number"
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const existing = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) {
    return Response.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(password);

  await context.env.DB.prepare(
    `INSERT INTO users
      (name, email, password_hash, password_salt, faculty_type, university, industry, graduation_year, graduation_month)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(name, email, hash, salt, facultyType, university, industry, graduationYear, graduationMonth)
    .run();

  return Response.json({ ok: true });
};
