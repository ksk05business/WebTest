import { generateInitialPassword, hashPassword } from "../../_lib/password";
import { buildPlaceholderProfile } from "../../_lib/placeholderProfile";
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
  // LINEからメールアドレスを取得できなかった場合のみ、/auth/line-signup側の入力欄から送られる。
  // pending.emailがある場合はこちらの値は無視し、常にLINE側で検証済みのメールアドレスを使う
  // （auth-sessionsスキルのIDOR対策の教訓通り、信頼できるのはサーバー側で検証済みの値のみ）。
  email?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// /auth/line-signup（会員登録確認画面）からの送信を受けて、既存ユーザーへのログイン、または
// 新規アカウントの作成を行う。functions/api/auth/google-signup.tsと同じ枠組み
// （buildPlaceholderProfileで大学・志望業界等を仮値埋め、is_profile_completed=0で作成）だが、
// LINEはメールアドレスが取得できない場合があるため、その場合は本人が入力したメールアドレスを
// 使って既存ユーザーの検索・新規作成の両方を行う（結果的に、既存ユーザーが自分のメール
// アドレスを入力すれば、この経路でも既存アカウントへの紐付け（ログイン）が成立する）。
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

  let email = pending.email;
  if (!email) {
    if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
      return Response.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    }
    email = body.email.trim();
  }

  if (body.agreedTerms !== true) {
    return Response.json({ error: "利用規約・プライバシーポリシーへの同意が必要です" }, { status: 400 });
  }
  const isScoutConsent = body.scoutConsent === true;

  // 同意画面表示中に別タブ等で既に登録済みになっていた場合や、本人がメールアドレス入力欄に
  // 既存アカウントのメールアドレスを入力した場合は、新規作成ではなくログインとして扱う。
  const existing = await context.env.DB.prepare("SELECT id, last_name, first_name FROM users WHERE email = ?")
    .bind(email)
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

  // LINEの表示名は姓名に分かれていない1つの文字列（ニックネームであることも多い）ため、
  // 名前欄にそのまま入れ、苗字・アルファベット表記は共通のプレースホルダーのままにする。
  const p = buildPlaceholderProfile({ firstName: pending.name });

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
