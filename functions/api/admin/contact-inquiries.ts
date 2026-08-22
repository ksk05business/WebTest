import { checkAdminAuth } from "../../_lib/adminAuth";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

const VALID_STATUS = ["unhandled", "handled"] as const;

type ContactInquiryRow = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

// お問い合わせ一覧取得。?status= で絞り込み可能（デフォルトは全件）。
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
    `SELECT id, name, email, message, status, created_at
     FROM contact_inquiries
     ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY created_at DESC`
  )
    .bind(...binds)
    .all<ContactInquiryRow>();

  return Response.json({
    inquiries: (rows.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    })),
  });
};

type UpdateBody = {
  id?: unknown;
  status?: unknown;
};

// 対応ステータスの更新（未対応 <-> 対応済み）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  let body: UpdateBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { id, status } = body;
  if (
    typeof id !== "number" ||
    typeof status !== "string" ||
    !(VALID_STATUS as readonly string[]).includes(status)
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const result = await context.env.DB.prepare(
    "UPDATE contact_inquiries SET status = ? WHERE id = ?"
  )
    .bind(status, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({ error: "お問い合わせが見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, status });
};
