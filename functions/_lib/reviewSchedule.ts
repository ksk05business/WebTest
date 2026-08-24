// エビングハウスの忘却曲線を意識した間隔反復スケジュール。
// stageは「完了済みの復習回数」を表す（0=まだ1回も復習していない、新規追加直後）。
// 正解して到達したstageに応じて、次回復習までの日数を返す。stage6（5回目復習正解）でnullを返し卒業扱いとする。
//
// スケジュール: 新規追加（不正解）→当日中（0日後）に出題対象 → 正解のたびに 1日後→3日後→7日後→14日後→30日後
// と間隔を延ばし、5回連続正解でMASTERED_STAGEに到達し出題対象から外れる。
// 復習中に間違えた場合はstageを0に戻し、1日後に再度出題する（INCORRECT_RESET_INTERVAL_DAYS）。
const INTERVAL_DAYS_AFTER_STAGE: Record<number, number> = {
  1: 1, // 1回目復習正解 → 2回目復習まで1日
  2: 3, // 2回目復習正解 → 3回目復習まで3日
  3: 7, // 3回目復習正解 → 4回目復習まで7日
  4: 14, // 4回目復習正解 → 5回目復習まで14日
  5: 30, // 5回目復習正解 → 6回目復習まで30日
};

// 練習問題・模試で新たに間違えた問題をキューに追加する際の初回間隔。
// 「当日」出題対象とするため0日（＝即座に復習対象）とする。
export const INITIAL_REVIEW_INTERVAL_DAYS = 0;
// 復習セッション中に再度間違えた場合にリセットする間隔（1日後）。
export const INCORRECT_RESET_INTERVAL_DAYS = 1;
export const MASTERED_STAGE = 6;

export function nextIntervalDaysAfterStage(newStage: number): number | null {
  if (newStage >= MASTERED_STAGE) return null;
  return INTERVAL_DAYS_AFTER_STAGE[newStage] ?? null;
}

// datetime('now', ?) にバインドするための修飾子文字列（例: "+3 days"）。
export function daysFromNowModifier(days: number): string {
  return `+${days} days`;
}
