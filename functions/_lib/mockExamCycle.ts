// 模擬試験（本番モード）の受験制限: テスト種別ごとに「2ヶ月に1回・奇数月1日 0:00 UTCに一斉リセット」。
// 期間は 奇数月1日〜次の奇数月1日の前日 の2ヶ月間（例: 9/1〜10/31、11/1〜12/31、1/1〜2/28等）。
// 「追加チケット」等の受験回数を増やす仕組みは廃止し、この周期リセットのみで受験可否を判定する。

export type ExamEligibility = {
  eligible: boolean;
  lastTakenAt: string | null;
  periodStart: string; // ISO日付（YYYY-MM-DD）
  nextResetAt: string; // ISO日付（YYYY-MM-DD）
};

// SPIの本番模試は「基礎能力試験（言語・非言語）」「英語」「構造把握」の3パートに分けて受験する仕様のため、
// 単一の"spi"ではなくパートごとに独立したtest_typeを用いる（受験可否・偏差値母集団もパートごとに別集計される）。
// 玉手箱・TG-WEB・GAB/C-GABは2026-09-01以降、形式・セクションごとに独立して受験できる方式に変更した
// ため、旧来の1テスト1test_type（tamatebako, tgweb_traditional, tgweb_new, gab_cgab）は廃止し、
// セクション単位の細かいtest_typeに置き換えている（app/test/page.tsxのEXAM_PARTS参照）。
export const MOCK_EXAM_TEST_TYPES = [
  "spi_basic",
  "spi_english",
  "spi_structural",
  "tamatebako_math_arithmetic",
  "tamatebako_math_graph",
  "tamatebako_math_table",
  "tamatebako_verbal_gab",
  "tamatebako_verbal_images",
  "tamatebako_verbal_summary",
  "tamatebako_english_gab",
  "tamatebako_english_images",
  "tgweb_traditional_verbal",
  "tgweb_traditional_nonverbal",
  "tgweb_new_verbal",
  "tgweb_new_nonverbal",
  "tgweb_english",
  "gab_verbal_exam",
  "gab_quantitative_exam",
  "gab_english_exam",
  "cab",
  "scoa",
] as const;

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
