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
  short_message: string | null;
  appeal_tags: string | null;
  featured_until: string | null;
};

const LIMIT = 6;

function parseAppealTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// 学生ダッシュボードの「あなたへのおすすめ企業」セクション向け。
// 現時点では属性ベースのマッチングアルゴリズムを持たないため、審査承認済み（status='active'）の企業を
// 「おすすめ表示」設定済み（トークン消費、featured_until > now）の企業を優先し、次いで新着順に一定件数返す。
// 公開して問題のない情報（企業名・企業サイトURL・種別・業種・企業プロフィール画面で設定した
// 25字アピールメッセージ・アピールタグ）のみを返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const rows = await context.env.DB.prepare(
    `SELECT id, company_name, corporate_site_url, account_type, industry, short_message, appeal_tags, featured_until
     FROM company_profiles WHERE status = 'active'
     ORDER BY (featured_until IS NOT NULL AND featured_until > datetime('now')) DESC, created_at DESC
     LIMIT ?`
  )
    .bind(LIMIT)
    .all<CompanyRow>();

  const companies = (rows.results ?? []).map((r) => ({
    id: r.id,
    companyName: r.company_name,
    corporateSiteUrl: r.corporate_site_url,
    accountType: r.account_type,
    industry: r.industry,
    shortMessage: r.short_message,
    appealTags: parseAppealTags(r.appeal_tags),
    isFeatured: Boolean(
      r.featured_until &&
        new Date(`${r.featured_until.replace(" ", "T")}Z`).getTime() > Date.now()
    ),
  }));

  return Response.json({ companies });
};
