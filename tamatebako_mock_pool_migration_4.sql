-- 玉手箱の形式・セクション別個別受験化に伴い、新たに単独の模試セクションとして扱われることに
-- なった4単元に、模試専用プール（is_mock_only=1）を新規に確保する。IMAGES形式の2単元は
-- パッセージ単位（passage_group_id）で移動し、パッセージが分断されないようにする。
-- 各UPDATEは冪等ではないため、環境（local/remote）ごとに一度だけ実行すること。

-- 言語・表の空欄推測: 1回分20問（保有60問中、40問は練習問題に残す）。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_math' AND sub_category='表の空欄推測' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 20
);

-- 言語・趣旨判定（IMAGES形式）: 1回分32問＝8パッセージ（保有10パッセージ中、2パッセージを
-- 練習問題に残す）。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tamatebako_verbal' AND sub_category='趣旨判定（IMAGES形式）'
      AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 8
);

-- 言語・趣旨把握: 保有がちょうど10問のみのため全問を移動する（練習問題は0問になる。
-- 今後オリジナル問題の追加投入が必要）。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category='tamatebako_verbal' AND sub_category='趣旨把握' AND is_mock_only=0
  ORDER BY RANDOM() LIMIT 10
);

-- 英語・長文読解（IMAGES形式）: 1回分24問＝8パッセージ（保有10パッセージ中、2パッセージを
-- 練習問題に残す）。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tamatebako_english' AND sub_category='長文読解（IMAGES形式）'
      AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 8
);
