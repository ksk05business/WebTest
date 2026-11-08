import { enforceRateLimit } from "../_lib/rateLimit";
import { hashPassword } from "../_lib/password";
import { buildPlaceholderProfile } from "../_lib/placeholderProfile";
import { createSession, sessionCookieHeader } from "../_lib/session";

interface Env {
  DB: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
}

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  agreedTerms?: unknown;
  scoutConsent?: unknown;
};

// 会員登録はメールアドレス・パスワードのみで完結させる（2026-09-13の改修で、氏名・大学・
// 志望業界等の詳細プロフィール入力を登録フローから分離した）。大学・志望業界等の必須列は
// buildPlaceholderProfile()の仮値で埋め、is_profile_completed = 0 で作成する。本人が
// 後から/mypage（PUT /api/me）で実際の値を保存すると is_profile_completed が 1 に更新される
// （functions/api/me.ts参照）。この仮登録の枠組みはGoogleログインでの新規作成
// （functions/api/auth/google-signup.ts）と共通。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const limited = await enforceRateLimit(context.env.RATE_LIMIT_KV, context.request, "register", 10, 3600);
  if (limited) return limited;

  let body: RegisterBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, password, agreedTerms, scoutConsent } = body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  if (agreedTerms !== true) {
    return Response.json({ error: "利用規約・プライバシーポリシーへの同意が必要です" }, { status: 400 });
  }
  const isScoutConsent = scoutConsent === true;

  const existing = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (existing) {
    return Response.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(password);
  const p = buildPlaceholderProfile();

  const inserted = await context.env.DB.prepare(
    `INSERT INTO users
      (last_name, first_name, last_name_romaji, first_name_romaji, email, password_hash, password_salt,
       faculty_type, university, university_category, industry_first, industry_second, industry_third,
       desired_occupations, graduation_year, graduation_month, terms_agreed_at, scout_consent, mbti,
       is_profile_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 0)
     RETURNING id`
  )
    .bind(
      p.lastName,
      p.firstName,
      p.lastNameRomaji,
      p.firstNameRomaji,
      email,
      hash,
      salt,
      p.facultyType,
      p.university,
      p.universityCategory,
      p.industryFirst,
      p.industrySecond,
      p.industryThird,
      p.desiredOccupationsJson,
      p.graduationYear,
      p.graduationMonth,
      isScoutConsent ? 1 : 0,
      null
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

  if (!inserted) {
    return Response.json({ error: "登録に失敗しました" }, { status: 500 });
  }

  const token = await createSession(context.env.DB, "user", inserted.id);

  return new Response(JSON.stringify({ ok: true, name: `${p.lastName} ${p.firstName}` }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookieHeader("user", token),
    },
  });
};
