import { checkAdminAuth } from "../../_lib/adminAuth";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

// 統合管理画面（/admin/dashboard）のタブヘッダーに表示する未読・新規件数バッジ用の集計API。
// 各タブが非アクティブな間もマウントされないため、親コンポーネント側でこのAPIを個別に叩いて
// バッジ件数だけを軽量に取得する。
// - お問い合わせ: status='unhandled'（未対応）件数
// - 企業: 利用審査申請でstatus='pending'（審査待ち）件数。運営が対応すべき件数として最も明確なため採用。
// - 学生: このアプリには管理者ごとの既読管理の仕組みが無いため、「直近7日以内に新規登録」を
//   新規件数の定義とする（時間ベースの簡易な「新着」表示。LINEの未読数のような厳密な既読管理ではない）。
// - ボーダー企業: /bordersに掲載中で検査種別（test_type）が未設定（空欄）の企業数。運営が
//   情報を埋めるべき残件数として表示する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const db = context.env.DB;
  const [contactRow, companyRow, bordersRow, studentRow] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS cnt FROM contact_inquiries WHERE status = 'unhandled'`).first<{
      cnt: number;
    }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM company_profiles WHERE status = 'pending' AND request_type = 'account_apply'`
      )
      .first<{ cnt: number }>(),
    db.prepare(`SELECT COUNT(*) AS cnt FROM company_borders WHERE test_type = ''`).first<{ cnt: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM users WHERE created_at >= datetime('now', '-7 days')`)
      .first<{ cnt: number }>(),
  ]);

  return Response.json({
    contactUnhandled: contactRow?.cnt ?? 0,
    companiesPending: companyRow?.cnt ?? 0,
    bordersIncomplete: bordersRow?.cnt ?? 0,
    studentsRecent: studentRow?.cnt ?? 0,
  });
};
