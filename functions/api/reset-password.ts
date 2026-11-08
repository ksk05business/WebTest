import { enforceRateLimit } from "../_lib/rateLimit";
import { hashPassword, verifyPassword } from "../_lib/password";

interface Env {
  DB: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
}

type ResetPasswordBody = {
  email?: unknown;
  otp?: unknown;
  newPassword?: unknown;
};

type OtpRow = {
  reset_otp_hash: string | null;
  reset_otp_salt: string | null;
  reset_otp_expires_at: string | null;
};

const GENERIC_ERROR = "コードが正しくないか、有効期限が切れています。もう一度やり直してください。";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const limited = await enforceRateLimit(context.env.RATE_LIMIT_KV, context.request, "reset-password", 10, 3600);
  if (limited) return limited;

  let body: ResetPasswordBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, otp, newPassword } = body;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof otp !== "string" ||
    !otp.trim() ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    return Response.json({ error: "入力内容を確認してください（パスワードは8文字以上）" }, { status: 400 });
  }

  const user = await context.env.DB.prepare(
    "SELECT reset_otp_hash, reset_otp_salt, reset_otp_expires_at FROM users WHERE email = ?"
  )
    .bind(email)
    .first<OtpRow>();

  if (!user || !user.reset_otp_hash || !user.reset_otp_salt || !user.reset_otp_expires_at) {
    return Response.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  if (new Date(user.reset_otp_expires_at).getTime() < Date.now()) {
    return Response.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const valid = await verifyPassword(otp, user.reset_otp_hash, user.reset_otp_salt);
  if (!valid) {
    return Response.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { hash, salt } = await hashPassword(newPassword);

  await context.env.DB.prepare(
    `UPDATE users
     SET password_hash = ?, password_salt = ?, reset_otp_hash = NULL, reset_otp_salt = NULL, reset_otp_expires_at = NULL
     WHERE email = ?`
  )
    .bind(hash, salt, email)
    .run();

  return Response.json({ ok: true });
};
