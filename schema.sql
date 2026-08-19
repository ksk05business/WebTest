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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
