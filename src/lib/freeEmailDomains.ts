// 企業向けフォーム（/company/apply）のクライアント側「会社用メールアドレス」即時検証用。
// functions/_lib/freeEmailDomains.ts と同内容のクライアント側ミラー（サーバー側APIからは
// 直接参照せず独立させている。desiredOccupations.ts と同じ、functions/⇔src/ 間でマスターを
// 二重管理する既存パターンに合わせたもの。ドメインを追加・削除する際は両方を修正すること）。
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.co.jp",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.jp",
  "outlook.com",
  "outlook.jp",
  "live.com",
  "live.jp",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "docomo.ne.jp",
  "ezweb.ne.jp",
  "au.com",
  "softbank.ne.jp",
  "i.softbank.jp",
  "ymobile.ne.jp",
  "rakuten.ne.jp",
  "icloud.co.jp",
]);

export function isFreeEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return FREE_EMAIL_DOMAINS.has(domain);
}
