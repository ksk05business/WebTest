import { checkAdminAuth } from "../../_lib/adminAuth";
import { type CompanyBorderInput, validateCompanyBorder } from "../../_lib/companyBorderValidation";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

interface CompanyBorderRow {
  id: number;
  company_name: string;
  company_name_kana: string;
  industry: string;
  test_type: string;
  border_level: string;
  selection_timing: string;
  description: string;
  has_english: number;
  has_structural: number;
  created_at: string;
}

function toAdminCompanyBorder(row: CompanyBorderRow) {
  return {
    id: row.id,
    companyName: row.company_name,
    companyNameKana: row.company_name_kana,
    industry: row.industry,
    testType: row.test_type,
    borderLevel: row.border_level,
    selectionTiming: row.selection_timing,
    description: row.description,
    hasEnglish: row.has_english === 1,
    hasStructural: row.has_structural === 1,
    createdAt: row.created_at,
  };
}

// /admin/dashboard「ボーダー企業管理」タブ用の一覧取得API。公開API（/api/company-borders）とは
// 異なり検査種別未設定（空欄）の企業も含め全件を対象にでき、企業名・ふりがなの部分一致検索、
// 業界フィルタ、「検査種別未設定のみ」フィルタに対応する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;

  const params = new URL(context.request.url).searchParams;
  const search = params.get("search")?.trim();
  const industry = params.get("industry")?.trim();
  const incompleteOnly = params.get("incompleteOnly") === "true";

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (search) {
    conditions.push("(company_name LIKE ? OR company_name_kana LIKE ?)");
    binds.push(`%${search}%`, `%${search}%`);
  }
  if (industry) {
    conditions.push("industry = ?");
    binds.push(industry);
  }
  if (incompleteOnly) {
    conditions.push("test_type = ''");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await context.env.DB.prepare(
    `SELECT id, company_name, company_name_kana, industry, test_type, border_level, selection_timing, description, has_english, has_structural, created_at
     FROM company_borders
     ${whereClause}
     ORDER BY company_name_kana ASC, company_name ASC`
  )
    .bind(...binds)
    .all<CompanyBorderRow>();

  const totalRow = await context.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM company_borders`).first<{
    cnt: number;
  }>();
  const incompleteRow = await context.env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM company_borders WHERE test_type = ''`
  ).first<{ cnt: number }>();

  return Response.json({
    companyBorders: (rows.results ?? []).map(toAdminCompanyBorder),
    total: totalRow?.cnt ?? 0,
    incompleteTotal: incompleteRow?.cnt ?? 0,
  });
};

// 企業ボーダー情報の新規登録API。x-admin-tokenヘッダー必須。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;

  let body: CompanyBorderInput;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const result = validateCompanyBorder(body, "body");
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const row = await context.env.DB.prepare(
    `INSERT INTO company_borders
      (company_name, company_name_kana, industry, test_type, border_level, selection_timing, description, has_english, has_structural)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`
  )
    .bind(
      result.companyName,
      result.companyNameKana,
      result.industry,
      result.testType,
      result.borderLevel,
      result.selectionTiming,
      result.description,
      result.hasEnglish,
      result.hasStructural
    )
    .first<{ id: number }>();

  return Response.json({ ok: true, id: row?.id });
};
