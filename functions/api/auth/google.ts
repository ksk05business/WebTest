// Googleログインの起点。/login の「Googleでログイン」ボタンから通常のページ遷移（fetchではなく
// <a href>）で呼ばれ、Googleの認可画面へリダイレクトする。コールバックはfunctions/api/auth/google-callback.ts
// （同じ"google"始まりのファイル名だが、ディレクトリ化はしない。functions/api/配下で
// 同名ベースのファイルとディレクトリを共存させると本番デプロイ後に404になる既知の問題があるため、
// google/callback.ts ではなく google-callback.ts というフラットな名前にしている）。
interface Env {
  GOOGLE_CLIENT_ID?: string;
}

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_COOKIE_NAME = "google_oauth_state";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clientId = context.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "Googleログインが設定されていません" }, { status: 503 });
  }

  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/auth/google-callback`;

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      // stateはCSRF対策の使い捨て値。コールバック側で照合後は不要になるため短命なCookieにする。
      "Set-Cookie": `${STATE_COOKIE_NAME}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
};
