import { hashPassword } from "../_lib/password";
import { SITE_NAME, SITE_URL } from "../../src/lib/site";

interface Env {
  DB: D1Database;
  // Cloudflare Email Sending用のAPIトークン（Account > Email Sending > Edit 権限）。
  // Pages Functionsは send_email バインディングに対応していないため、REST API経由で送信する。
  EMAIL_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
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

async function sendOtpEmail(env: Env, email: string, otp: string): Promise<void> {
  // デバッグ用: キーが環境に存在するかのみを出力する（トークン文字列自体は絶対に出力しない）。
  console.log(
    "[forgot-password] EMAIL_API_TOKEN present:",
    Boolean(env.EMAIL_API_TOKEN),
    "CLOUDFLARE_ACCOUNT_ID present:",
    Boolean(env.CLOUDFLARE_ACCOUNT_ID)
  );

  if (!env.EMAIL_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    console.error("EMAIL_API_TOKEN / CLOUDFLARE_ACCOUNT_ID is not configured");
    return;
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        from: { address: FROM_ADDRESS, name: "Webテストナビ" },
        subject: "【Webテストナビ】パスワード再設定用のワンタイムパスワード",
        text: `パスワード再設定用のワンタイムパスワードは ${otp} です。\n有効期限は発行から${OTP_TTL_MINUTES}分間です。\n心当たりがない場合はこのメールを破棄してください。`,
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0 16px;">
  <img src="${SITE_URL}/email-logo.png" width="48" height="48" alt="${SITE_NAME}" style="display:block;border-radius:10px;">
  <div style="margin-top:8px;font-family:sans-serif;font-size:14px;font-weight:bold;color:#3730a3;">${SITE_NAME}</div>
</td></tr></table>
<p>パスワード再設定用のワンタイムパスワードは <strong>${otp}</strong> です。</p><p>有効期限は発行から${OTP_TTL_MINUTES}分間です。</p><p>心当たりがない場合はこのメールを破棄してください。</p>`,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Email Sending API request failed", res.status, body);
  }
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
    await sendOtpEmail(context.env, email, otp);
  } catch (err) {
    console.error("Failed to send password reset email", err);
  }

  return Response.json(genericMessage);
};
