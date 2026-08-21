interface Env {
  DB: D1Database;
}

type UnitCountRow = {
  category: string;
  sub_category: string;
  count: number;
};

// 練習問題モードの「分野・単元選択」画面用に、大分類・小分類ごとの収録問題数（status='published'のみ）を返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const rows = await context.env.DB.prepare(
    `SELECT category, sub_category, COUNT(*) AS count
     FROM questions
     WHERE status = 'published'
     GROUP BY category, sub_category`
  ).all<UnitCountRow>();

  const totalRow = await context.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM questions WHERE status = 'published'"
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
