// 企業・エージェント申請フォームでの「会社用メールアドレス」チェック用。
// フリーメール／個人向けメールサービスの代表的なドメインを列挙する（網羅的ではない簡易ブロックリスト）。
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
