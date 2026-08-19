import { hashPassword } from "../_lib/password";

interface Env {
  DB: D1Database;
}

type RegisterBody = {
  lastName?: unknown;
  firstName?: unknown;
  lastNameRomaji?: unknown;
  firstNameRomaji?: unknown;
  email?: unknown;
  password?: unknown;
  facultyType?: unknown;
  university?: unknown;
  industryFirst?: unknown;
  industrySecond?: unknown;
  industryThird?: unknown;
  graduationYear?: unknown;
  graduationMonth?: unknown;
  agreedTerms?: unknown;
  scoutConsent?: unknown;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: RegisterBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    lastName,
    firstName,
    lastNameRomaji,
    firstNameRomaji,
    email,
    password,
    facultyType,
    university,
    industryFirst,
    industrySecond,
    industryThird,
    graduationYear,
    graduationMonth,
    agreedTerms,
    scoutConsent,
  } = body;

  if (
    typeof lastName !== "string" ||
    !lastName.trim() ||
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastNameRomaji !== "string" ||
    !lastNameRomaji.trim() ||
    typeof firstNameRomaji !== "string" ||
    !firstNameRomaji.trim() ||
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

  if (agreedTerms !== true) {
    return Response.json({ error: "利用規約・プライバシーポリシーへの同意が必要です" }, { status: 400 });
  }
  const isScoutConsent = scoutConsent === true;

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

  const inserted = await context.env.DB.prepare(
    `INSERT INTO users
      (last_name, first_name, last_name_romaji, first_name_romaji, email, password_hash, password_salt,
       faculty_type, university, industry_first, industry_second, industry_third, graduation_year, graduation_month,
       terms_agreed_at, scout_consent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
     RETURNING id`
  )
    .bind(
      lastName,
      firstName,
      lastNameRomaji,
      firstNameRomaji,
      email,
      hash,
      salt,
      facultyType,
      university,
      industryFirst,
      industrySecond,
      industryThird,
      graduationYear,
      graduationMonth,
      isScoutConsent ? 1 : 0
    )
    .first<{ id: number }>();

  if (inserted) {
    const events = [["terms", 1]] as const;
    for (const [type, granted] of isScoutConsent ? [...events, ["scout", 1] as const] : events) {
      await context.env.DB.prepare(
        `INSERT INTO consent_events (user_id, consent_type, granted) VALUES (?, ?, ?)`
      )
        .bind(inserted.id, type, granted)
        .run();
    }
  }

  return Response.json({ ok: true, name: `${lastName} ${firstName}` });
};
