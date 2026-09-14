// LINEログイン経由の新規登録では、LINEから取得できたメールアドレスの有無に関わらず、
// users.email（NOT NULL UNIQUE）を一律「未登録」として扱う。本人がマイページで実際の
// メールアドレスを入力するまでの間、この制約を満たすためのダミーアドレスを保存する。
const PLACEHOLDER_EMAIL_DOMAIN = "line-unset.shukatsu-webtest.com";

export function buildLinePlaceholderEmail(lineUserId: string): string {
  return `line-${lineUserId}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

export function isPlaceholderLineEmail(email: string): boolean {
  return email.endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}
