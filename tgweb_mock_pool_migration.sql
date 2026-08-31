-- TG-WEB模試用データ分離: 練習問題プール（is_mock_only=0）から指定数をランダム抽出し、
-- 模試専用プール（is_mock_only=1）へ移動する。各UPDATEは冪等ではないため、
-- 環境（local/remote）ごとに一度だけ実行すること。

-- 従来型・言語
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_verbal' AND sub_category='空欄補充' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 15
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_verbal' AND sub_category='並べ替え' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 15
);

-- 従来型・非言語
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_math' AND sub_category='暗号' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 6
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_math' AND sub_category='図形問題' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 6
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_math' AND sub_category='推論' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 6
);

-- 新型・言語
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_verbal' AND sub_category='同義語・対義語' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 25
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_verbal' AND sub_category='ことわざ' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 25
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_verbal' AND sub_category='慣用句' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 25
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_verbal' AND sub_category='四字熟語' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 25
);

-- 新型・非言語
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_math' AND sub_category='四則演算' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 90
);
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_new_math' AND sub_category='図表の読み取り' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 20
);

-- 共通・言語（従来型・新型で共有）
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_verbal_reading' AND sub_category='長文読解' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 30
);

-- 共通・英語（従来型・新型で共有。長文1本＝5問のパッセージ単位で6本＝30問をまとめて移動する）
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tgweb_english' AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 6
);
