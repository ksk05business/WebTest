interface Env {
  DB: D1Database;
}

type UnitCountRow = {
  category: string;
  sub_category: string;
  count: number;
};

// 練習問題モードの「分野・単元選択」画面用に、大分類・小分類ごとの収録問題数
// （status='published' かつ is_mock_only=0、本番模試専用に切り分けた問題を除く）を返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const rows = await context.env.DB.prepare(
    `SELECT category, sub_category, COUNT(*) AS count
     FROM questions
     WHERE status = 'published' AND is_mock_only = 0
     GROUP BY category, sub_category`
  ).all<UnitCountRow>();

  const totalRow = await context.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM questions WHERE status = 'published' AND is_mock_only = 0"
  ).first<{ count: number }>();

  return Response.json({
    units: (rows.results ?? []).map((r) => ({
      category: r.category,
      subCategory: r.sub_category,
      count: r.count,
    })),
    total: totalRow?.count ?? 0,
  });
};
