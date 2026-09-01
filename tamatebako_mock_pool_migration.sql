-- 玉手箱模試専用プール移動: 練習問題プール（is_mock_only=0）から模試専用プール（is_mock_only=1）へ
-- 移動する。GAB形式の長文（論理的読解）はパッセージ単位（passage_group_id）で移動し、
-- パッセージが分断されないようにする。四則逆算・図表の読み取りは単発の問題のため単純に抽出する。
-- 各UPDATEは冪等ではないため、環境（local/remote）ごとに一度だけ実行すること。
--
-- 注意: いずれの単元も総保有数が模試3回分（言語32問・計数の四則逆算50問・図表の読み取り29問・
-- 英語24問×3）に届いていないため、本マイグレーションでは「模試1回分がぎりぎり成立する最小量」
-- （各単元の1回分ちょうど）のみを移動し、残りは練習問題用に温存している。3回分の余裕（出題の
-- 重複を減らす）を持たせるには、各単元にオリジナル問題の追加投入が別途必要。

-- 言語（論理的読解GAB形式）: 保有10パッセージ（40問）中8パッセージ（32問）を移動、2パッセージ残す。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tamatebako_verbal' AND sub_category='論理的読解（GAB形式）'
      AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 8
);

-- 英語（論理的読解GAB形式）: 保有10パッセージ（30問）中8パッセージ（24問）を移動、2パッセージ残す。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tamatebako_english' AND sub_category='論理的読解（GAB形式）'
      AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 8
);

-- 計数（四則逆算）: 保有69問中50問を移動、19問残す。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='四則逆算' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 50
);

-- 計数（図表の読み取り）: 保有32問中29問を移動、3問残す。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='図表の読み取り' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 29
);
