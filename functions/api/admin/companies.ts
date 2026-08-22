import { generateInitialPassword, hashPassword } from "../../_lib/password";
import { checkAdminAuth } from "../../_lib/adminAuth";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

type CompanyApplicationRow = {
  id: number;
  company_name: string;
  contact_name: string;
  department: string | null;
  job_title: string | null;
  email: string;
  phone_number: string | null;
  corporate_site_url: string | null;
  account_type: string;
  inquiry_message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
};

// 審査申請の一覧取得。?status= で絞り込み可能（デフォルトは全件）。管理API共通のx-admin-token認証。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const status = new URL(context.request.url).searchParams.get("status");

  const conditions: string[] = [];
  const binds: string[] = [];
  if (status) {
    conditions.push("status = ?");
    binds.push(status);
  }

  const rows = await context.env.DB.prepare(
    `SELECT id, company_name, contact_name, department, job_title, email, phone_number,
            corporate_site_url, account_type, inquiry_message, status, created_at, reviewed_at
     FROM company_profiles
     ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY created_at DESC`
  )
    .bind(...binds)
    .all<CompanyApplicationRow>();

  return Response.json({
    companies: (rows.results ?? []).map((r) => ({
      id: r.id,
      companyName: r.company_name,
      contactName: r.contact_name,
      department: r.department,
      jobTitle: r.job_title,
      email: r.email,
      phoneNumber: r.phone_number,
      corporateSiteUrl: r.corporate_site_url,
      accountType: r.account_type,
      inquiryMessage: r.inquiry_message,
      status: r.status,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
    })),
  });
};

type ReviewBody = {
  companyId?: unknown;
  action?: unknown;
};

// 審査申請の承認/却下。承認時のみ初期パスワードを新規発行してレスポンスに含める（一度きり、この応答以外には残さない）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  let body: ReviewBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { companyId, action } = body;
  if (typeof companyId !== "number" || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const company = await context.env.DB.prepare(
    "SELECT id, email, status FROM company_profiles WHERE id = ?"
  )
    .bind(companyId)
    .first<{ id: number; email: string; status: string }>();

  if (!company) {
    return Response.json({ error: "申請が見つかりません" }, { status: 404 });
  }
  if (company.status !== "pending") {
    return Response.json({ error: "この申請は既に審査済みです" }, { status: 409 });
  }

  if (action === "reject") {
    await context.env.DB.prepare(
      "UPDATE company_profiles SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ?"
    )
      .bind(companyId)
      .run();
    return Response.json({ ok: true, status: "rejected" });
  }

  const initialPassword = generateInitialPassword();
  const { hash, salt } = await hashPassword(initialPassword);

  await context.env.DB.prepare(
    `UPDATE company_profiles
     SET status = 'active', password_hash = ?, password_salt = ?, reviewed_at = datetime('now')
     WHERE id = ?`
  )
    .bind(hash, salt, companyId)
    .run();

  return Response.json({
    ok: true,
    status: "active",
    email: company.email,
    initialPassword,
  });
};
