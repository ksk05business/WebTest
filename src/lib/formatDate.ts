// "2026-09-01" のようなISO日付（YYYY-MM-DD）を「2026年9月1日」表記に変換する。
// 変換できない場合は元の文字列をそのまま返す。
export function formatJapaneseDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}
