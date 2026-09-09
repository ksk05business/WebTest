interface Env {
  DB: D1Database;
}

interface CompanyBorderRow {
  id: number;
  company_name: string;
  industry: string;
  test_type: string;
  border_level: string;
  selection_timing: string;
  description: string;
}

const MAX_LIMIT = 100;

// 企業ボーダー一覧を取得する。?q= は企業名の部分一致キーワード検索、
// ?industry= / ?testType= はそれぞれ複数指定するとOR条件（未指定時は絞り込みなし）。
// 認証不要の公開API（学生が志望企業のボーダー情報を事前に閲覧する用途のため）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const keyword = params.get("q")?.trim() ?? "";
  const industries = params.getAll("industry").filter(Boolean);
  const testTypes = params.getAll("testType").filter(Boolean);

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (keyword) {
    conditions.push("company_name LIKE ?");
    binds.push(`%${keyword}%`);
  }
  if (industries.length > 0) {
    conditions.push(`industry IN (${industries.map(() => "?").join(",")})`);
    binds.push(...industries);
  }
  if (testTypes.length > 0) {
    conditions.push(`test_type IN (${testTypes.map(() => "?").join(",")})`);
    binds.push(...testTypes);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await context.env.DB.prepare(
    `SELECT id, company_name, industry, test_type, border_level, selection_timing, description
     FROM company_borders
     ${where}
     ORDER BY company_name ASC
     LIMIT ?`
  )
    .bind(...binds, MAX_LIMIT)
    .all<CompanyBorderRow>();

  return Response.json({
    borders: (rows.results ?? []).map((r) => ({
      id: r.id,
      companyName: r.company_name,
      industry: r.industry,
      testType: r.test_type,
      borderLevel: r.border_level,
      selectionTiming: r.selection_timing,
      description: r.description,
    })),
  });
};
