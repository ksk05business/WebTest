CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
