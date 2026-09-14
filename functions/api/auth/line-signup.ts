import { generateInitialPassword, hashPassword } from "../../_lib/password";
import { buildSocialPlaceholderProfile } from "../../_lib/placeholderProfile";
import { buildLinePlaceholderEmail } from "../../_lib/linePlaceholderEmail";
import { createSession, sessionCookieHeader } from "../../_lib/session";
import {
  CLEAR_PENDING_SIGNUP_COOKIE,
  PENDING_SIGNUP_COOKIE_NAME,
  decodePendingSignup,
  getCookie,
} from "../../_lib/linePendingSignup";

interface Env {
  DB: D1Database;
}

type PostBody = {
  agreedTerms?: unknown;
  scoutConsent?: unknown;
};

// /auth/line-signup（会員登録確認画面）からの送信を受けて、既存ユーザーへのログイン、または
// 新規アカウントの作成を行う。functions/api/auth/google-signup.tsと同じ枠組み
// （buildSocialPlaceholderProfileで氏名・大学・志望業界等を仮値埋め、is_profile_completed=0で
// 作成）だが、LINEはメールアドレスが取得できた場合でもそれをそのまま保存せず、常に
// buildLinePlaceholderEmailによるダミーアドレスで新規作成する（本人がマイページで実際の
// メールアドレスを入力するまでは「未登録」として扱う）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const pendingRaw = getCookie(context.request, PENDING_SIGNUP_COOKIE_NAME);
  const pending = pendingRaw ? decodePendingSignup(pendingRaw) : null;
  if (!pending) {
    return Response.json(
      { error: "LINEログインの情報が見つかりません。もう一度LINEでログインしてください。" },
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

  // LINEがメールアドレスを返した場合に限り、既存アカウントへの自動紐付け（ログイン）を試みる
  // （これはDBへの保存ではなく、LINE側で検証済みのメールアドレスによる読み取り専用の照合）。
  // 同意画面表示中に別タブ等で既に登録済みになっていた場合もこの経路でログインとして扱う。
  if (pending.email) {
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
  }

  // LINEのプロフィール情報（氏名・メールアドレス）は保存しない。本人がマイページで入力する。
  const p = buildSocialPlaceholderProfile();
  const email = buildLinePlaceholderEmail(pending.lineUserId);

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
