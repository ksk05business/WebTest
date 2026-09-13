import { toClientQuestion, type QuestionRow } from "../_lib/questionFormat";
import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

// 過去の受験結果1回分の詳細（出題された問題文・自分の解答・正解・解説）を返す。
// ネストしたルート（functions/api/exam-results/[id].ts）ではなく?id=クエリのフラットなファイルに
// しているのは、Pages Functionsが「同名ベースのファイルとディレクトリ」の共存に対応しておらず
// 本番デプロイ後に404になる既知の問題（cloudflare-pages-gotchasスキル参照。
// functions/api/exam-results.tsと同じベース名のディレクトリを作ると再発する）を避けるため。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const idRaw = new URL(context.request.url).searchParams.get("id");
  const id = idRaw !== null ? Number(idRaw) : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "不正なIDです" }, { status: 400 });
  }

  const examResult = await context.env.DB.prepare(
    `SELECT id, user_id, test_type, score, total, accuracy_rate, deviation_score, taken_at
     FROM exam_results WHERE id = ?`
  ).bind(id).first<{
    id: number;
    user_id: number;
    test_type: string;
    score: number;
    total: number;
    accuracy_rate: number;
    deviation_score: number | null;
    taken_at: string;
  }>();

  if (!examResult || examResult.user_id !== userId) {
    return Response.json({ error: "受験結果が見つかりません" }, { status: 404 });
  }

  type AnswerRow = QuestionRow & {
    selected_label: string | null;
    answer_time_seconds: number | null;
    correct: number;
  };

  const rows = await context.env.DB.prepare(
    `WITH ranked AS (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS seq FROM questions
     )
     SELECT
       a.selected_label, a.answer_time_seconds, a.correct,
       q.id, q.category, q.sub_category, q.title, q.question_text, q.tables_json, q.image_data_uri, q.options, q.correct_answer, q.explanation, rk.seq
     FROM exam_result_answers a
     JOIN questions q ON q.id = a.question_id
     JOIN ranked rk ON rk.id = q.id
     WHERE a.exam_result_id = ?
     ORDER BY a.display_order ASC`
  ).bind(id).all<AnswerRow>();

  const review = (rows.results ?? []).map((r) => {
    const q = toClientQuestion(r);
    return {
      questionId: q.id,
      questionCode: q.questionCode,
      title: q.title,
      text: q.text,
      tables: q.tables,
      imageDataUri: q.imageDataUri,
      choices: q.choices,
      correctLabel: q.answer,
      selectedLabel: r.selected_label,
      correct: r.correct === 1,
      explanation: q.explanation,
      category: q.category,
      rawCategory: q.rawCategory,
      answerTimeSeconds: r.answer_time_seconds,
    };
  });

  return Response.json({
    testType: examResult.test_type,
    score: examResult.score,
    total: examResult.total,
    accuracyRate: examResult.accuracy_rate,
    deviationScore: examResult.deviation_score,
    takenAt: examResult.taken_at,
    review,
  });
};
