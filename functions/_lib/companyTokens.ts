// 企業向けトークン消費型マネタイズの共通ロジック。残高・有効期限の更新は必ずこのモジュール経由で行い、
// company_token_logs に増減履歴を残す（company_profiles.token_balance を直接UPDATEしない）。

export const TOKEN_EXPIRY_DAYS = 180;
export const APPROVAL_BONUS_TOKENS = 30;
export const SCOUT_TOKEN_COST = 1;
// 「おすすめ表示」は1日あたり1トークン消費する（表示期間に応じてトークンを消費する、というルールの最小実装）。
export const PROMOTION_TOKEN_COST_PER_DAY = 1;

export type TokenReason = "review_bonus" | "pack_purchase" | "scout_send" | "recommendation_feature";

type TokenState = { token_balance: number; token_expires_at: string | null };

// 有効期限切れの残高は「実質0」として扱う（レコード上のtoken_balanceは書き換えない。付与時に上書きされる）。
function isExpired(tokenExpiresAt: string | null): boolean {
  if (!tokenExpiresAt) return true;
  return new Date(`${tokenExpiresAt.replace(" ", "T")}Z`).getTime() <= Date.now();
}

export async function getEffectiveTokenBalance(
  db: D1Database,
  companyId: number
): Promise<{ balance: number; expiresAt: string | null }> {
  const row = await db
    .prepare("SELECT token_balance, token_expires_at FROM company_profiles WHERE id = ?")
    .bind(companyId)
    .first<TokenState>();
  if (!row) return { balance: 0, expiresAt: null };
  if (isExpired(row.token_expires_at)) return { balance: 0, expiresAt: row.token_expires_at };
  return { balance: row.token_balance, expiresAt: row.token_expires_at };
}

// トークンを付与する（審査承認特典・パック購入）。付与のたびに有効期限を「付与日+180日」へ更新する
// （複数回に分けて付与された分を別々に期限管理する仕組みは持たない、シンプルな実装）。
export async function grantTokens(
  db: D1Database,
  companyId: number,
  amount: number,
  reason: TokenReason
): Promise<void> {
  await db
    .prepare(
      `UPDATE company_profiles
       SET token_balance = token_balance + ?, token_expires_at = datetime('now', '+${TOKEN_EXPIRY_DAYS} days')
       WHERE id = ?`
    )
    .bind(amount, companyId)
    .run();
  await db
    .prepare("INSERT INTO company_token_logs (company_id, delta, reason) VALUES (?, ?, ?)")
    .bind(companyId, amount, reason)
    .run();
}

// トークンを消費する。有効期限切れ・残高不足の場合は消費せずfalseを返す。
export async function consumeTokens(
  db: D1Database,
  companyId: number,
  amount: number,
  reason: TokenReason
): Promise<boolean> {
  const { balance } = await getEffectiveTokenBalance(db, companyId);
  if (balance < amount) return false;

  await db
    .prepare("UPDATE company_profiles SET token_balance = token_balance - ? WHERE id = ?")
    .bind(amount, companyId)
    .run();
  await db
    .prepare("INSERT INTO company_token_logs (company_id, delta, reason) VALUES (?, ?, ?)")
    .bind(companyId, -amount, reason)
    .run();
  return true;
}
