import { checkAdminAuth } from "../../../_lib/adminAuth";
import { type QuestionInput, validateQuestion } from "../../../_lib/questionValidation";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type PutBody = QuestionInput & { isReviewed?: unknown };

// 問題検品機能：1件分の問題内容（問題文・選択肢・正解・解説等）とレビュー完了フラグを更新する。
// 編集モーダルから、その問題の全フィールドを毎回送ってもらう想定（部分更新は行わない）。
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const id = parseId(context.params.id as string | undefined);
  if (!id) {
    return Response.json({ error: "不正なIDです" }, { status: 400 });
  }

  let body: PutBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const result = validateQuestion(body, "body");
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const isReviewed = body.isReviewed === true;

  const updateResult = await context.env.DB.prepare(
    `UPDATE questions SET
      category = ?, sub_category = ?, title = ?, question_text = ?, tables_json = ?, options = ?,
      correct_answer = ?, explanation = ?, difficulty = ?, status = ?, originality_note = ?,
      passage_group_id = ?, image_data_uri = ?, is_reviewed = ?
     WHERE id = ?`
  )
    .bind(
      result.category,
      result.subCategory,
      result.title,
      result.questionText,
      result.tablesJson,
      result.optionsJson,
      result.correctAnswer,
      result.explanationJson,
      result.difficulty,
      result.status,
      result.originalityNote,
      result.passageGroupId,
      result.imageDataUri,
      isReviewed ? 1 : 0,
      id
    )
    .run();

  if (updateResult.meta.changes === 0) {
    return Response.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, id, isReviewed });
};

// 問題検品機能：不適切・誤作動の問題を削除する。関連する復習キュー・解答履歴も合わせて削除する
// （外部キー制約があるため、questionsを削除する前に依存レコードを削除する必要がある）。
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const id = parseId(context.params.id as string | undefined);
  if (!id) {
    return Response.json({ error: "不正なIDです" }, { status: 400 });
  }

  const existing = await context.env.DB.prepare("SELECT id FROM questions WHERE id = ?").bind(id).first();
  if (!existing) {
    return Response.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  await context.env.DB.prepare("DELETE FROM user_question_reviews WHERE question_id = ?").bind(id).run();
  await context.env.DB.prepare("DELETE FROM user_question_history WHERE question_id = ?").bind(id).run();
  await context.env.DB.prepare("DELETE FROM questions WHERE id = ?").bind(id).run();

  return Response.json({ ok: true, id });
};
