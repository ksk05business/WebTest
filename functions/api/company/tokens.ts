import { getAuthenticatedSubjectId } from "../../_lib/session";
import { getEffectiveTokenBalance } from "../../_lib/companyTokens";

interface Env {
  DB: D1Database;
}

type TokenLogRow = {
  id: number;
  delta: number;
  reason: string;
  created_at: string;
};

type CompanyRow = { status: string; featured_until: string | null };

// 企業のトークン残高・有効期限・「おすすめ表示」設定状況・直近の増減履歴を返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const companyId = await getAuthenticatedSubjectId(context.env.DB, context.request, "company");
  if (!companyId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const company = await context.env.DB.prepare(
    "SELECT status, featured_until FROM company_profiles WHERE id = ?"
  )
    .bind(companyId)
    .first<CompanyRow>();
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }

  const { balance, expiresAt } = await getEffectiveTokenBalance(context.env.DB, companyId);

  const logs = await context.env.DB.prepare(
    `SELECT id, delta, reason, created_at FROM company_token_logs
     WHERE company_id = ? ORDER BY created_at DESC LIMIT 20`
  )
    .bind(companyId)
    .all<TokenLogRow>();

  return Response.json({
    status: company.status,
    tokenBalance: balance,
    tokenExpiresAt: expiresAt,
    featuredUntil: company.featured_until,
    logs: (logs.results ?? []).map((r) => ({
      id: r.id,
      delta: r.delta,
      reason: r.reason,
      createdAt: r.created_at,
    })),
  });
};
