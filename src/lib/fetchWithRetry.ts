// 通信エラー（ネットワーク断・D1側の一時的な高負荷による5xx/429等）に対して指数バックオフで
// 自動再試行するfetchラッパー。401/400/404/409等の正当な業務エラー（4xx）は再試行しない
// （再試行しても結果が変わらないため）。最大試行回数を設けており、再試行が無限に暴走することはない。
// 呼び出し側は素の`fetch`と同じように`.then(res => res.json())`等をそのまま使える
// （リトライを使い果たした場合のみ、既存のcatch節にフォールバックする）。

export type FetchRetryOptions = {
  // 追加の再試行回数（初回を含まない）。デフォルト2（計3回まで試行）。
  retries?: number;
  // 初回リトライまでの基準待機時間（ミリ秒）。以降は指数的に増加する。
  baseDelayMs?: number;
};

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  options?: FetchRetryOptions
): Promise<Response> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 500;

  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    let networkError: unknown = null;
    try {
      res = await fetch(input, init);
    } catch (err) {
      networkError = err;
    }

    const shouldRetry = attempt < retries && (networkError !== null || (res !== null && isRetryableStatus(res.status)));
    if (!shouldRetry) {
      if (res) return res;
      throw networkError;
    }

    const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
    await sleep(delay);
  }
}
