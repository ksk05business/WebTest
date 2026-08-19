interface Env {
  DB: D1Database;
}

type CategoryScores = Record<string, { correct: number; total: number }>;

type PostBody = {
  email?: unknown;
  testType?: unknown;
  score?: unknown;
  total?: unknown;
  categoryScores?: unknown;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: PostBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { email, score, total, categoryScores } = body;
  const testType = typeof body.testType === "string" && body.testType ? body.testType : "spi";

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof score !== "number" ||
    typeof total !== "number" ||
    total <= 0 ||
    score < 0 ||
    score > total ||
    (categoryScores !== undefined && !isCategoryScores(categoryScores))
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

  const latestDeviationScore = history[0]?.deviationScore ?? null;
  const bestAccuracyRate =
    history.length > 0 ? Math.max(...history.map((h) => h.accuracyRate)) : null;

  return Response.json({
    history,
    attemptCount: history.length,
    latestDeviationScore,
    bestAccuracyRate,
  });
};
