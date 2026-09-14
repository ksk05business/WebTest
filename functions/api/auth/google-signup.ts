import { generateInitialPassword, hashPassword } from "../../_lib/password";
import { buildSocialPlaceholderProfile } from "../../_lib/placeholderProfile";
import { createSession, sessionCookieHeader } from "../../_lib/session";
import {
  CLEAR_PENDING_SIGNUP_COOKIE,
  PENDING_SIGNUP_COOKIE_NAME,
  decodePendingSignup,
  getCookie,
} from "../../_lib/googlePendingSignup";

interface Env {
  DB: D1Database;
}

type PostBody = {
  agreedTerms?: unknown;
  scoutConsent?: unknown;
};

// /auth/google-signup（利用規約への同意画面）からの送信を受けて実際にアカウントを作成する。
// メールアドレスは常にgoogle_pending_signup Cookie（サーバー側で発行・検証済み）から取り、
// リクエストボディの値は信用しない（auth-sessionsスキルのIDOR対策の教訓を踏襲）。
//
// 大学・志望業界・卒業年月など、Googleのプロフィール情報だけでは埋められない必須項目は
// 明確にプレースホルダーだとわかる値で仮登録し、本人が/mypageで後から更新する前提とする
// （新しいDBカラムやNULL許容化は行わず、既存スキーマ・既存バリデーションの範囲で完結させる）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const pendingRaw = getCookie(context.request, PENDING_SIGNUP_COOKIE_NAME);
  const pending = pendingRaw ? decodePendingSignup(pendingRaw) : null;
  if (!pending) {
    return Response.json(
      { error: "Googleログインの情報が見つかりません。もう一度Googleでログインしてください。" },
      { status: 401 }
    );
  }

  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (body.agreedTerms !== true) {
    return Response.json({ error: "利用規約・プライバシーポリシーへの同意が必要です" }, { status: 400 });
  }
  const isScoutConsent = body.scoutConsent === true;

  // 同意画面表示中に別タブ等で既に登録済みになっていた場合は、新規作成ではなくログインとして扱う。
  const existing = await context.env.DB.prepare("SELECT id, last_name, first_name FROM users WHERE email = ?")
    .bind(pending.email)
    .first<{ id: number; last_name: string; first_name: string }>();

  if (existing) {
    const token = await createSession(context.env.DB, "user", existing.id);
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", sessionCookieHeader("user", token));
    headers.append("Set-Cookie", CLEAR_PENDING_SIGNUP_COOKIE);
    return new Response(
      JSON.stringify({ ok: true, name: `${existing.last_name} ${existing.first_name}` }),
      { headers }
    );
  }

  // Googleのプロフィール情報（氏名）は保存しない。本人がマイページで入力する。
  const p = buildSocialPlaceholderProfile();

  const { hash, salt } = await hashPassword(generateInitialPassword());

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
      pending.email,
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

  if (!inserted) {
    return Response.json({ error: "登録に失敗しました" }, { status: 500 });
  }

  const events = [["terms", 1]] as const;
  for (const [type, granted] of isScoutConsent ? [...events, ["scout", 1] as const] : events) {
    await context.env.DB.prepare(
      `INSERT INTO consent_events (user_id, consent_type, granted) VALUES (?, ?, ?)`
    )
      .bind(inserted.id, type, granted)
      .run();
  }

  const token = await createSession(context.env.DB, "user", inserted.id);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", sessionCookieHeader("user", token));
  headers.append("Set-Cookie", CLEAR_PENDING_SIGNUP_COOKIE);

  return new Response(JSON.stringify({ ok: true, name: `${p.lastName} ${p.firstName}` }), { headers });
};
