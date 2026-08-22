import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type ScoutRow = {
  id: number;
  company_name: string;
  title: string;
  message: string | null;
  status: string;
  is_anonymous: number;
  is_read: number;
  created_at: string;
  responded_at: string | null;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await context.env.DB.prepare(
    `SELECT s.id, c.company_name, s.title, s.message, s.status, s.is_anonymous, s.is_read, s.created_at, s.responded_at
     FROM scouts s JOIN company_profiles c ON c.id = s.company_id
     WHERE s.student_id = ?
     ORDER BY s.created_at DESC`
  )
    .bind(userId)
    .all<ScoutRow>();

  return Response.json({
    scouts: (rows.results ?? []).map((r) => ({
      id: r.id,
      companyName: r.company_name,
      title: r.title,
      message: r.message,
      status: r.status,
      isAnonymous: Boolean(r.is_anonymous),
      isRead: Boolean(r.is_read),
      createdAt: r.created_at,
      respondedAt: r.responded_at,
    })),
  });
};

type RespondBody = {
  scoutId?: unknown;
  action?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: RespondBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { scoutId, action } = body;
  if (
    typeof scoutId !== "number" ||
    (action !== "accept" && action !== "decline" && action !== "read")
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const scout = await context.env.DB.prepare(
    "SELECT id, student_id, status, is_read FROM scouts WHERE id = ?"
  )
    .bind(scoutId)
    .first<{ id: number; student_id: number; status: string; is_read: number }>();

  if (!scout || scout.student_id !== userId) {
    return Response.json({ error: "スカウトが見つかりません" }, { status: 404 });
  }

  // 詳細を開いた時点で既読にする。対応済み・未対応どちらでも呼べる（冪等）。
  if (action === "read") {
    if (!scout.is_read) {
      await context.env.DB.prepare("UPDATE scouts SET is_read = 1 WHERE id = ?")
        .bind(scoutId)
        .run();
    }
    return Response.json({ ok: true });
  }

  if (scout.status !== "sent") {
    return Response.json({ error: "このスカウトは既に対応済みです" }, { status: 409 });
  }

  const newStatus = action === "accept" ? "accepted" : "declined";
  // 承諾時のみ is_anonymous を0にし、当該スカウトに限り企業へ実名・連絡先を開示する。
  // 辞退時は is_anonymous を維持し、企業には一切開示しない。
  const isAnonymous = action === "accept" ? 0 : 1;

  await context.env.DB.prepare(
    "UPDATE scouts SET status = ?, is_anonymous = ?, is_read = 1, responded_at = datetime('now') WHERE id = ?"
  )
    .bind(newStatus, isAnonymous, scoutId)
    .run();

  return Response.json({ ok: true, status: newStatus });
};
