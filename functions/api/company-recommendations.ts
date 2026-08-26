import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type CompanyRow = {
  id: number;
  company_name: string;
  corporate_site_url: string | null;
  account_type: string;
  industry: string | null;
};

const LIMIT = 6;

// 学生ダッシュボードの「あなたへのおすすめ企業」セクション向け。
// 現時点ではマッチングアルゴリズムを持たないため、審査承認済み（status='active'）の企業を
// 新着順に一定件数返す簡易実装。公開して問題のない情報（企業名・企業サイトURL・種別・業種）のみを返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await context.env.DB.prepare(
    `SELECT id, company_name, corporate_site_url, account_type, industry
     FROM company_profiles WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`
  )
    .bind(LIMIT)
    .all<CompanyRow>();

  const companies = (rows.results ?? []).map((r) => ({
    id: r.id,
    companyName: r.company_name,
    corporateSiteUrl: r.corporate_site_url,
    accountType: r.account_type,
    industry: r.industry,
  }));

  return Response.json({ companies });
};
