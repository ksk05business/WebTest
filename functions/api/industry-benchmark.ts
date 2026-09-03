import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

// 文理区分フィルターと同じバケット定義（src/components/admin/StudentsTab.tsxのfacultyBucket()と
// 同じロジック）。学部・大学院を分けず「文系/理系/その他」の3分類のみで匿名表示する。
function facultyBucket(facultyType: string): "文系" | "理系" | "その他" {
  if (facultyType.startsWith("文系")) return "文系";
  if (facultyType.startsWith("理系")) return "理系";
  return "その他";
}

type RivalRow = {
  university_category: string | null;
  faculty_type: string;
  best_deviation: number;
};

// マイページ・模試結果画面の「業界別足切りボーダーライン判定」「匿名ライバル比較」用API。
// 認証済みユーザー自身の第一志望業界（industry_first）と、同じ業界を志望する他ユーザーの
// 模試成績（本人を除く、全test_type横断のベスト偏差値）を集計して返す。
// 個人情報保護のため、氏名・メールアドレス・大学名は一切含めず、大学区分（university_category）と
// 文理区分（facultyBucket）のみを匿名属性として返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const db = context.env.DB;

  const me = await db
    .prepare("SELECT industry_first FROM users WHERE id = ?")
    .bind(userId)
    .first<{ industry_first: string | null }>();
  const industryFirst = me?.industry_first ?? null;

  const myBest = await db
    .prepare(
      "SELECT MAX(deviation_score) AS best FROM exam_results WHERE user_id = ? AND deviation_score IS NOT NULL"
    )
    .bind(userId)
    .first<{ best: number | null }>();
  const myDeviationScore = myBest?.best != null ? Math.round(myBest.best) : null;

  if (!industryFirst) {
    return Response.json({
      industryFirst: null,
      myDeviationScore,
      rivalCount: 0,
      rivalAverageDeviation: null,
      rivalTop: [],
    });
  }

  // 同じ第一志望業界の他ユーザー（本人を除く）ごとに、全test_type横断のベスト偏差値を求める。
  const rivalRows = await db
    .prepare(
      `SELECT u.university_category, u.faculty_type, MAX(er.deviation_score) AS best_deviation
       FROM users u
       JOIN exam_results er ON er.user_id = u.id
       WHERE u.industry_first = ? AND u.id != ? AND er.deviation_score IS NOT NULL
       GROUP BY u.id`
    )
    .bind(industryFirst, userId)
    .all<RivalRow>();

  const rivals = rivalRows.results ?? [];
  const rivalCount = rivals.length;
  const rivalAverageDeviation =
    rivalCount > 0
      ? Math.round(rivals.reduce((sum, r) => sum + r.best_deviation, 0) / rivalCount)
      : null;

  const rivalTop = rivals
    .slice()
    .sort((a, b) => b.best_deviation - a.best_deviation)
    .slice(0, 8)
    .map((r) => ({
      universityCategory: r.university_category,
      facultyBucket: facultyBucket(r.faculty_type),
      deviationScore: Math.round(r.best_deviation),
    }));

  return Response.json({
    industryFirst,
    myDeviationScore,
    rivalCount,
    rivalAverageDeviation,
    rivalTop,
  });
};
