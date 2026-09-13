import { toClientQuestion, type QuestionRow } from "../_lib/questionFormat";
import {
  INCORRECT_RESET_INTERVAL_DAYS,
  MASTERED_STAGE,
  daysFromNowModifier,
  nextIntervalDaysAfterStage,
} from "../_lib/reviewSchedule";
import { getAuthenticatedSubjectId } from "../_lib/session";
import { KNOWLEDGE_REVIEW_CATEGORIES } from "../_lib/knowledgeCategories";

interface Env {
  DB: D1Database;
}

type ReviewRow = QuestionRow & {
  review_id: number;
  review_stage: number;
  status: string;
  next_review_at: string;
};

// ?scope=all: ステータス問わず復習ノートの全問題（テスト種別・科目ごとの一覧表示用）。
// ?scope未指定（デフォルト）: 今日（現在時刻時点）が復習期日になっているactiveな問題のみ（復習セッション用）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const scope = new URL(context.request.url).searchParams.get("scope");
  const showAll = scope === "all";

  // 復習対象は語彙・文法など「暗記主体の知識系単元」（言語・英語）のみに限定する。
  // 非言語・構造的把握などの計算・思考系分野は、単元ごとの「×＋△のみを復習する」機能（practiceモード）で扱う。
  const categoryPlaceholders = KNOWLEDGE_REVIEW_CATEGORIES.map(() => "?").join(",");
  const condition = showAll
    ? `r.user_id = ? AND q.category IN (${categoryPlaceholders})`
    : `r.user_id = ? AND r.status = 'active' AND r.next_review_at <= datetime('now') AND q.category IN (${categoryPlaceholders})`;

  const rows = await context.env.DB.prepare(
    `WITH ranked AS (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS seq FROM questions
     )
     SELECT
        r.id AS review_id, r.review_stage, r.status, r.next_review_at,
        q.id, q.category, q.sub_category, q.title, q.question_text, q.tables_json, q.image_data_uri, q.options, q.correct_answer, q.explanation, rk.seq
     FROM user_question_reviews r
     JOIN questions q ON q.id = r.question_id
     JOIN ranked rk ON rk.id = q.id
     WHERE ${condition}
     ORDER BY r.next_review_at ASC`
  )
    .bind(userId, ...KNOWLEDGE_REVIEW_CATEGORIES)
    .all<ReviewRow>();

  return Response.json({
    reviews: (rows.results ?? []).map((r) => ({
      reviewId: r.review_id,
      reviewStage: r.review_stage,
      status: r.status,
      nextReviewAt: r.next_review_at,
      question: toClientQuestion(r, { shuffle: true }),
    })),
  });
};

type PostBody = {
  reviewId?: unknown;
  result?: unknown;
};

// 復習の正解/不正解を記録し、次回復習日と復習ステージを更新する。
// 正解: ステージを1つ進め、次の間隔（3日→7日→14日）で次回復習日を設定。ステージ4到達でmastered。
// 不正解: ステージを0に戻し、翌日（+1日）に再度復習させる。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { reviewId, result } = body;
  if (
    typeof reviewId !== "number" ||
    (result !== "correct" && result !== "incorrect")
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const review = await context.env.DB.prepare(
    "SELECT id, user_id, review_stage FROM user_question_reviews WHERE id = ?"
  )
    .bind(reviewId)
    .first<{ id: number; user_id: number; review_stage: number }>();

  if (!review || review.user_id !== userId) {
    return Response.json({ error: "復習項目が見つかりません" }, { status: 404 });
  }

  if (result === "incorrect") {
    await context.env.DB.prepare(
      `UPDATE user_question_reviews
       SET review_stage = 0, status = 'active', last_result = 'incorrect',
           next_review_at = datetime('now', ?), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(daysFromNowModifier(INCORRECT_RESET_INTERVAL_DAYS), reviewId)
      .run();

    return Response.json({ ok: true, reviewStage: 0, status: "active" });
  }

  const newStage = review.review_stage + 1;
  const intervalDays = nextIntervalDaysAfterStage(newStage);

  if (intervalDays === null) {
    await context.env.DB.prepare(
      `UPDATE user_question_reviews
       SET review_stage = ?, status = 'mastered', last_result = 'correct',
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(MASTERED_STAGE, reviewId)
      .run();

    return Response.json({ ok: true, reviewStage: MASTERED_STAGE, status: "mastered" });
  }

  await context.env.DB.prepare(
    `UPDATE user_question_reviews
     SET review_stage = ?, status = 'active', last_result = 'correct',
         next_review_at = datetime('now', ?), updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(newStage, daysFromNowModifier(intervalDays), reviewId)
    .run();

  return Response.json({ ok: true, reviewStage: newStage, status: "active" });
};
