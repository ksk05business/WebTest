// 従量課金が発生しうる外部API（現状はfunctions/api/forgot-password.tsのCloudflare Email
// Sending REST API呼び出しのみ）への悪用（大量リクエストによる高額請求）を防ぐための
// 固定ウィンドウ方式のレートリミット。Cloudflare KV（RATE_LIMIT_KV、wrangler.jsonc参照）を使う。
// KVは書き込みが結果整合性（同一キーへの高頻度書き込みは非推奨）のため、多少のカウント漏れを
// 許容する前提の「大まかな」防御であり、暗号的に厳密なカウンタではない。この用途では十分。
export type RateLimitResult = { allowed: boolean; remaining: number };

export async function checkRateLimit(
  kv: KVNamespace | undefined,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  // KVバインディングが無い（ローカルでnamespaceを作り忘れた等）場合は、機能停止ではなく
  // フェイルオープン（許可）にする。レートリミットは防御の追加層であり、これ自体の欠落で
  // 既存機能（パスワード再設定）を止めてはならない。
  if (!kv) {
    return { allowed: true, remaining: limit };
  }

  const raw = await kv.get(key);
  const count = raw ? Number(raw) : 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return { allowed: true, remaining: limit - count - 1 };
}

export function getClientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "unknown";
}
