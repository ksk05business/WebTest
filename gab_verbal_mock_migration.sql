-- GAB言語理解 模試専用プール移動: 50パッセージ中24パッセージ（96問=32問×3回分）を
-- is_mock_only=1へ。パッセージ単位（passage_group_id）で移動し、パッセージが分断されないようにする。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='gab_verbal' AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 24
);
