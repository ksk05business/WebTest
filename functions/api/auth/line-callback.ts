import { createSession, sessionCookieHeader } from "../../_lib/session";
import { encodePendingSignup, getCookie, pendingSignupCookieHeader } from "../../_lib/linePendingSignup";

// LINEからの認可コールバック。functions/api/auth/line.ts が発行したstate・nonceを照合し、
// authorization codeをアクセストークン＋ID Tokenに交換する。LINEはGoogleと異なり、
// メールアドレスの取得にはチャネル側でLINE Developersコンソールからの許可申請・承認が
// 必要（未承認の場合はそもそもemailスコープの要求時点でエラーになりうる）。そのため
// メールアドレスが取得できたかどうかに関わらず処理を続行し、取得できなかった場合は
// /auth/line-signup（会員登録確認画面）側でメールアドレス入力欄を表示するフォールバックに
// 委ねる（要件4）。メールアドレスが取得できた場合は既存ユーザーへの自動紐付け（ログイン）を
// 試み、取得できなかった場合は/auth/line-signupで本人が入力したメールアドレスをもとに
// functions/api/auth/line-signup.ts側で同様の紐付けを行う。
interface Env {
  DB: D1Database;
  LINE_CLIENT_ID?: string;
  LINE_CLIENT_SECRET?: string;
}

const STATE_COOKIE_NAME = "line_oauth_state";
const NONCE_COOKIE_NAME = "line_oauth_nonce";
const CLEAR_STATE_COOKIE = `${STATE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
const CLEAR_NONCE_COOKIE = `${NONCE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

function redirectToLogin(origin: string, error: string): Response {
  const headers = new Headers({ Location: `${origin}/login?error=${encodeURIComponent(error)}` });
  headers.append("Set-Cookie", CLEAR_STATE_COOKIE);
  headers.append("Set-Cookie", CLEAR_NONCE_COOKIE);
  return new Response(null, { status: 302, headers });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const origin = url.origin;

  if (url.searchParams.get("error")) {
    return redirectToLogin(origin, "line_oauth_denied");
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = getCookie(context.request, STATE_COOKIE_NAME);
  const savedNonce = getCookie(context.request, NONCE_COOKIE_NAME);

  if (!code || !returnedState || !savedState || returnedState !== savedState || !savedNonce) {
    return redirectToLogin(origin, "line_oauth_state");
  }

  const clientId = context.env.LINE_CLIENT_ID;
  const clientSecret = context.env.LINE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectToLogin(origin, "line_oauth_config");
  }

  const redirectUri = `${origin}/api/auth/line-callback`;

  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
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
    return redirectToLogin(origin, "line_oauth_failed");
  }

  const tokenData = await tokenRes.json<{ id_token?: string }>();
  if (!tokenData.id_token) {
    return redirectToLogin(origin, "line_oauth_failed");
  }

  // LINEはID Token（JWT）自体をこちらで署名検証する代わりに、LINE側の検証エンドポイントに
  // id_tokenを渡してデコード済みのクレームを受け取れる（/oauth2/v2.1/verify）。
  // 自前でJWT署名検証ライブラリを持ち込まずに済み、nonceの一致もこのレスポンスで確認できる。
  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: tokenData.id_token, client_id: clientId }),
  });

  if (!verifyRes.ok) {
    return redirectToLogin(origin, "line_oauth_failed");
  }

  const claims = await verifyRes.json<{ sub?: string; email?: string; name?: string; nonce?: string }>();
  if (!claims.sub || claims.nonce !== savedNonce) {
    return redirectToLogin(origin, "line_oauth_state");
  }

  const email = claims.email ?? null;
  const name = claims.name ?? "";

  if (email) {
    const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first<{ id: number }>();

    if (user) {
      const token = await createSession(context.env.DB, "user", user.id);
      const headers = new Headers({ Location: `${origin}/auth/callback` });
      headers.append("Set-Cookie", sessionCookieHeader("user", token));
      headers.append("Set-Cookie", CLEAR_STATE_COOKIE);
      headers.append("Set-Cookie", CLEAR_NONCE_COOKIE);
      return new Response(null, { status: 302, headers });
    }
  }

  const pendingValue = encodePendingSignup({ lineUserId: claims.sub, email, name });
  const headers = new Headers({ Location: `${origin}/auth/line-signup` });
  headers.append("Set-Cookie", pendingSignupCookieHeader(pendingValue));
  headers.append("Set-Cookie", CLEAR_STATE_COOKIE);
  headers.append("Set-Cookie", CLEAR_NONCE_COOKIE);
  return new Response(null, { status: 302, headers });
};
