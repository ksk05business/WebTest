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
  -- MBTI（16タイプ性格診断）のコード（例: "ENTJ"）。任意入力のためNULL許容。
  -- 通称和名（例: "指揮官"）や4グループ（分析家・外交官・管理者・探検家）へのマッピングは
  -- src/data/mbti.ts で管理し、DBにはコード文字列のみを保存する。
  mbti TEXT,
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
  test_type TEXT NOT NULL DEFAULT 'spi', -- 'spi' | 'tamatebako' | 'tgweb' | 'gab_cgab' | 'cab' | 'scoa'
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
-- 企業アカウントは運営による審査（status）を経て 'active' にならない限りログイン自体ができない設計とする
-- （いたずら登録防止）。/company/apply からの自己申請時点では status='pending' で
-- password_hash/password_salt は空文字のプレースホルダー（NOT NULL制約を維持するため）とし、
-- 管理者が承認した時点で初期パスワードを発行してこれらを実値に更新する。
-- ============================================================
CREATE TABLE IF NOT EXISTS company_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  department TEXT, -- 担当者の部署（利用審査申請のみ収集。資料請求では未収集のためNULL）
  job_title TEXT, -- 担当者の役職（利用審査申請のみ収集。資料請求では未収集のためNULL）
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  corporate_site_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'direct_hire', -- 'direct_hire'（直接採用企業） | 'agency'（就活エージェント/人材紹介会社）。資料請求では未収集のため既定値のまま
  inquiry_message TEXT, -- 問い合わせ・利用目的（任意、利用審査申請のみ）
  password_hash TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL DEFAULT '',
  industry TEXT,
  -- 職業安定法上の事業区分。当社は職業紹介事業ではなく募集情報等提供事業として運営する前提を明示する。
  provider_business_type TEXT NOT NULL DEFAULT '募集情報等提供事業',
  -- 特定募集情報等提供事業として厚生労働省へ届出した場合の届出受理番号（未取得時はNULL）
  provider_notification_number TEXT,
  -- 'account_apply'（利用審査申請・アカウント発行希望） | 'document_request'（サービス紹介資料請求のみ、アカウントは発行しない）
  request_type TEXT NOT NULL DEFAULT 'account_apply',
  -- request_type='account_apply' の場合: 'pending'（審査待ち）| 'active'（承認済み・ログイン/スカウト利用可）| 'rejected'（却下）
  -- request_type='document_request' の場合: 'received'（受付済み・資料送付待ち）| 'handled'（資料送付等の対応済み）
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TEXT, -- 管理者が承認/却下、または資料請求への対応を完了した日時
  approved INTEGER NOT NULL DEFAULT 0, -- 非推奨（statusに置き換え済み）。既存データとの互換のためカラムのみ残す
  short_message TEXT, -- 学生向け「あなたへのおすすめ企業」に表示する25字以内のアピールメッセージ（企業プロフィール画面で設定）
  appeal_tags TEXT, -- 「あなたへのおすすめ企業」に表示するアピールタグ（src/data/formOptions.tsのAPPEAL_TAGSからの複数選択、JSON文字列配列）
  -- トークン消費型マネタイズ（functions/_lib/companyTokens.ts）。スカウト送信・おすすめ表示設定で消費する。
  token_balance INTEGER NOT NULL DEFAULT 0, -- トークン残高
  token_expires_at TEXT, -- トークンの有効期限（付与のたびに「付与日+180日」で更新。NULLまたは過去日時なら残高があっても消費不可）
  featured_until TEXT, -- 「おすすめ表示」設定の有効期限（この日時までstudent向けcompany-recommendationsで優先表示される）
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 企業トークンの増減履歴（functions/_lib/companyTokens.ts経由でのみ書き込む）
-- reason: 'review_bonus'（審査承認特典）| 'pack_purchase'（パック購入によるトークン付与）
--       | 'scout_send'（スカウト送信による消費） | 'recommendation_feature'（おすすめ表示設定による消費）
-- ============================================================
CREATE TABLE IF NOT EXISTS company_token_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  delta INTEGER NOT NULL, -- 変動数（付与は正、消費は負）
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES company_profiles(id)
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
  is_read INTEGER NOT NULL DEFAULT 0, -- 学生が詳細を開いたら1にする（未読バッジ表示用）
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
-- status により、大量生成した問題を人がレビューし published にするまでは出題対象に含めない運用も可能
-- （デフォルトは published。/test では status='published' の問題のみランダム出題する）。
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 大分類。例: "non_verbal" | "verbal" | "structural"
  sub_category TEXT NOT NULL, -- 小分類。例: "推論", "損益算", "資料の読み取り"
  title TEXT, -- 表・資料読み取り問題等につける見出し（任意）
  question_text TEXT NOT NULL,
  tables_json TEXT, -- 表を伴う問題のみ、表データ(見出し・行)をJSON文字列で保持
  options TEXT NOT NULL, -- 選択肢のJSON配列。例: ["1000円","1100円","1167円","1200円","1400円"]
  correct_answer INTEGER NOT NULL, -- optionsの正解インデックス（0始まり）
  explanation TEXT NOT NULL, -- 解説。ステップごとの文字列配列をJSON文字列として保存
  difficulty INTEGER NOT NULL DEFAULT 3, -- 難易度 1(易)〜5(難)
  status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published' | 'archived'
  originality_note TEXT, -- 著作権対応メモ: 参照した解法アイデアの要約のみを記録し、原文の転載がないことを明記する
  passage_group_id INTEGER, -- 同一の長文（パッセージ）から出題される設問をまとめるグループID（任意）。GAB形式の論理的読解など、1つの長文に複数の設問が紐づく形式で使用し、出題時にグループ内の問題が常に連続するようにする
  image_data_uri TEXT, -- 図表読み取り問題等で使うグラフ画像（data:image/png;base64,...形式）。R2等の外部ストレージは未導入のため、当面はD1に直接テキストとして保持する
  -- 管理者ダッシュボードの問題検品機能で「内容確認済み」としてチェックしたかどうか（0/1）。
  is_reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questions_passage_group ON questions(passage_group_id);

CREATE INDEX IF NOT EXISTS idx_questions_category_status ON questions(category, status);

-- ============================================================
-- エビングハウスの忘却曲線に基づく反復復習キュー
-- 言語（verbal）カテゴリの問題を間違えた際に自動追加される。ユーザー×問題ごとに1行のみ保持し、
-- 復習の正解/不正解のたびに review_stage / next_review_at を更新していく（履歴は積まない）。
-- スケジュール: 初回追加→1日後に復習1回目。以後、正解するたびに次の間隔（3日→7日→14日）で
-- 次回復習日を設定し、review_stage 4到達（4回目復習に正解）で status='mastered'として出題対象から外す。
-- 不正解の場合は review_stage を0に戻し、翌日（+1日）に再度復習させる。
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  review_stage INTEGER NOT NULL DEFAULT 0, -- 完了済みの復習回数（0〜4）
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'mastered'
  last_result TEXT, -- 直近の復習結果 'correct' | 'incorrect'（未復習ならNULL）
  next_review_at TEXT NOT NULL, -- 次回復習予定日時
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_question_reviews_user_question
  ON user_question_reviews(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_reviews_due
  ON user_question_reviews(user_id, status, next_review_at);

-- ============================================================
-- 全テスト種別・全単元共通の回答履歴（POST /api/practice/history で1回答=1行を記録）。
-- user_question_reviews（言語・英語カテゴリのみ対象の忘却曲線復習キュー）とは別に、
-- テスト種別を問わずすべての解答（模試・練習問題どちらも）を記録する汎用ログ。
-- 同じ問題を複数回解いた場合は履歴を積み重ね（上書きしない）、「直近の解答が不正解の問題」を
-- answered_at降順の最新1件から動的に判定して「間違えた問題の復習」機能のソースにする。
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  test_type TEXT NOT NULL, -- 'spi' | 'tamatebako' 等（src/data/testTypes.tsのTestType.idと同じ値）
  correct INTEGER NOT NULL, -- 0 or 1
  is_practice INTEGER NOT NULL DEFAULT 1, -- 練習問題=1、模擬試験（本番モード）=0
  answered_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX IF NOT EXISTS idx_user_question_history_lookup
  ON user_question_history(user_id, test_type, question_id, answered_at);

-- ============================================================
-- 練習問題の自己評価ステータス（〇正解・理解済み/△正解・自信なし/×不正解）。
-- 1ユーザー×1問題につき1行のみ保持し、解答するたびに最新の自己評価で上書きする（履歴は積まない）。
-- 行が存在しない問題は「未回答」として扱う（このテーブルには未回答の行は作らない）。
-- 単元選択画面のステータス内訳表示（GET /api/question-status-summary）、および
-- 「不正解＋自信なしのみ復習」「未回答のみ」フィルタ（GET /api/questions の statusFilter）に使う。
-- user_question_reviews（言語・英語カテゴリの忘却曲線復習キュー）とは別物で、
-- こちらは全テスト種別・全単元を対象にした、ユーザー自身の申告ベースの定着度管理。
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'known'（〇） | 'uncertain'（△） | 'wrong'（×）
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_question_statuses_user_question
  ON user_question_statuses(user_id, question_id);

-- ============================================================
-- お問い合わせフォーム（/contact）からの送信内容。company_applications等と同様、
-- メール送信機能は未設定のため、運営が直接D1を確認する運用を前提とする。
-- 管理画面（/admin/dashboard）から一覧確認・対応ステータス更新ができる。
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unhandled', -- 'unhandled' | 'handled'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- ログインセッション（学生・企業共通）。セキュリティ監査（2026-08-22）で、多くのユーザー向けAPIが
-- クライアントから送られたemail/companyEmailをそのまま信頼して本人確認としていた問題（=メール
-- アドレスさえ分かれば他人のデータを閲覧・操作できてしまう状態）を修正するために追加した。
-- ログイン/新規登録時にランダムなトークンを発行してHttpOnly Cookieとして返し、以後の本人確認は
-- このテーブルへの照合のみで行う（クライアントが送るemailは以後の認可判定には使わない）。
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL, -- 'user'（学生） | 'company'（直接採用企業）
  subject_id INTEGER NOT NULL, -- subject_typeに応じて users.id または company_profiles.id
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions(subject_type, subject_id);
