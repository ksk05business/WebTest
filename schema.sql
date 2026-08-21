CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name_romaji TEXT NOT NULL,
  first_name_romaji TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  faculty_type TEXT NOT NULL,
  university TEXT NOT NULL,
  industry_first TEXT NOT NULL,
  industry_second TEXT NOT NULL,
  industry_third TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  graduation_month INTEGER NOT NULL,
  reset_otp_hash TEXT,
  reset_otp_salt TEXT,
  reset_otp_expires_at TEXT,
  terms_agreed_at TEXT NOT NULL,
  scout_consent INTEGER NOT NULL DEFAULT 0,
  -- 匿名開示用の大学区分（例: "旧帝大・難関国立", "早慶上智", "MARCH・関関同立", "その他国公立", "その他私立"）。
  -- スカウト機能で企業に開示するのはこの区分のみで、大学名そのものは開示しない。
  -- university（実大学名）からのマッピングはアプリ側で管理し、登録・更新時にここへ反映する想定。
  university_category TEXT,
  -- 希望職種（最大3つ）。JSON文字列配列として保存する。例: ["営業・顧客交渉","IT・エンジニア・Web制作"]
  desired_occupations TEXT NOT NULL DEFAULT '["こだわりなし・幅広く検討したい"]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 同意（規約同意・スカウト目的の第三者提供同意など）の履歴を残す監査ログ。
-- 個人情報保護法29条の「第三者提供に係る記録」の裏付け資料としても利用する想定。
CREATE TABLE IF NOT EXISTS consent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consent_type TEXT NOT NULL,
  granted INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- 模試の受験結果（スカウト機能・成績ダッシュボードの両方から参照する）
-- 現状フロントエンドはlocalStorageのみに結果を保持しているが、
-- スカウト機能で「SPI模試偏差値」を企業に開示するにはサーバー側の記録が必須のため追加する。
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'spi', -- 'spi' | 'tamatebako' | 'tgweb' | 'gab' | 'cgab' | 'cab'
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  accuracy_rate REAL NOT NULL, -- 正答率 (score / total)
  deviation_score REAL, -- 偏差値。同一test_typeの過去の受験結果を母集団として算出（サンプルが少ない場合は50固定）
  category_scores_json TEXT, -- 分野別スコア。 {"非言語-損益算": {"correct":1,"total":2}, ...} 形式のJSON文字列
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);

-- ============================================================
-- スカウト機能: 企業プロフィール
-- 職業安定法上、当社は「募集情報等提供事業（特定募集情報等提供事業）」として運営し、
-- 個別の学生の推薦や面談調整といった職業紹介（マッチング）行為は一切行わない。
-- 企業と学生は、学生本人がスカウトを承諾した後にシステム上で直接連絡を取る。
-- なりすまし・無関係業者によるスクレイピング目的の登録を防ぐため、
-- 企業アカウントは運営による承認（approved）を経るまでスカウト送信・候補者閲覧ができない設計とする。
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  industry TEXT,
  -- 職業安定法上の事業区分。当社は職業紹介事業ではなく募集情報等提供事業として運営する前提を明示する。
  provider_business_type TEXT NOT NULL DEFAULT '募集情報等提供事業',
  -- 特定募集情報等提供事業として厚生労働省へ届出した場合の届出受理番号（未取得時はNULL）
  provider_notification_number TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_profiles_email ON company_profiles(email);

-- ============================================================
-- スカウト機能: スカウト本体
-- 「2段階開示フラグ」= is_anonymous:
--   1段階目: users.scout_consent = 1 のユーザーのみが、匿名化された属性
--            （university_category / faculty_type / industry_first〜third / exam_resultsの偏差値）
--            で企業側の検索・閲覧対象になる（個人を特定できる情報は一切含まない）。
--   2段階目: 企業が匿名プロフィールに対してスカウトを送ると本レコードが is_anonymous = 1 で作成される。
--            学生がstatus='accepted'で承諾した場合のみ is_anonymous を 0 に更新し、
--            そのスカウトに限り氏名・メールアドレス等の実データを企業に開示する。
--            student側がdeclined/放置の場合は is_anonymous は 1 のまま、実データは開示されない。
-- 運営（当社）は本テーブルの状態遷移を自動化し、手動でのマッチング・推薦は行わない。
-- ============================================================
CREATE TABLE IF NOT EXISTS scouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent' | 'accepted' | 'declined' | 'withdrawn'
  title TEXT NOT NULL DEFAULT '', -- スカウトタイトル/件名
  message TEXT, -- 企業からの匿名スカウトメッセージ。個人を特定する情報を含めない運用を前提とする
  responded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES company_profiles(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_scouts_student_id ON scouts(student_id);
CREATE INDEX IF NOT EXISTS idx_scouts_company_id ON scouts(company_id);

-- ============================================================
-- 問題データ（著作権配慮版）
-- 市販本の文章・設定（人物名や具体的な数値の組み合わせ等）をそのまま転用せず、
-- 「解法ロジック（アイディア）」のみを参考に完全オリジナルで作問することを前提としたスキーマ。
-- originality_note に参照した解法ロジックの要約のみを記録し、原著作物の文章を書き写さない運用とする。
-- status により、大量生成した問題を人がレビューし published にするまでは出題対象に含めない。
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_type TEXT NOT NULL DEFAULT 'spi', -- 'spi' | 'tamatebako' | 'tgweb' | 'gab' | 'cgab' | 'cab'
  category TEXT NOT NULL, -- 分野。例: "非言語-損益算", "非言語-推論", "言語-語句"
  difficulty INTEGER NOT NULL DEFAULT 3, -- 難易度 1(易)〜5(難)
  question_text TEXT NOT NULL,
  tables_json TEXT, -- 表を伴う問題のみ、表データ(見出し・行)をJSON文字列で保持
  correct_choice TEXT NOT NULL, -- 'A' | 'B' | 'C' | 'D' | 'E'
  explanation TEXT NOT NULL, -- 解法ロジックの解説（ステップ単位で記述）
  originality_note TEXT NOT NULL, -- 著作権対応メモ: 参照した解法アイデアの要約のみを記録し、原文の転載がないことを明記する
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  created_by TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_test_type_status ON questions(test_type, status);

CREATE TABLE IF NOT EXISTS question_choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  label TEXT NOT NULL, -- 'A' | 'B' | 'C' | 'D' | 'E'
  choice_text TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX IF NOT EXISTS idx_question_choices_question_id ON question_choices(question_id);
