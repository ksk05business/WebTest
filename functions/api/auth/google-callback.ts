import { createSession, sessionCookieHeader } from "../../_lib/session";

// Googleからの認可コールバック。functions/api/auth/google.ts が発行したstateを照合し、
// authorization codeをアクセストークンに交換してユーザー情報（email）を取得する。
// このアプリの新規登録は大学・志望業界等の必須プロフィール項目を伴うため、Googleの情報だけでは
// 新規アカウントを作成できない。そのため対象はメールアドレスが一致する既存ユーザーのログインのみとし、
// 未登録のメールアドレスの場合は/loginへエラー付きで戻す（会員登録は従来通りメール+パスワードで行う）。
interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

const STATE_COOKIE_NAME = "google_oauth_state";
const CLEAR_STATE_COOKIE = `${STATE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function redirectToLogin(origin: string, error: string, extraCookie: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/login?error=${encodeURIComponent(error)}`,
      "Set-Cookie": extraCookie,
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const origin = url.origin;

  if (url.searchParams.get("error")) {
    return redirectToLogin(origin, "oauth_denied", CLEAR_STATE_COOKIE);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = getCookie(context.request, STATE_COOKIE_NAME);

  if (!code || !returnedState || !savedState || returnedState !== savedState) {
    return redirectToLogin(origin, "oauth_state", CLEAR_STATE_COOKIE);
  }

  const clientId = context.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin(origin, "oauth_config", CLEAR_STATE_COOKIE);
  }

  const redirectUri = `${origin}/api/auth/google-callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return redirectToLogin(origin, "oauth_failed", CLEAR_STATE_COOKIE);
  }

  const tokenData = await tokenRes.json<{ access_token?: string }>();
  if (!tokenData.access_token) {
    return redirectToLogin(origin, "oauth_failed", CLEAR_STATE_COOKIE);
  }

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userInfoRes.ok) {
    return redirectToLogin(origin, "oauth_failed", CLEAR_STATE_COOKIE);
  }

  const profile = await userInfoRes.json<{ email?: string; email_verified?: boolean }>();
  if (!profile.email || !profile.email_verified) {
    return redirectToLogin(origin, "oauth_unverified", CLEAR_STATE_COOKIE);
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(profile.email)
    .first<{ id: number }>();

  if (!user) {
    return redirectToLogin(origin, "no_account", CLEAR_STATE_COOKIE);
  }

  const token = await createSession(context.env.DB, "user", user.id);

  // 2つのSet-Cookie（セッション発行＋stateクリア）を1レスポンスで返すためheadersに個別追加する
  // （同名でないヘッダーの複数値追加はappend、Headersコンストラクタでは1つしか設定できないため）。
  const headers = new Headers({ Location: `${origin}/auth/callback` });
  headers.append("Set-Cookie", sessionCookieHeader("user", token));
  headers.append("Set-Cookie", CLEAR_STATE_COOKIE);

  return new Response(null, { status: 302, headers });
};
