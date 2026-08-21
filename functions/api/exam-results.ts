import { INITIAL_REVIEW_INTERVAL_DAYS, daysFromNowModifier } from "../_lib/reviewSchedule";

interface Env {
  DB: D1Database;
}

type CategoryScores = Record<string, { correct: number; total: number }>;

type AnswerInput = { questionId: number; correct: boolean };

type PostBody = {
  email?: unknown;
  testType?: unknown;
  score?: unknown;
  total?: unknown;
  categoryScores?: unknown;
  answers?: unknown;
  isPractice?: unknown;
};

function isCategoryScores(value: unknown): value is CategoryScores {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as { correct?: unknown }).correct === "number" &&
      typeof (v as { total?: unknown }).total === "number"
  );
}

function isAnswers(value: unknown): value is AnswerInput[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as { questionId?: unknown }).questionId === "number" &&
      typeof (v as { correct?: unknown }).correct === "boolean"
  );
}

// 偏差値 = 50 + 10 * (このスコア率 - 母集団平均) / 母集団標準偏差
// 母集団は「この受験より前に記録された、同じtest_typeの全受験者の正答率」。
// サンプルが少ない/ばらつきが無い場合は50を返す（過去の受験結果を遡って再計算はしない簡易実装）。
function calculateDeviationScore(rate: number, priorRates: number[]): number {
  if (priorRates.length < 2) return 50;
  const mean = priorRates.reduce((sum, r) => sum + r, 0) / priorRates.length;
  const variance =
    priorRates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / priorRates.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return 50;
  return 50 + (10 * (rate - mean)) / stddev;
}

// 言語（verbal）カテゴリの問題を間違えた場合、忘却曲線に基づく復習キューへ追加/リセットする。
// 既に復習キューにある問題（mastered済みも含む）は、間違えた時点でstage0・翌日復習にリセットする。
async function enqueueWrongVerbalAnswers(db: D1Database, userId: number, answers: AnswerInput[]) {
  const wrongIds = answers.filter((a) => !a.correct).map((a) => a.questionId);
  if (wrongIds.length === 0) return;

  const placeholders = wrongIds.map(() => "?").join(",");
  const verbalQuestions = await db
    .prepare(`SELECT id FROM questions WHERE id IN (${placeholders}) AND category = 'verbal'`)
    .bind(...wrongIds)
    .all<{ id: number }>();

  const modifier = daysFromNowModifier(INITIAL_REVIEW_INTERVAL_DAYS);
  for (const q of verbalQuestions.results ?? []) {
    await db
      .prepare(
        `INSERT INTO user_question_reviews (user_id, question_id, review_stage, status, last_result, next_review_at)
         VALUES (?, ?, 0, 'active', 'incorrect', datetime('now', ?))
         ON CONFLICT(user_id, question_id) DO UPDATE SET
           review_stage = 0, status = 'active', last_result = 'incorrect',
           next_review_at = datetime('now', ?), updated_at = datetime('now')`
      )
      .bind(userId, q.id, modifier, modifier)
      .run();
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, score, total, categoryScores, answers } = body;
  const testType = typeof body.testType === "string" && body.testType ? body.testType : "spi";
  const isPractice = body.isPractice === true;

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof score !== "number" ||
    typeof total !== "number" ||
    total <= 0 ||
    score < 0 ||
    score > total ||
    (categoryScores !== undefined && !isCategoryScores(categoryScores)) ||
    (answers !== undefined && !isAnswers(answers))
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const accuracyRate = score / total;

  // 練習問題（トレーニングモード）は正式な受験記録として保存しない（偏差値推移・カテゴリ分析には反映しない）。
  // ただし間違えた言語問題の復習キュー登録だけは、本番模試と同様に行う。
  if (isPractice) {
    if (answers) {
      await enqueueWrongVerbalAnswers(context.env.DB, user.id, answers);
    }
    return Response.json({ ok: true, isPractice: true, accuracyRate });
  }

  const priorRows = await context.env.DB.prepare(
    "SELECT accuracy_rate FROM exam_results WHERE test_type = ?"
  )
    .bind(testType)
    .all<{ accuracy_rate: number }>();
  const priorRates = (priorRows.results ?? []).map((r) => r.accuracy_rate);
  const deviationScore = calculateDeviationScore(accuracyRate, priorRates);

  await context.env.DB.prepare(
    `INSERT INTO exam_results (user_id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user.id,
      testType,
      score,
      total,
      accuracyRate,
      deviationScore,
      categoryScores ? JSON.stringify(categoryScores) : null
    )
    .run();

  if (answers) {
    await enqueueWrongVerbalAnswers(context.env.DB, user.id, answers);
  }

  return Response.json({ ok: true, deviationScore, accuracyRate });
};

type ExamResultRow = {
  test_type: string;
  score: number;
  total: number;
  accuracy_rate: number;
  deviation_score: number | null;
  category_scores_json: string | null;
  taken_at: string;
};

const BROAD_CATEGORIES = ["verbal", "non_verbal", "structural"] as const;

function bucketBySubCategory(
  scores: CategoryScores,
  subToBroad: Record<string, string>
): Record<string, { correct: number; total: number }> {
  const out: Record<string, { correct: number; total: number }> = {};
  for (const [sub, v] of Object.entries(scores)) {
    const broad = subToBroad[sub] ?? "non_verbal";
    if (!out[broad]) out[broad] = { correct: 0, total: 0 };
    out[broad].correct += v.correct;
    out[broad].total += v.total;
  }
  return out;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const email = new URL(context.request.url).searchParams.get("email");
  if (!email) {
    return Response.json({ error: "emailが指定されていません" }, { status: 400 });
  }

  const user = await context.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const rows = await context.env.DB.prepare(
    `SELECT test_type, score, total, accuracy_rate, deviation_score, category_scores_json, taken_at
     FROM exam_results WHERE user_id = ? ORDER BY taken_at DESC LIMIT 20`
  )
    .bind(user.id)
    .all<ExamResultRow>();

  const history = (rows.results ?? []).map((r) => ({
    testType: r.test_type,
    score: r.score,
    total: r.total,
    accuracyRate: r.accuracy_rate,
    deviationScore: r.deviation_score,
    categoryScores: r.category_scores_json ? JSON.parse(r.category_scores_json) : null,
    takenAt: r.taken_at,
  }));

  const deviationScores = history
    .map((h) => h.deviationScore)
    .filter((d): d is number => d !== null);
  const latestDeviationScore = deviationScores[0] ?? null;
  const bestDeviationScore = deviationScores.length > 0 ? Math.max(...deviationScores) : null;
  const bestAccuracyRate =
    history.length > 0 ? Math.max(...history.map((h) => h.accuracyRate)) : null;

  // 問題の大分類（category: non_verbal/verbal/structural）と小分類（sub_category）の対応表を作り、
  // category_scores_json（小分類キー）を大分類ごとに集計する。カテゴリ別の正解率・偏差値表示に使う。
  const categoryRows = await context.env.DB.prepare(
    "SELECT DISTINCT category, sub_category FROM questions"
  ).all<{ category: string; sub_category: string }>();
  const subToBroad: Record<string, string> = {};
  for (const r of categoryRows.results ?? []) {
    subToBroad[r.sub_category] = r.category;
  }

  // 母集団（全ユーザーの過去の受験ごとの大分類別正答率）を集める。直近500件までに抑える簡易実装。
  const allScoreRows = await context.env.DB.prepare(
    "SELECT category_scores_json FROM exam_results WHERE category_scores_json IS NOT NULL ORDER BY taken_at DESC LIMIT 500"
  ).all<{ category_scores_json: string }>();
  const populationByBroad: Record<string, number[]> = {};
  for (const row of allScoreRows.results ?? []) {
    try {
      const parsed: CategoryScores = JSON.parse(row.category_scores_json);
      const bucketed = bucketBySubCategory(parsed, subToBroad);
      for (const [broad, v] of Object.entries(bucketed)) {
        if (v.total > 0) {
          (populationByBroad[broad] ??= []).push(v.correct / v.total);
        }
      }
    } catch {
      // 壊れたJSONはスキップ
    }
  }

  // このユーザー自身の累計（直近20件分）を大分類ごとに集計する。
  const userTotalsByBroad: Record<string, { correct: number; total: number }> = {};
  for (const h of history) {
    if (!h.categoryScores) continue;
    const bucketed = bucketBySubCategory(h.categoryScores, subToBroad);
    for (const [broad, v] of Object.entries(bucketed)) {
      const entry = (userTotalsByBroad[broad] ??= { correct: 0, total: 0 });
      entry.correct += v.correct;
      entry.total += v.total;
    }
  }

  const categoryBreakdown = BROAD_CATEGORIES.map((broad) => {
    const totals = userTotalsByBroad[broad] ?? { correct: 0, total: 0 };
    const rate = totals.total > 0 ? totals.correct / totals.total : null;
    const deviation = rate !== null ? calculateDeviationScore(rate, populationByBroad[broad] ?? []) : null;
    return {
      category: broad,
      correct: totals.correct,
      total: totals.total,
      accuracyRate: rate,
      deviationScore: deviation,
    };
  });

  return Response.json({
    history,
    attemptCount: history.length,
    latestDeviationScore,
    bestDeviationScore,
    bestAccuracyRate,
    categoryBreakdown,
  });
};
