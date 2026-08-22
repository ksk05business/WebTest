// ログインセッション（学生='user' / 企業='company'）の発行・検証・破棄を担う共通ロジック。
// functions/api/login.ts, register.ts, company/login.ts で発行し、
// ユーザー・企業本人のデータを扱う各APIで検証する。クライアントから送られる
// email/companyEmailは以後の認可判定には使わず、このセッショントークンのみを信頼する。
const SESSION_TTL_DAYS = 30;

export type SubjectType = "user" | "company";

function cookieName(subjectType: SubjectType): string {
  return subjectType === "user" ? "session" : "company_session";
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function createSession(
  db: D1Database,
  subjectType: SubjectType,
  subjectId: number
): Promise<string> {
  const token = generateToken();
  await db
    .prepare(
      `INSERT INTO sessions (token, subject_type, subject_id, expires_at)
       VALUES (?, ?, ?, datetime('now', '+${SESSION_TTL_DAYS} days'))`
    )
    .bind(token, subjectType, subjectId)
    .run();
  return token;
}

// ログイン中の本人（学生ならuser.id、企業ならcompany_profiles.id）のIDを返す。
// Cookieが無い・トークンが不正・期限切れの場合はnullを返す（呼び出し側で401にする）。
export async function getAuthenticatedSubjectId(
  db: D1Database,
  request: Request,
  subjectType: SubjectType
): Promise<number | null> {
  const token = parseCookie(request, cookieName(subjectType));
  if (!token) return null;

  const row = await db
    .prepare(
      `SELECT subject_id FROM sessions
       WHERE token = ? AND subject_type = ? AND expires_at > datetime('now')`
    )
    .bind(token, subjectType)
    .first<{ subject_id: number }>();

  return row?.subject_id ?? null;
}

export async function destroySession(
  db: D1Database,
  request: Request,
  subjectType: SubjectType
): Promise<void> {
  const token = parseCookie(request, cookieName(subjectType));
  if (token) {
    await db.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
  }
}

export function sessionCookieHeader(subjectType: SubjectType, token: string): string {
  const maxAge = SESSION_TTL_DAYS * 24 * 60 * 60;
  return `${cookieName(subjectType)}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(subjectType: SubjectType): string {
  return `${cookieName(subjectType)}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
