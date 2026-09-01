-- 玉手箱模試専用プール追加移動（tamatebako_mock_pool_migration_2.sqlの続き）:
-- 図表の読み取りの総保有数がPart3・Part4追加により132問となり、3回分87問の目標を
-- 上回るようになったため、既存72問に15問追加して87問（3回分）ちょうどに到達させる。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='図表の読み取り' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 15
);
