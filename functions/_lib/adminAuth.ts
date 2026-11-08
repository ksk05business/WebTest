// 管理API共通のx-admin-token認証チェック。functions/api/admin/配下の各エンドポイントから共通で使う。
import { checkRateLimit, getClientIp } from "./rateLimit";

export interface AdminEnv {
  ADMIN_API_TOKEN?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

// トークン総当たり対策: 認証失敗が同一IPから短時間に集中したら、正しいトークンでも一時的に拒否する。
const FAIL_LIMIT = 10;
const FAIL_WINDOW_SECONDS = 15 * 60;

// 長さに依存せず一定時間で比較するため、SHA-256ダイジェスト同士をXOR比較する。
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function checkAdminAuth(context: {
  request: Request;
  env: AdminEnv;
}): Promise<Response | null> {
  const adminToken = context.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "管理APIが設定されていません" }, { status: 503 });
  }

  const kv = context.env.RATE_LIMIT_KV;
  const failKey = `admin-fail:${getClientIp(context.request)}`;
  // 失敗回数が上限に達しているIPは、トークンの正誤にかかわらず拒否する（読み取りのみ）。
  if (kv) {
    const failures = Number((await kv.get(failKey)) ?? 0);
    if (failures >= FAIL_LIMIT) {
      return Response.json({ error: "リクエストが多すぎます。しばらく時間をおいて再度お試しください。" }, { status: 429 });
    }
  }

  const provided = context.request.headers.get("x-admin-token") ?? "";
  if (!(await safeEqual(provided, adminToken))) {
    await checkRateLimit(kv, failKey, FAIL_LIMIT, FAIL_WINDOW_SECONDS);
    return Response.json({ error: "認証に失敗しました" }, { status: 401 });
  }
  return null;
}
