// Googleログインで未登録メールアドレスだった場合、利用規約への同意画面
// （/auth/google-signup）に遷移する間だけ、Googleから取得したプロフィールの断片を
// 保持するための短命なHttpOnly Cookie。メールアドレスを一時的とはいえサーバー側の
// 真実の情報源として扱うため、クライアントに読み書きさせずCookie（署名は行わないが
// HttpOnly+Secure+短いTTLで十分とする。値自体を機密情報として扱う必要は無い）で受け渡す。
export const PENDING_SIGNUP_COOKIE_NAME = "google_pending_signup";
const PENDING_SIGNUP_TTL_SECONDS = 600;

export type PendingGoogleSignup = {
  email: string;
  givenName: string;
  familyName: string;
};

export function encodePendingSignup(data: PendingGoogleSignup): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodePendingSignup(value: string): PendingGoogleSignup | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(value)));
    if (typeof parsed?.email === "string") {
      return {
        email: parsed.email,
        givenName: typeof parsed.givenName === "string" ? parsed.givenName : "",
        familyName: typeof parsed.familyName === "string" ? parsed.familyName : "",
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
