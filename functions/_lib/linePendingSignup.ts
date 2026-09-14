// LINEログインで未登録（またはメールアドレスが取得できなかった）だった場合、
// 会員登録確認画面（/auth/line-signup）に遷移する間だけLINEプロフィールの断片を
// 保持するための短命なHttpOnly Cookie。functions/_lib/googlePendingSignup.tsと
// 同じ設計だが、LINEはメールアドレスをemail=nullで表す（LINEログインの応答上でも
// メールアドレス取得の可否が変わるため）ことと、Googleの実装済みフローに影響を与えない
// ことを優先し、あえて共通化せず別ファイルとしている。
export const PENDING_SIGNUP_COOKIE_NAME = "line_pending_signup";
const PENDING_SIGNUP_TTL_SECONDS = 600;

export type PendingLineSignup = {
  lineUserId: string;
  email: string | null;
  name: string;
};

export function encodePendingSignup(data: PendingLineSignup): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodePendingSignup(value: string): PendingLineSignup | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(value)));
    if (typeof parsed?.lineUserId === "string") {
      return {
        lineUserId: parsed.lineUserId,
        email: typeof parsed.email === "string" ? parsed.email : null,
        name: typeof parsed.name === "string" ? parsed.name : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function pendingSignupCookieHeader(value: string): string {
  return `${PENDING_SIGNUP_COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${PENDING_SIGNUP_TTL_SECONDS}`;
}

export const CLEAR_PENDING_SIGNUP_COOKIE = `${PENDING_SIGNUP_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}
