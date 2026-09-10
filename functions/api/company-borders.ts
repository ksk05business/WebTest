interface Env {
  DB: D1Database;
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
}

const MAX_LIMIT = 1000;

// 企業ボーダー一覧を取得する。?q= は企業名の部分一致キーワード検索（漢字表記・ふりがな
// （ひらがな）のどちらでも一致すればヒットする）、?industry= / ?testType= はそれぞれ複数指定
// するとOR条件（未指定時は絞り込みなし）。認証不要の公開API（学生が志望企業のボーダー情報を
// 事前に閲覧する用途のため）。
//
// 並び順: company_name_kana（ふりがな、常にひらがなで統一）の昇順。SQLiteのデフォルト
// （BINARY collation、UTF-8バイト列比較）ではASCII文字（アルファベット）がひらがなより
// 小さいコードポイントのため、英字社名→五十音順、という「アルファベット順のあとに五十音順」の
// 並びが自然に実現される。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const keyword = params.get("q")?.trim() ?? "";
  const industries = params.getAll("industry").filter(Boolean);
  const testTypes = params.getAll("testType").filter(Boolean);

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (keyword) {
    conditions.push("(company_name LIKE ? OR company_name_kana LIKE ?)");
    binds.push(`%${keyword}%`, `%${keyword}%`);
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
    `SELECT id, company_name, company_name_kana, industry, test_type, border_level, selection_timing, description, has_english, has_structural
     FROM company_borders
     ${where}
     ORDER BY company_name_kana ASC, company_name ASC
     LIMIT ?`
  )
    .bind(...binds, MAX_LIMIT)
    .all<CompanyBorderRow>();

  return Response.json({
    borders: (rows.results ?? []).map((r) => ({
      id: r.id,
      companyName: r.company_name,
      companyNameKana: r.company_name_kana,
      industry: r.industry,
      testType: r.test_type,
      borderLevel: r.border_level,
      selectionTiming: r.selection_timing,
      description: r.description,
      hasEnglish: r.has_english === 1,
      hasStructural: r.has_structural === 1,
    })),
  });
};
