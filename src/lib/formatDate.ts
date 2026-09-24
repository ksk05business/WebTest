// "2026-09-01" のようなISO日付（YYYY-MM-DD）を「2026年9月1日」表記に変換する。
// 変換できない場合は元の文字列をそのまま返す。
export function formatJapaneseDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}

// 秒数を「分:秒」（例: 125→"2:05"）に変換する。模試の残り時間（app/test/page.tsx）・
// 練習問題の経過時間（app/practice/page.tsx）の表示で、どちらも同じロジックを使っていたため共通化した。
export function formatDurationMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// D1のdatetime('now')（"YYYY-MM-DD HH:MM:SS"形式、UTC）を「YYYY/MM/DD HH:mm」
// （ブラウザのローカル時刻）表記に変換する。変換できない場合は元の文字列をそのまま返す。
export function formatDateTime(sqliteUtc: string): string {
  const d = new Date(`${sqliteUtc.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return sqliteUtc;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}
