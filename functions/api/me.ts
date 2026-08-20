import { getUniversityCategory } from "../../src/data/universityCategories";

interface Env {
  DB: D1Database;
}

type UserProfile = {
  last_name: string;
  first_name: string;
  last_name_romaji: string;
  first_name_romaji: string;
  email: string;
  faculty_type: string;
  university: string;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  graduation_year: number;
  graduation_month: number;
  scout_consent: number;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const email = new URL(context.request.url).searchParams.get("email");
  if (!email) {
    return Response.json({ error: "emailが指定されていません" }, { status: 400 });
  }

  const user = await context.env.DB.prepare(
    `SELECT last_name, first_name, last_name_romaji, first_name_romaji, email,
            faculty_type, university, industry_first, industry_second, industry_third,
            graduation_year, graduation_month, scout_consent
     FROM users WHERE email = ?`
  )
    .bind(email)
    .first<UserProfile>();

  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return Response.json(user);
};

type UpdateBody = {
  email?: unknown;
  lastName?: unknown;
  firstName?: unknown;
  lastNameRomaji?: unknown;
  firstNameRomaji?: unknown;
  facultyType?: unknown;
  university?: unknown;
  industryFirst?: unknown;
  industrySecond?: unknown;
  industryThird?: unknown;
  graduationYear?: unknown;
  graduationMonth?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  let body: UpdateBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    email,
    lastName,
    firstName,
    lastNameRomaji,
    firstNameRomaji,
    facultyType,
    university,
    industryFirst,
    industrySecond,
    industryThird,
    graduationYear,
    graduationMonth,
  } = body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof lastName !== "string" ||
    !lastName.trim() ||
    typeof firstName !== "string" ||
    !firstName.trim() ||
    typeof lastNameRomaji !== "string" ||
    !lastNameRomaji.trim() ||
    typeof firstNameRomaji !== "string" ||
    !firstNameRomaji.trim() ||
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

  const result = await context.env.DB.prepare(
    `UPDATE users SET
      last_name = ?, first_name = ?, last_name_romaji = ?, first_name_romaji = ?,
      faculty_type = ?, university = ?, university_category = ?, industry_first = ?, industry_second = ?, industry_third = ?,
      graduation_year = ?, graduation_month = ?
     WHERE email = ?`
  )
    .bind(
      lastName,
      firstName,
      lastNameRomaji,
      firstNameRomaji,
      facultyType,
      university,
      getUniversityCategory(university),
      industryFirst,
      industrySecond,
      industryThird,
      graduationYear,
      graduationMonth,
      email
    )
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, name: `${lastName} ${firstName}` });
};
