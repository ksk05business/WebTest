import { INITIAL_REVIEW_INTERVAL_DAYS, daysFromNowModifier } from "../_lib/reviewSchedule";
import { getAuthenticatedSubjectId } from "../_lib/session";
import { checkExamEligibility } from "../_lib/mockExamCycle";
import { KNOWLEDGE_REVIEW_CATEGORIES } from "../_lib/knowledgeCategories";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "../../src/data/practiceUnits";
import { MULTI_PART_EXAM_PARTS } from "../../src/data/testTypes";

interface Env {
  DB: D1Database;
}

type CategoryScores = Record<string, { correct: number; total: number }>;

type AnswerInput = {
  questionId: number;
  correct: boolean;
  selectedLabel?: string | null;
  answerTimeSeconds?: number | null;
};

type PostBody = {
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

// 練習問題・模試で間違えた問題を、忘却曲線に基づく復習キュー（user_question_reviews）へ
// 追加/リセットする。既に復習キューにある問題（mastered済みも含む）は、間違えた時点でstage0・
// 当日復習にリセットする。
// 対象は語彙・文法など「暗記主体の知識系単元」（KNOWLEDGE_REVIEW_CATEGORIES＝言語・英語）のみに限定する
// （2026-08-26改訂）。非言語・構造的把握などの計算・思考系分野は、この忘却曲線キューではなく単元ごとの
// 「×＋△のみを復習する」機能（practiceモード、user_question_statusesベース）で復習する設計とした。
// なお過去には「カテゴリを問わず全問を対象」としていた時期もあったが（非言語等が復習ノートに
// 追加されない不具合の修正として）、今回改めて知識系単元のみに絞り込む方針に変更している。
async function enqueueWrongAnswers(db: D1Database, userId: number, answers: AnswerInput[]) {
  const wrongIds = answers.filter((a) => !a.correct).map((a) => a.questionId);
  if (wrongIds.length === 0) return;

  const placeholders = wrongIds.map(() => "?").join(",");
  const categoryPlaceholders = KNOWLEDGE_REVIEW_CATEGORIES.map(() => "?").join(",");
  const wrongQuestions = await db
    .prepare(
      `SELECT id FROM questions WHERE id IN (${placeholders}) AND category IN (${categoryPlaceholders})`
    )
    .bind(...wrongIds, ...KNOWLEDGE_REVIEW_CATEGORIES)
    .all<{ id: number }>();

  const modifier = daysFromNowModifier(INITIAL_REVIEW_INTERVAL_DAYS);
  for (const q of wrongQuestions.results ?? []) {
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

  const { score, total, categoryScores, answers } = body;
  const testType = typeof body.testType === "string" && body.testType ? body.testType : "spi";
  const isPractice = body.isPractice === true;

  if (
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

  const accuracyRate = score / total;

  // 練習問題（トレーニングモード）は正式な受験記録として保存しない（偏差値推移・カテゴリ分析には反映しない）。
  // ただし間違えた問題の復習キュー登録だけは、本番模試と同様に行う。
  if (isPractice) {
    if (answers) {
      await enqueueWrongAnswers(context.env.DB, userId, answers);
    }
    return Response.json({ ok: true, isPractice: true, accuracyRate });
  }

  // 本番模試はテスト種別ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  // クライアント側の判定に加え、サーバー側でも受験権を再検証する（多重送信・直接APIコール対策）。
  const eligibility = await checkExamEligibility(context.env.DB, userId, testType);
  if (!eligibility.eligible) {
    return Response.json(
      {
        error: `このテストは2ヶ月に1回のみ受験可能です（次回一斉リセット: ${eligibility.nextResetAt}）`,
        nextResetAt: eligibility.nextResetAt,
      },
      { status: 409 }
    );
  }

  const priorRows = await context.env.DB.prepare(
    "SELECT accuracy_rate FROM exam_results WHERE test_type = ?"
  )
    .bind(testType)
    .all<{ accuracy_rate: number }>();
  const priorRates = (priorRows.results ?? []).map((r) => r.accuracy_rate);
  const deviationScore = calculateDeviationScore(accuracyRate, priorRates);

  const inserted = await context.env.DB.prepare(
    `INSERT INTO exam_results (user_id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      userId,
      testType,
      score,
      total,
      accuracyRate,
      deviationScore,
      categoryScores ? JSON.stringify(categoryScores) : null
    )
    .run();

  if (answers) {
    await enqueueWrongAnswers(context.env.DB, userId, answers);

    const examResultId = inserted.meta.last_row_id;
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i];
      await context.env.DB.prepare(
        `INSERT INTO exam_result_answers (exam_result_id, question_id, display_order, selected_label, correct, answer_time_seconds)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(examResultId, a.questionId, i, a.selectedLabel ?? null, a.correct ? 1 : 0, a.answerTimeSeconds ?? null)
        .run();
    }
  }

  return Response.json({ ok: true, deviationScore, accuracyRate });
};

type ExamResultRow = {
  id: number;
  test_type: string;
  score: number;
  total: number;
  accuracy_rate: number;
  deviation_score: number | null;
  category_scores_json: string | null;
  taken_at: string;
};

// テスト種別（TestType.id、例: "tamatebako"）→ そのテストの本番模試が使うtest_type一覧。
// 複数パート方式（MULTI_PART_EXAM_PARTS参照）ならそのパートid一覧、単一パート方式（scoa等）なら
// TestType.id自身がtest_typeとして使われる。
function testTypesForFamily(testTypeFamily: string): string[] {
  const parts = MULTI_PART_EXAM_PARTS[testTypeFamily];
  return parts ? parts.map((p) => p.id) : [testTypeFamily];
}

// テスト種別（TestType.id）→ そのテストの大分類（questions.category）一覧＋表示ラベル。
// src/data/practiceUnits.tsの単元グループ定義（groupLabel）をそのまま流用し、テストごとに
// ハードコードした分類名を持たなくて済むようにする。
function categoriesForFamily(testTypeFamily: string): { category: string; label: string }[] {
  const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testTypeFamily] ?? [];
  return groups.map((g) => ({ category: g.category, label: g.groupLabel }));
}

// テスト種別（TestType.id）→ そのテストの単元（questions.sub_category）一覧＋大分類・表示ラベル。
// 「得意・苦手分野の詳細分析」（単元別内訳・レーダーチャート・苦手単元の復習導線）用に、
// categoriesForFamily()の大分類単位よりさらに細かい粒度でsrc/data/practiceUnits.tsの単元定義を
// フラット化する。
function subCategoriesForFamily(
  testTypeFamily: string
): { category: string; subCategory: string; label: string }[] {
  const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testTypeFamily] ?? [];
  return groups.flatMap((g) =>
    g.units.map((u) => ({ category: g.category, subCategory: u.subCategory, label: u.label }))
  );
}

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
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // ?testType=<TestType.id>（例: "tamatebako"）を指定すると、そのテスト種別の受験履歴・
  // カテゴリ分析のみに絞り込む（試験別専用ページ用）。省略時は全テスト種別を横断した集計。
  const testTypeFamily = new URL(context.request.url).searchParams.get("testType");
  const testTypesFilter = testTypeFamily ? testTypesForFamily(testTypeFamily) : null;

  const rows = testTypesFilter
    ? await context.env.DB.prepare(
        `SELECT id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json, taken_at
         FROM exam_results WHERE user_id = ? AND test_type IN (${testTypesFilter.map(() => "?").join(",")})
         ORDER BY taken_at DESC LIMIT 20`
      )
        .bind(userId, ...testTypesFilter)
        .all<ExamResultRow>()
    : await context.env.DB.prepare(
        `SELECT id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json, taken_at
         FROM exam_results WHERE user_id = ? ORDER BY taken_at DESC LIMIT 20`
      )
        .bind(userId)
        .all<ExamResultRow>();

  const history = (rows.results ?? []).map((r) => ({
    id: r.id,
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
  // testType指定時は同じテスト種別の受験のみを母集団とする。
  const allScoreRows = testTypesFilter
    ? await context.env.DB.prepare(
        `SELECT category_scores_json FROM exam_results
         WHERE category_scores_json IS NOT NULL AND test_type IN (${testTypesFilter.map(() => "?").join(",")})
         ORDER BY taken_at DESC LIMIT 500`
      )
        .bind(...testTypesFilter)
        .all<{ category_scores_json: string }>()
    : await context.env.DB.prepare(
        "SELECT category_scores_json FROM exam_results WHERE category_scores_json IS NOT NULL ORDER BY taken_at DESC LIMIT 500"
      ).all<{ category_scores_json: string }>();
  const populationByBroad: Record<string, number[]> = {};
  // 単元（sub_category）単位の母集団正答率。得意・苦手分野の詳細分析（単元別偏差値）用。
  const populationBySubCategory: Record<string, number[]> = {};
  for (const row of allScoreRows.results ?? []) {
    try {
      const parsed: CategoryScores = JSON.parse(row.category_scores_json);
      const bucketed = bucketBySubCategory(parsed, subToBroad);
      for (const [broad, v] of Object.entries(bucketed)) {
        if (v.total > 0) {
          (populationByBroad[broad] ??= []).push(v.correct / v.total);
        }
      }
      for (const [sub, v] of Object.entries(parsed)) {
        if (v.total > 0) {
          (populationBySubCategory[sub] ??= []).push(v.correct / v.total);
        }
      }
    } catch {
      // 壊れたJSONはスキップ
    }
  }

  // このユーザー自身の累計（直近20件分）を大分類・単元それぞれの粒度で集計する。
  const userTotalsByBroad: Record<string, { correct: number; total: number }> = {};
  const userTotalsBySubCategory: Record<string, { correct: number; total: number }> = {};
  for (const h of history) {
    if (!h.categoryScores) continue;
    const bucketed = bucketBySubCategory(h.categoryScores, subToBroad);
    for (const [broad, v] of Object.entries(bucketed)) {
      const entry = (userTotalsByBroad[broad] ??= { correct: 0, total: 0 });
      entry.correct += v.correct;
      entry.total += v.total;
    }
    for (const [sub, v] of Object.entries(h.categoryScores as CategoryScores)) {
      const entry = (userTotalsBySubCategory[sub] ??= { correct: 0, total: 0 });
      entry.correct += v.correct;
      entry.total += v.total;
    }
  }

  // testType未指定時（全テスト横断）はSPIの4分類、指定時はそのテスト自身の大分類グループを使う
  // （src/data/practiceUnits.tsのgroupLabelをそのまま表示ラベルとして使う）。
  const broadCategories = testTypeFamily
    ? categoriesForFamily(testTypeFamily)
    : categoriesForFamily("spi");

  const categoryBreakdown = broadCategories.map(({ category: broad, label }) => {
    const totals = userTotalsByBroad[broad] ?? { correct: 0, total: 0 };
    const rate = totals.total > 0 ? totals.correct / totals.total : null;
    const deviation = rate !== null ? calculateDeviationScore(rate, populationByBroad[broad] ?? []) : null;
    return {
      category: broad,
      label,
      correct: totals.correct,
      total: totals.total,
      accuracyRate: rate,
      deviationScore: deviation,
    };
  });

  // 得意・苦手分野の詳細分析（単元別内訳）。testType未指定時（全テスト横断）はSPIの単元一覧、
  // 指定時はそのテスト自身の単元一覧を使う（broadCategoriesと同じ方針）。
  const resolvedTestTypeFamily = testTypeFamily ?? "spi";
  const subCategories = subCategoriesForFamily(resolvedTestTypeFamily);
  const subCategoryBreakdown = subCategories.map(({ category: broad, subCategory, label }) => {
    const totals = userTotalsBySubCategory[subCategory] ?? { correct: 0, total: 0 };
    const rate = totals.total > 0 ? totals.correct / totals.total : null;
    const deviation =
      rate !== null ? calculateDeviationScore(rate, populationBySubCategory[subCategory] ?? []) : null;
    return {
      category: broad,
      subCategory,
      label,
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
    subCategoryBreakdown,
    testTypeFamily: resolvedTestTypeFamily,
  });
};
