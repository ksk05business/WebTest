import { isFreeEmailDomain } from "../../_lib/freeEmailDomains";

interface Env {
  DB: D1Database;
}

type ApplyBody = {
  companyName?: unknown;
  contactName?: unknown;
  department?: unknown;
  jobTitle?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  corporateSiteUrl?: unknown;
  accountType?: unknown;
  inquiryMessage?: unknown;
};

const ACCOUNT_TYPES = ["direct_hire", "agency"] as const;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// 直接採用企業向けの利用審査申請。未ログインの公開エンドポイント。
// accountType='agency'（人材紹介・エージェント事業者）の申請自体は受け付けるが、原則利用不可のため
// 管理画面側（CompanyManagementPanel）で警告バッジを表示し、審査担当者の却下判断を促す。
// 送信時点ではアカウントは status='pending' で作成され、管理者が承認するまでログイン・スカウト機能は一切使えない
// （password_hash/password_saltは承認時まで空文字のプレースホルダー）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ApplyBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    companyName,
    contactName,
    department,
    jobTitle,
    email,
    phoneNumber,
    corporateSiteUrl,
    accountType,
    inquiryMessage,
  } = body;

  if (
    typeof companyName !== "string" ||
    !companyName.trim() ||
    typeof contactName !== "string" ||
    !contactName.trim() ||
    typeof department !== "string" ||
    !department.trim() ||
    typeof jobTitle !== "string" ||
    !jobTitle.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof phoneNumber !== "string" ||
    !phoneNumber.trim() ||
    typeof corporateSiteUrl !== "string" ||
    !corporateSiteUrl.trim() ||
    typeof accountType !== "string" ||
    !(ACCOUNT_TYPES as readonly string[]).includes(accountType) ||
    (inquiryMessage !== undefined && inquiryMessage !== null && typeof inquiryMessage !== "string")
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  if (isFreeEmailDomain(email.trim())) {
    return Response.json(
      { error: "フリーメール（Gmail・Yahoo!メール等）はご利用いただけません。会社用のメールアドレスをご入力ください。" },
      { status: 400 }
    );
  }
  if (!isValidUrl(corporateSiteUrl.trim())) {
    return Response.json(
      { error: "コーポレートサイトURLの形式が正しくありません（http(s)://から入力してください）" },
      { status: 400 }
    );
  }

  const existing = await context.env.DB.prepare("SELECT id FROM company_profiles WHERE email = ?")
    .bind(email.trim())
    .first();
  if (existing) {
    return Response.json(
      { error: "このメールアドレスは既にお申し込み済みです" },
      { status: 409 }
    );
  }

  await context.env.DB.prepare(
    `INSERT INTO company_profiles
      (company_name, contact_name, department, job_title, email, phone_number, corporate_site_url,
       account_type, inquiry_message, password_hash, password_salt, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', 'pending')`
  )
    .bind(
      companyName.trim(),
      contactName.trim(),
      department.trim(),
      jobTitle.trim(),
      email.trim(),
      phoneNumber.trim(),
      corporateSiteUrl.trim(),
      accountType,
      typeof inquiryMessage === "string" && inquiryMessage.trim() ? inquiryMessage.trim() : null
    )
    .run();

  return Response.json({ ok: true });
};
