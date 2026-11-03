import { sendGAEvent } from "@next/third-parties/google";

// GA4カスタムイベント送信の共通ヘルパー。gtag未読込（広告ブロッカー等）でも例外を出さない。
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  try {
    sendGAEvent("event", name, params);
  } catch {
    // 計測失敗でユーザー操作を止めない
  }
}
