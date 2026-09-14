import { decodePendingSignup, getCookie, PENDING_SIGNUP_COOKIE_NAME } from "../../_lib/linePendingSignup";

// /auth/line-signup（会員登録確認画面）が表示直後に呼ぶ。
// functions/api/auth/line-callback.ts が発行したline_pending_signup Cookieの中身を返す。
// emailがnullの場合、画面側はメールアドレス入力欄を表示するフォールバックUIに切り替える
// （LINEログインはメールアドレス取得にチャネル側の許可申請が必要なため、取得できないことがある）。
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const raw = getCookie(context.request, PENDING_SIGNUP_COOKIE_NAME);
  const pending = raw ? decodePendingSignup(raw) : null;
  if (!pending) {
    return Response.json({ error: "LINEログインの情報が見つかりません" }, { status: 404 });
  }
  return Response.json({ email: pending.email, name: pending.name });
};
