import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

type SummaryRow = {
  total: number;
  known: number;
  uncertain: number;
  wrong: number;
};

// 単元選択画面のステータス内訳表示用。指定した category/subCategory の published 問題を対象に、
// ログイン中ユーザーの自己評価ステータス（〇known/△uncertain/×wrong）ごとの件数を返す。
// user_question_statuses に行が無い問題は「未回答」として total から差し引いて算出する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const params = new URL(context.request.url).searchParams;
  const category = params.get("category");
  const subCategory = params.get("subCategory");
  if (!category || !subCategory) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const row = await context.env.DB.prepare(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN s.status = 'known' THEN 1 ELSE 0 END) AS known,
       SUM(CASE WHEN s.status = 'uncertain' THEN 1 ELSE 0 END) AS uncertain,
       SUM(CASE WHEN s.status = 'wrong' THEN 1 ELSE 0 END) AS wrong
     FROM questions q
     LEFT JOIN user_question_statuses s ON s.question_id = q.id AND s.user_id = ?
     WHERE q.status = 'published' AND q.category = ? AND q.sub_category = ?`
  )
    .bind(userId, category, subCategory)
    .first<SummaryRow>();

  const total = row?.total ?? 0;
  const known = row?.known ?? 0;
  const uncertain = row?.uncertain ?? 0;
  const wrong = row?.wrong ?? 0;
  const unanswered = total - known - uncertain - wrong;

  return Response.json({ total, known, uncertain, wrong, unanswered });
};
