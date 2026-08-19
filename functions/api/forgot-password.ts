import { hashPassword } from "../_lib/password";

interface Env {
  DB: D1Database;
  EMAIL: SendEmail;
}

const OTP_TTL_MINUTES = 10;
const FROM_ADDRESS = "noreply@shukatsu-webtest.com";

type ForgotPasswordBody = {
  email?: unknown;
};

function generateOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return n.toString().padStart(6, "0");
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ForgotPasswordBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email } = body;
  if (typeof email !== "string" || !email.trim()) {
    return Response.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }

  const genericMessage = {
    ok: true,
    message: "このメールアドレスが登録されている場合、ワンタイムパスワードを送信しました。",
  };

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first();
  if (!user) {
    return Response.json(genericMessage);
  }

  const otp = generateOtp();
  const { hash, salt } = await hashPassword(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  await context.env.DB.prepare(
    `UPDATE users SET reset_otp_hash = ?, reset_otp_salt = ?, reset_otp_expires_at = ? WHERE email = ?`
  )
    .bind(hash, salt, expiresAt, email)
    .run();

  try {
    await context.env.EMAIL.send({
      to: email,
      from: { email: FROM_ADDRESS, name: "SPIナビ" },
      subject: "【SPIナビ】パスワード再設定用のワンタイムパスワード",
      text: `パスワード再設定用のワンタイムパスワードは ${otp} です。\n有効期限は発行から${OTP_TTL_MINUTES}分間です。\n心当たりがない場合はこのメールを破棄してください。`,
      html: `<p>パスワード再設定用のワンタイムパスワードは <strong>${otp}</strong> です。</p><p>有効期限は発行から${OTP_TTL_MINUTES}分間です。</p><p>心当たりがない場合はこのメールを破棄してください。</p>`,
    });
  } catch (err) {
    console.error("Failed to send password reset email", err);
  }

  return Response.json(genericMessage);
};
