// エビングハウスの忘却曲線を意識した簡易間隔反復スケジュール。
// stageは「完了済みの復習回数」を表す（0=まだ1回も復習していない）。
// 正解して到達したstageに応じて、次回復習までの日数を返す。stage4（4回目復習正解）でnullを返し卒業扱いとする。
const INTERVAL_DAYS_AFTER_STAGE: Record<number, number> = {
  1: 3, // 1回目復習完了 → 2回目復習まで3日
  2: 7, // 2回目復習完了 → 3回目復習まで7日
  3: 14, // 3回目復習完了 → 4回目復習まで14日
};

export const INITIAL_REVIEW_INTERVAL_DAYS = 1; // 間違えてキューに入ってから1回目復習まで1日
export const MASTERED_STAGE = 4;

export function nextIntervalDaysAfterStage(newStage: number): number | null {
  if (newStage >= MASTERED_STAGE) return null;
  return INTERVAL_DAYS_AFTER_STAGE[newStage] ?? null;
}

// datetime('now', ?) にバインドするための修飾子文字列（例: "+3 days"）。
export function daysFromNowModifier(days: number): string {
  return `+${days} days`;
}
