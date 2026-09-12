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
// 母集団は「この受験より前に記録された、同じtest_typeの全受験者の正答率」に、常に
// 「得点率70%・標準偏差15%相当」の仮想ダミー母集団（重みDUMMY_POPULATION_WEIGHT件分）を
// 合成したもの（擬似ベイズ推定によるスムージング）。公開直後で実データがまだ少ないテスト種別は
// これにより「7割正解＝偏差値50」に自然に収束し、満点近いスコアで偏差値85のような非現実的な値に
// 跳ね上がる問題（実例あり）を防ぐ。実データの件数（n1）が増えるほどダミー母集団（固定n0件）の
// 相対的な影響は薄まり、自動的に実際の受験者集団の平均・ばらつきへシフトしていく。
// ダミー母集団の標準偏差を0.15としたのは、得点率100%（rate-mean=0.3）がちょうど
// 偏差値70（=50+10*0.3/0.15）に一致し、後述の上限キャップと自然に噛み合うため。
// 実データを合成した後の母集団でも標準偏差が極端に小さくなるケースへの安全弁として、
// 最終的な出力値に上限（70）のキャップは引き続きかける。
const DUMMY_POPULATION_MEAN = 0.7;
const DUMMY_POPULATION_STDDEV = 0.15;
const DUMMY_POPULATION_WEIGHT = 20;
const MAX_DEVIATION_SCORE = 70;

function calculateDeviationScore(rate: number, priorRates: number[]): number {
  const n0 = DUMMY_POPULATION_WEIGHT;
  const n1 = priorRates.length;
  const mean1 = n1 > 0 ? priorRates.reduce((sum, r) => sum + r, 0) / n1 : 0;
  const var1 = n1 > 0 ? priorRates.reduce((sum, r) => sum + (r - mean1) ** 2, 0) / n1 : 0;

  const totalN = n0 + n1;
  const mean = (n0 * DUMMY_POPULATION_MEAN + n1 * mean1) / totalN;
  const dummyVarTerm = n0 * (DUMMY_POPULATION_STDDEV ** 2 + (DUMMY_POPULATION_MEAN - mean) ** 2);
  const realVarTerm = n1 > 0 ? n1 * (var1 + (mean1 - mean) ** 2) : 0;
  const stddev = Math.sqrt((dummyVarTerm + realVarTerm) / totalN);
  if (stddev === 0) return 50;

  const raw = 50 + (10 * (rate - mean)) / stddev;
  return Math.min(raw, MAX_DEVIATION_SCORE);
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

// 単元（sub_category）名は同じテスト内でも複数の科目（category）にまたがって重複することがある
// （例: 玉手箱の「論理的読解（GAB形式）」は言語・英語の両方に存在する）。そのため単元名だけでは
// 科目を一意に決定できない。candidatesが複数ある場合、exam_results.test_type（例:
// "tamatebako_verbal_gab"）がどの科目のtest_typeを接頭辞に持つかで解決する
// （test_typeは科目を細分化したものであるため、必ずどちらか一方の科目名から始まる）。
function resolveCategory(
  subCategory: string,
  testType: string,
  candidatesBySubCategory: Map<string, string[]>
): string {
  const candidates = candidatesBySubCategory.get(subCategory);
  if (!candidates || candidates.length === 0) return "non_verbal";
  if (candidates.length === 1) return candidates[0];
  return candidates.find((c) => testType.startsWith(c)) ?? candidates[0];
}

function bucketBySubCategory(
  scores: CategoryScores,
  testType: string,
  candidatesBySubCategory: Map<string, string[]>
): Record<string, { correct: number; total: number }> {
  const out: Record<string, { correct: number; total: number }> = {};
  for (const [sub, v] of Object.entries(scores)) {
    const broad = resolveCategory(sub, testType, candidatesBySubCategory);
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

  // testType未指定時（全テスト横断）はSPIの4分類、指定時はそのテスト自身の大分類グループを使う
  // （src/data/practiceUnits.tsのgroupLabelをそのまま表示ラベルとして使う）。
  const resolvedTestTypeFamily = testTypeFamily ?? "spi";
  const broadCategories = categoriesForFamily(resolvedTestTypeFamily);
  const groupLabelByCategory = new Map(broadCategories.map((c) => [c.category, c.label]));

  // 得意・苦手分野の詳細分析（単元別内訳）で使う単元一覧。src/data/practiceUnits.tsの静的定義から
  // 導出するため、DBへの問い合わせは不要（以前はquestionsテーブルをDISTINCTで引いて
  // 単元名→科目の対応表を作っていたが、テスト種別をまたいで同名単元が存在する場合に
  // 対応表が上書きされて誤った科目に集計されるバグがあったため廃止した）。
  const subCategories = subCategoriesForFamily(resolvedTestTypeFamily);
  const candidatesBySubCategory = new Map<string, string[]>();
  for (const u of subCategories) {
    const list = candidatesBySubCategory.get(u.subCategory) ?? [];
    list.push(u.category);
    candidatesBySubCategory.set(u.subCategory, list);
  }

  // 母集団（全ユーザーの過去の受験ごとの大分類別正答率）を集める。直近500件までに抑える簡易実装。
  // testType指定時は同じテスト種別の受験のみを母集団とする。
  const allScoreRows = testTypesFilter
    ? await context.env.DB.prepare(
        `SELECT test_type, category_scores_json FROM exam_results
         WHERE category_scores_json IS NOT NULL AND test_type IN (${testTypesFilter.map(() => "?").join(",")})
         ORDER BY taken_at DESC LIMIT 500`
      )
        .bind(...testTypesFilter)
        .all<{ test_type: string; category_scores_json: string }>()
    : await context.env.DB.prepare(
        "SELECT test_type, category_scores_json FROM exam_results WHERE category_scores_json IS NOT NULL ORDER BY taken_at DESC LIMIT 500"
      ).all<{ test_type: string; category_scores_json: string }>();
  const populationByBroad: Record<string, number[]> = {};
  // 単元（科目ID::単元名の複合キー）単位の母集団正答率。得意・苦手分野の詳細分析（単元別偏差値）用。
  // 単元名だけをキーにすると、テスト種別をまたいで（あるいは玉手箱の言語/英語のように同じテスト内でも）
  // 同名単元が存在する場合に別科目のデータが混ざってしまうため、科目IDを含めた複合キーで管理する。
  const populationBySubCategory: Record<string, number[]> = {};
  for (const row of allScoreRows.results ?? []) {
    try {
      const parsed: CategoryScores = JSON.parse(row.category_scores_json);
      const bucketed = bucketBySubCategory(parsed, row.test_type, candidatesBySubCategory);
      for (const [broad, v] of Object.entries(bucketed)) {
        if (v.total > 0) {
          (populationByBroad[broad] ??= []).push(v.correct / v.total);
        }
      }
      for (const [sub, v] of Object.entries(parsed)) {
        if (v.total > 0) {
          const broad = resolveCategory(sub, row.test_type, candidatesBySubCategory);
          (populationBySubCategory[`${broad}::${sub}`] ??= []).push(v.correct / v.total);
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
    const bucketed = bucketBySubCategory(h.categoryScores, h.testType, candidatesBySubCategory);
    for (const [broad, v] of Object.entries(bucketed)) {
      const entry = (userTotalsByBroad[broad] ??= { correct: 0, total: 0 });
      entry.correct += v.correct;
      entry.total += v.total;
    }
    for (const [sub, v] of Object.entries(h.categoryScores as CategoryScores)) {
      const broad = resolveCategory(sub, h.testType, candidatesBySubCategory);
      const entry = (userTotalsBySubCategory[`${broad}::${sub}`] ??= { correct: 0, total: 0 });
      entry.correct += v.correct;
      entry.total += v.total;
    }
  }

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

  const subCategoryBreakdown = subCategories.map(({ category: broad, subCategory, label }) => {
    const key = `${broad}::${subCategory}`;
    const totals = userTotalsBySubCategory[key] ?? { correct: 0, total: 0 };
    const rate = totals.total > 0 ? totals.correct / totals.total : null;
    const deviation =
      rate !== null ? calculateDeviationScore(rate, populationBySubCategory[key] ?? []) : null;
    // 同じ単元名（subCategory）が別の科目にも存在する場合（例: 玉手箱の「論理的読解（GAB形式）」が
    // 言語・英語の両方に存在）、レーダーチャート等で見分けられるよう科目名を括弧書きで補足する。
    const isAmbiguous = (candidatesBySubCategory.get(subCategory)?.length ?? 0) > 1;
    const displayLabel = isAmbiguous ? `${label}（${groupLabelByCategory.get(broad) ?? broad}）` : label;
    return {
      category: broad,
      subCategory,
      label: displayLabel,
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
