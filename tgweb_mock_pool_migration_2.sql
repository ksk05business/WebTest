-- TG-WEB模試用データ追加分離（tgweb_mock_pool_migration.sqlの追加分）:
-- 模試3回分（従来型・非言語の推論4問/回・図形問題3問/回、英語10問/回×従来型・新型それぞれ）の
-- ストック点検で不足が判明した3単元のみを追加で移動する。各UPDATEは冪等ではないため、
-- 環境（local/remote）ごとに一度だけ実行すること。

-- 従来型・非言語（推論）: 3回分12問必要、既存移動済み6問のみだったため6問追加（計12問）。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_math' AND sub_category='推論' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 6
);

-- 従来型・非言語（図形問題）: 3回分9問必要、既存移動済み6問のみだったため3問追加（計9問）。
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions WHERE category='tgweb_traditional_math' AND sub_category='図形問題' AND is_mock_only=0 ORDER BY RANDOM() LIMIT 3
);

-- 共通・英語（従来型・新型で共有、長文1本＝5問のパッセージ単位）:
-- 従来型10問/回＋新型10問/回＝20問/回×3回分＝12パッセージ必要、既存6パッセージのみだったため
-- 6パッセージ（30問）追加（計12パッセージ・60問）。
UPDATE questions SET is_mock_only = 1 WHERE passage_group_id IN (
  SELECT passage_group_id FROM (
    SELECT DISTINCT passage_group_id FROM questions
    WHERE category='tgweb_english' AND is_mock_only=0 AND passage_group_id IS NOT NULL
  ) ORDER BY RANDOM() LIMIT 6
);
