-- 玉手箱模試専用プール追加移動（tamatebako_mock_pool_migration.sqlの追加分）:
-- ユーザーからの新規問題投入（四則逆算100問・図表の読み取り50問）により、当初「模試1回分ちょうど」
-- しか確保できなかった2単元のストックを3回分の目標に近づける。
-- 各UPDATEは冪等ではないため、環境（local/remote）ごとに一度だけ実行すること。

-- 四則逆算: 総保有169問（3回分150問の目標を満たせるようになった）。既存50問（1回分）に
-- 100問追加し、3回分150問ちょうどに。練習問題には19問残る。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='四則逆算' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 100
);

-- 図表の読み取り: 総保有82問（3回分87問にはまだ5問届かない）。既存29問（1回分）に43問追加し
-- 72問に（練習問題を10問残しつつ最大限3回分に近づける）。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='図表の読み取り' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 43
);
