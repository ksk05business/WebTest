// LINEログインの起点。/login・/register の「LINEでログイン/登録」ボタンから通常のページ遷移
// （<a href>）で呼ばれ、LINEの認可画面へリダイレクトする。functions/api/auth/google.tsと同じ
// 構成（フラットなファイル名、functions/api/auth/配下での同名ファイル・ディレクトリ共存回避）。
// コールバックはfunctions/api/auth/line-callback.ts。
interface Env {
  LINE_CLIENT_ID?: string;
}

const LINE_AUTH_ENDPOINT = "https://access.line.me/oauth2/v2.1/authorize";
const STATE_COOKIE_NAME = "line_oauth_state";
const NONCE_COOKIE_NAME = "line_oauth_nonce";

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clientId = context.env.LINE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "LINEログインが設定されていません" }, { status: 503 });
  }

  const state = randomToken();
  // nonceはOpenID ConnectのID Token（LINEのオプショナルemailスコープを含む本人情報の
  // 取得元）が正しくこの認可リクエストに対応する応答かを検証するための値。stateとは別に必要。
  const nonce = randomToken();

  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/api/auth/line-callback`;

  const authUrl = new URL(LINE_AUTH_ENDPOINT);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  // emailスコープはLINE Developersコンソールでチャネルにメールアドレス取得の許可申請が
  // 承認されていないと使えない（未承認の場合、LINE側の認可画面でエラーになる）。
  // 申請が下りていないチャネルでも致命的にならないよう、メールアドレスが取得できない場合は
  // functions/api/auth/line-callback.ts側で/auth/line-signupのメールアドレス入力
  // フォールバックへ誘導する設計にしている。
  authUrl.searchParams.set("scope", "profile openid email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("nonce", nonce);

  const headers = new Headers({ Location: authUrl.toString() });
  headers.append(
    "Set-Cookie",
    `${STATE_COOKIE_NAME}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );
  headers.append(
    "Set-Cookie",
    `${NONCE_COOKIE_NAME}=${nonce}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  return new Response(null, { status: 302, headers });
};
