import { enforceRateLimit } from "../../_lib/rateLimit";
import { isFreeEmailDomain } from "../../_lib/freeEmailDomains";

interface Env {
  DB: D1Database;
  RATE_LIMIT_KV?: KVNamespace;
}

type ApplyBody = {
  requestType?: unknown;
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

const REQUEST_TYPES = ["account_apply", "document_request"] as const;
const ACCOUNT_TYPES = ["direct_hire", "agency"] as const;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// 直接採用企業向けの2種類の申し込みを受け付ける、未ログインの公開エンドポイント。
//   requestType='account_apply': 利用審査申請（アカウント発行希望）。承認まではログイン・スカウト機能は使えない
//   （password_hash/password_saltは承認時まで空文字のプレースホルダー）。
//   requestType='document_request': サービス紹介資料請求のみ。アカウントは発行せず、運営が別途資料を送付する。
// accountType='agency'（人材紹介・エージェント事業者）の申請自体は受け付けるが、原則利用不可のため
// 管理画面側（CompanyManagementPanel）で警告バッジを表示し、審査担当者の却下判断を促す。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const limited = await enforceRateLimit(context.env.RATE_LIMIT_KV, context.request, "company-apply", 5, 3600);
  if (limited) return limited;

  let body: ApplyBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const {
    requestType,
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

  const resolvedRequestType = requestType === undefined ? "account_apply" : requestType;
  if (
    typeof resolvedRequestType !== "string" ||
    !(REQUEST_TYPES as readonly string[]).includes(resolvedRequestType)
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }
  const isAccountApply = resolvedRequestType === "account_apply";

  if (
    typeof companyName !== "string" ||
    !companyName.trim() ||
    typeof contactName !== "string" ||
    !contactName.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof phoneNumber !== "string" ||
    !phoneNumber.trim() ||
    typeof corporateSiteUrl !== "string" ||
    !corporateSiteUrl.trim()
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  // 利用審査申請（account_apply）のみ、部署・役職・アカウント種別が必須。資料請求（document_request）では収集しない。
  if (isAccountApply) {
    if (
      typeof department !== "string" ||
      !department.trim() ||
      typeof jobTitle !== "string" ||
      !jobTitle.trim() ||
      typeof accountType !== "string" ||
      !(ACCOUNT_TYPES as readonly string[]).includes(accountType) ||
      (inquiryMessage !== undefined && inquiryMessage !== null && typeof inquiryMessage !== "string")
    ) {
      return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  if (isFreeEmailDomain(email.trim())) {
    return Response.json(
      { error: "会社用のメールアドレス（独自ドメイン）を入力してください" },
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
       account_type, inquiry_message, password_hash, password_salt, request_type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)`
  )
    .bind(
      companyName.trim(),
      contactName.trim(),
      isAccountApply && typeof department === "string" ? department.trim() : null,
      isAccountApply && typeof jobTitle === "string" ? jobTitle.trim() : null,
      email.trim(),
      phoneNumber.trim(),
      corporateSiteUrl.trim(),
      isAccountApply && typeof accountType === "string" ? accountType : "direct_hire",
      isAccountApply && typeof inquiryMessage === "string" && inquiryMessage.trim()
        ? inquiryMessage.trim()
        : null,
      resolvedRequestType,
      isAccountApply ? "pending" : "received"
    )
    .run();

  return Response.json({ ok: true });
};
