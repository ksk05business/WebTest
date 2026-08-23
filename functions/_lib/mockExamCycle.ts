// 模擬試験（本番モード）の受験制限: テスト種別ごとに「2ヶ月に1回・奇数月1日 0:00 UTCに一斉リセット」。
// 期間は 奇数月1日〜次の奇数月1日の前日 の2ヶ月間（例: 9/1〜10/31、11/1〜12/31、1/1〜2/28等）。
// 「追加チケット」等の受験回数を増やす仕組みは廃止し、この周期リセットのみで受験可否を判定する。

export type ExamEligibility = {
  eligible: boolean;
  lastTakenAt: string | null;
  periodStart: string; // ISO日付（YYYY-MM-DD）
  nextResetAt: string; // ISO日付（YYYY-MM-DD）
};

export const MOCK_EXAM_TEST_TYPES = ["spi", "tamatebako", "tgweb", "gab_cgab", "cab", "scoa"] as const;

// 指定日時が属する期間の開始日（直近の奇数月1日 0:00 UTC）を返す。
export function getCurrentPeriodStart(now: Date): Date {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-12
  const periodStartMonth = month % 2 === 1 ? month : month - 1; // 奇数月ならその月、偶数月なら前月（＝直近の奇数月）
  return new Date(Date.UTC(year, periodStartMonth - 1, 1));
}

// 現在の期間の次のリセット日（次の奇数月1日 0:00 UTC）を返す。
export function getNextResetDate(now: Date): Date {
  const start = getCurrentPeriodStart(now);
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 2);
  return next;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// SQLiteのdatetime('now')形式（"YYYY-MM-DD HH:MM:SS", UTC想定）をDateに変換する。
function parseSqliteUtcDatetime(value: string): Date {
  return new Date(`${value.replace(" ", "T")}Z`);
}

// 指定ユーザー・テスト種別について、今期（直近の奇数月1日以降）に本番模試（exam_results）を
// 受験済みかどうかを判定する。未受験、または前回受験が期間開始より前（＝自動リセット対象）ならeligible=trueを返す。
export async function checkExamEligibility(
  db: D1Database,
  userId: number,
  testType: string
): Promise<ExamEligibility> {
  const now = new Date();
  const periodStart = getCurrentPeriodStart(now);
  const nextResetAt = getNextResetDate(now);

  const row = await db
    .prepare(
      "SELECT taken_at FROM exam_results WHERE user_id = ? AND test_type = ? ORDER BY taken_at DESC LIMIT 1"
    )
    .bind(userId, testType)
    .first<{ taken_at: string }>();

  const lastTakenAt = row?.taken_at ?? null;
  const eligible = !lastTakenAt || parseSqliteUtcDatetime(lastTakenAt) < periodStart;

  return {
    eligible,
    lastTakenAt,
    periodStart: toIsoDate(periodStart),
    nextResetAt: toIsoDate(nextResetAt),
  };
}
