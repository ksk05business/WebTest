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
