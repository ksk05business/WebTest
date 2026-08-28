-- SCOA練習問題データベースから、模試専用の問題プールをランダムに分離するマイグレーション。
-- 各分野・単元から指定件数をランダム抽出し is_mock_only = 1 にフラグを立てる。
-- 練習問題モードのAPI（questions.ts / question-units.ts / practice/history.ts）は
-- is_mock_only = 0 のみを対象とするため、ここで選ばれた問題は練習問題一覧・出題から除外される。
-- 本番模試（/test?part=scoa）は is_mock_only = 1 を対象に出題する。

-- 言語（熟語・ことわざ・慣用句・故事成語）: 40問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_language' AND sub_category = '熟語・ことわざ・慣用句・故事成語'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 40
);

-- 言語（長文読解）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_language' AND sub_category = '長文読解'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 英語（文法・語彙・イディオム・アクセント）: 40問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_english' AND sub_category = '文法・語彙・イディオム・アクセント'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 40
);

-- 数理（四則計算）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_math' AND sub_category = '四則計算'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 数理（方程式・数列）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_math' AND sub_category = '方程式・数列'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 数理（規則性・濃度算）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_math' AND sub_category = '規則性・濃度算'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 論理（場合の数確率）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_logic' AND sub_category = '場合の数確率'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 論理（推論）: 20問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_logic' AND sub_category = '推論'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 20
);

-- 常識（理科）: 30問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_common_sense' AND sub_category = '理科'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 30
);

-- 常識（社会）: 30問
UPDATE questions SET is_mock_only = 1 WHERE id IN (
  SELECT id FROM questions
  WHERE category = 'scoa_common_sense' AND sub_category = '社会'
    AND status = 'published' AND is_mock_only = 0
  ORDER BY RANDOM() LIMIT 30
);
