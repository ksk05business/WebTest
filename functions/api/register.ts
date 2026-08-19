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
  industryFirst?: unknown;
  industrySecond?: unknown;
  industryThird?: unknown;
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
    industryFirst,
    industrySecond,
    industryThird,
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
    typeof industryFirst !== "string" ||
    !industryFirst ||
    typeof industrySecond !== "string" ||
    !industrySecond ||
    typeof industryThird !== "string" ||
    !industryThird ||
    typeof graduationYear !== "number" ||
    typeof graduationMonth !== "number"
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  if (
    industryFirst === industrySecond ||
    industryFirst === industryThird ||
    industrySecond === industryThird
  ) {
    return Response.json(
      { error: "第一〜第三志望の業界はそれぞれ異なるものを選択してください" },
      { status: 400 }
    );
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
      (name, email, password_hash, password_salt, faculty_type, university,
       industry_first, industry_second, industry_third, graduation_year, graduation_month)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      name,
      email,
      hash,
      salt,
      facultyType,
      university,
      industryFirst,
      industrySecond,
      industryThird,
      graduationYear,
      graduationMonth
    )
    .run();

  return Response.json({ ok: true });
};
