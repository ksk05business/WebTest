import { createSession, sessionCookieHeader } from "../../_lib/session";
import { encodePendingSignup, getCookie, pendingSignupCookieHeader } from "../../_lib/googlePendingSignup";

// Googleからの認可コールバック。functions/api/auth/google.ts が発行したstateを照合し、
// authorization codeをアクセストークンに交換してユーザー情報（email）を取得する。
// メールアドレスが一致する既存ユーザーがいればそのままログインさせる。
// 未登録の場合、このアプリの新規登録は大学・志望業界等の必須プロフィール項目・利用規約への
// 明示的な同意を伴うため、Googleの情報だけでは新規アカウントを作成できない。そのため
// email/name等を短命なHttpOnly Cookie（google_pending_signup）に一時保存したうえで
// /auth/google-signup（利用規約への同意画面）へ渡し、同意後にfunctions/api/auth/google-signup.ts が
// 実際のアカウント作成を行う。
interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

const STATE_COOKIE_NAME = "google_oauth_state";
const CLEAR_STATE_COOKIE = `${STATE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

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

  const profile = await userInfoRes.json<{
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
  }>();
  if (!profile.email || !profile.email_verified) {
    return redirectToLogin(origin, "oauth_unverified", CLEAR_STATE_COOKIE);
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(profile.email)
    .first<{ id: number }>();

  if (!user) {
    const pendingValue = encodePendingSignup({
      email: profile.email,
      givenName: profile.given_name ?? "",
      familyName: profile.family_name ?? "",
    });
    const headers = new Headers({ Location: `${origin}/auth/google-signup` });
    headers.append("Set-Cookie", pendingSignupCookieHeader(pendingValue));
    headers.append("Set-Cookie", CLEAR_STATE_COOKIE);
    return new Response(null, { status: 302, headers });
  }

  const token = await createSession(context.env.DB, "user", user.id);

  // 2つのSet-Cookie（セッション発行＋stateクリア）を1レスポンスで返すためheadersに個別追加する
  // （同名でないヘッダーの複数値追加はappend、Headersコンストラクタでは1つしか設定できないため）。
  const headers = new Headers({ Location: `${origin}/auth/callback` });
  headers.append("Set-Cookie", sessionCookieHeader("user", token));
  headers.append("Set-Cookie", CLEAR_STATE_COOKIE);

  return new Response(null, { status: 302, headers });
};
