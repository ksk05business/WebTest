// プロフィール未入力（users.is_profile_completed = 0）のユーザーが練習問題・模試の
// 実際の出題（問題本体の取得）にアクセスするのを防ぐための共通チェック。
// functions/api/questions.ts・functions/api/exam-eligibility.ts・
// functions/api/practice/history.ts（実際に問題を返す経路のみ、countOnly等の
// 件数取得は対象外）から使う。ダッシュボードの閲覧など「問題そのものを取得しない」
// エンドポイントは対象にしない。
export async function isProfileIncomplete(db: D1Database, userId: number): Promise<boolean> {
  const row = await db
    .prepare("SELECT is_profile_completed FROM users WHERE id = ?")
    .bind(userId)
    .first<{ is_profile_completed: number }>();
  return row !== null && row.is_profile_completed !== 1;
}

export const PROFILE_INCOMPLETE_ERROR = "プロフィール情報の登録が必要です";
