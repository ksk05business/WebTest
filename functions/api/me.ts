import { getUniversityCategory } from "../../src/data/universityCategories";
import { MANUAL_ENTRY_UNIVERSITIES } from "../../src/data/universities";
import { parseDesiredOccupations } from "../_lib/desiredOccupations";
import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type UserProfileRow = {
  last_name: string;
  first_name: string;
  last_name_romaji: string;
  first_name_romaji: string;
  email: string;
  faculty_type: string;
  university: string;
  university_category: string | null;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  desired_occupations: string;
  graduation_year: number;
  graduation_month: number;
  scout_consent: number;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const user = await context.env.DB.prepare(
    `SELECT last_name, first_name, last_name_romaji, first_name_romaji, email,
            faculty_type, university, university_category, industry_first, industry_second, industry_third,
            desired_occupations, graduation_year, graduation_month, scout_consent
     FROM users WHERE id = ?`
  )
    .bind(userId)
    .first<UserProfileRow>();

  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  let desiredOccupations: string[] = [];
  try {
    desiredOccupations = JSON.parse(user.desired_occupations);
  } catch {
    desiredOccupations = [];
  }

  return Response.json({ ...user, desired_occupations: desiredOccupations });
};

type UpdateBody = {
  lastName?: unknown;
  firstName?: unknown;
  lastNameRomaji?: unknown;
  firstNameRomaji?: unknown;
  facultyType?: unknown;
  university?: unknown;
  // 一覧に無い大学を手動入力した場合に、フロントで選ばれた区分
  // （その他国公立大学/その他私立大学/海外大学）をそのまま受け取る。
  manualUniversityCategory?: unknown;
  industryFirst?: unknown;
  industrySecond?: unknown;
  industryThird?: unknown;
  desiredOccupations?: unknown;
  graduationYear?: unknown;
  graduationMonth?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: UpdateBody;
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
    facultyType,
    university,
    manualUniversityCategory,
    industryFirst,
    industrySecond,
    industryThird,
    desiredOccupations,
    graduationYear,
    graduationMonth,
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

  const desiredOccupationsJson = parseDesiredOccupations(desiredOccupations);
  if (!desiredOccupationsJson) {
    return Response.json(
      { error: "希望職種は1〜3つ選択してください" },
      { status: 400 }
    );
  }

  const universityCategory =
    typeof manualUniversityCategory === "string" &&
    (MANUAL_ENTRY_UNIVERSITIES as string[]).includes(manualUniversityCategory)
      ? manualUniversityCategory
      : getUniversityCategory(university);

  const result = await context.env.DB.prepare(
    `UPDATE users SET
      last_name = ?, first_name = ?, last_name_romaji = ?, first_name_romaji = ?,
      faculty_type = ?, university = ?, university_category = ?, industry_first = ?, industry_second = ?, industry_third = ?,
      desired_occupations = ?, graduation_year = ?, graduation_month = ?
     WHERE id = ?`
  )
    .bind(
      lastName,
      firstName,
      lastNameRomaji,
      firstNameRomaji,
      facultyType,
      university,
      universityCategory,
      industryFirst,
      industrySecond,
      industryThird,
      desiredOccupationsJson,
      graduationYear,
      graduationMonth,
      userId
    )
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, name: `${lastName} ${firstName}` });
};
