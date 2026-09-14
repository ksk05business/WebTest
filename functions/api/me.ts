import { getUniversityCategory } from "../../src/data/universityCategories";
import { MANUAL_ENTRY_UNIVERSITIES } from "../../src/data/universities";
import { parseDesiredOccupations } from "../_lib/desiredOccupations";
import { getAuthenticatedSubjectId } from "../_lib/session";
import { isValidMbtiCode } from "../../src/data/mbti";
import { isPlaceholderLineEmail } from "../_lib/linePlaceholderEmail";

interface Env {
  DB: D1Database;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  mbti: string | null;
  is_profile_completed: number;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const user = await context.env.DB.prepare(
    `SELECT last_name, first_name, last_name_romaji, first_name_romaji, email,
            faculty_type, university, university_category, industry_first, industry_second, industry_third,
            desired_occupations, graduation_year, graduation_month, scout_consent, mbti, is_profile_completed
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

  return Response.json({
    ...user,
    desired_occupations: desiredOccupations,
    is_profile_completed: user.is_profile_completed === 1,
    // LINEログインでメールアドレスが未登録（ダミーアドレス保存）のユーザーのみ、
    // マイページ側でメールアドレス入力欄を編集可能・必須として表示するためのフラグ。
    email_editable: isPlaceholderLineEmail(user.email),
  });
};

type UpdateBody = {
  email?: unknown;
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
  mbti?: unknown;
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
    email,
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
    mbti,
  } = body;

  const currentUser = await context.env.DB.prepare("SELECT email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ email: string }>();
  if (!currentUser) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // LINEログインでメールアドレスが未登録（ダミーアドレス保存）のユーザーのみ、
  // このタイミングで本人入力のメールアドレスを必須にして実際のemailへ更新する。
  // それ以外のユーザーのメールアドレスは変更不可（既存仕様のまま）。
  let newEmail = currentUser.email;
  if (isPlaceholderLineEmail(currentUser.email)) {
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      return Response.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }
    newEmail = email.trim();
    const existing = await context.env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?")
      .bind(newEmail, userId)
      .first();
    if (existing) {
      return Response.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }
  }

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

  // MBTIは任意項目。未選択（""/undefined/null）はNULL保存、指定時は既知の16タイプのみ許可する。
  if (mbti !== undefined && mbti !== null && mbti !== "" && (typeof mbti !== "string" || !isValidMbtiCode(mbti))) {
    return Response.json({ error: "MBTIの値が不正です" }, { status: 400 });
  }
  const mbtiValue = typeof mbti === "string" && mbti !== "" ? mbti : null;

  const universityCategory =
    typeof manualUniversityCategory === "string" &&
    (MANUAL_ENTRY_UNIVERSITIES as string[]).includes(manualUniversityCategory)
      ? manualUniversityCategory
      : getUniversityCategory(university);

  // 必須プロフィール項目（このPUTが要求する全項目）が入力された時点で完了扱いにする。
  // Googleログインの仮登録（functions/api/auth/google-signup.ts）はis_profile_completed=0で
  // 作成されるが、このAPIは通常の会員登録と同じ必須項目をすべて検証済みのため、
  // 呼び出しに成功すれば常に1へ更新してよい。
  const result = await context.env.DB.prepare(
    `UPDATE users SET
      email = ?, last_name = ?, first_name = ?, last_name_romaji = ?, first_name_romaji = ?,
      faculty_type = ?, university = ?, university_category = ?, industry_first = ?, industry_second = ?, industry_third = ?,
      desired_occupations = ?, graduation_year = ?, graduation_month = ?, mbti = ?, is_profile_completed = 1
     WHERE id = ?`
  )
    .bind(
      newEmail,
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
      mbtiValue,
      userId
    )
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, name: `${lastName} ${firstName}` });
};
