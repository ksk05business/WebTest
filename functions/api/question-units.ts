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
// ユーザーに依存しない全員共通の集計値で、管理者が問題を追加・公開したときだけ変化するため、
// Cloudflareのエッジキャッシュ（Cache API）で数分間キャッシュし、単元一覧画面を開くたびに
// D1へ問い合わせが飛ぶのを避ける（多数のユーザーが同時に開いても実際のクエリは数分に1回で済む）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cache = caches.default;
  const cacheKey = new Request(context.request.url, context.request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const rows = await context.env.DB.prepare(
    `SELECT category, sub_category, COUNT(*) AS count
     FROM questions
     WHERE status = 'published' AND is_mock_only = 0
     GROUP BY category, sub_category`
  ).all<UnitCountRow>();

  const totalRow = await context.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM questions WHERE status = 'published' AND is_mock_only = 0"
  ).first<{ count: number }>();

  const response = Response.json(
    {
      units: (rows.results ?? []).map((r) => ({
        category: r.category,
        subCategory: r.sub_category,
        count: r.count,
      })),
      total: totalRow?.count ?? 0,
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
