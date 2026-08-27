import { getAuthenticatedSubjectId } from "../../_lib/session";
import { PROMOTION_TOKEN_COST_PER_DAY, consumeTokens } from "../../_lib/companyTokens";

interface Env {
  DB: D1Database;
}

// 「おすすめ表示」に設定できる表示日数（1日あたりPROMOTION_TOKEN_COST_PER_DAYトークン消費）。
const ALLOWED_DAYS = [7, 14, 30] as const;

type PromotionBody = { days?: unknown };

type CompanyRow = { status: string; featured_until: string | null };

// 学生マイページ「あなたへのおすすめ企業」への優先表示を、指定日数ぶんトークンを消費して設定する。
// 既に有効な「おすすめ表示」期間が残っている場合は、その終了日時に追加日数を積み増す（延長）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const companyId = await getAuthenticatedSubjectId(context.env.DB, context.request, "company");
  if (!companyId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: PromotionBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { days } = body;
  if (typeof days !== "number" || !(ALLOWED_DAYS as readonly number[]).includes(days)) {
    return Response.json({ error: "表示期間の指定が不正です" }, { status: 400 });
  }

  const company = await context.env.DB.prepare(
    "SELECT status, featured_until FROM company_profiles WHERE id = ?"
  )
    .bind(companyId)
    .first<CompanyRow>();
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }
  if (company.status !== "active") {
    return Response.json(
      { error: "このアカウントはまだ運営の承認待ちのためおすすめ表示を設定できません" },
      { status: 403 }
    );
  }

  const cost = days * PROMOTION_TOKEN_COST_PER_DAY;
  const consumed = await consumeTokens(context.env.DB, companyId, cost, "recommendation_feature");
  if (!consumed) {
    return Response.json(
      {
        error: "トークン残高が不足しています。トークンを購入してください。",
        insufficientTokens: true,
      },
      { status: 402 }
    );
  }

  // 既に有効なおすすめ表示期間が残っていれば、その終了日時から追加日数を積み増す（前倒しで消化させない）。
  const now = Date.now();
  const currentEndsAt = company.featured_until
    ? new Date(`${company.featured_until.replace(" ", "T")}Z`).getTime()
    : 0;
  const baseTime = currentEndsAt > now ? currentEndsAt : now;
  const newFeaturedUntil = new Date(baseTime + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await context.env.DB.prepare("UPDATE company_profiles SET featured_until = ? WHERE id = ?")
    .bind(newFeaturedUntil, companyId)
    .run();

  return Response.json({ ok: true, featuredUntil: newFeaturedUntil, tokensSpent: cost });
};
