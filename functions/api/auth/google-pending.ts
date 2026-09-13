import { decodePendingSignup, getCookie, PENDING_SIGNUP_COOKIE_NAME } from "../../_lib/googlePendingSignup";

// /auth/google-signup（利用規約への同意画面）が表示直後に呼ぶ。
// functions/api/auth/google-callback.ts が発行したgoogle_pending_signup Cookieの中身
// （メールアドレス・氏名の断片）を返す。Cookieが無い/期限切れの場合はエラーを返し、
// 画面側は「もう一度Googleでログインしてください」と案内する。
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const raw = getCookie(context.request, PENDING_SIGNUP_COOKIE_NAME);
  const pending = raw ? decodePendingSignup(raw) : null;
  if (!pending) {
    return Response.json({ error: "Googleログインの情報が見つかりません" }, { status: 404 });
  }
  return Response.json({ email: pending.email, givenName: pending.givenName, familyName: pending.familyName });
};
