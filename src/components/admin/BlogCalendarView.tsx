"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type AdminBlogPostListItem, getPostStatus, getTokyoDateParts } from "./BlogPostsTab";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_STYLE: Record<string, string> = {
  published: "bg-green-100 text-green-800 hover:bg-green-200",
  scheduled: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  draft: "bg-gray-200 text-gray-600 hover:bg-gray-300",
};

type DayCell = {
  year: number;
  month: number; // 0-11（表示中の月と異なる場合は前後月の埋めマス）
  day: number;
  dateKey: string; // "YYYY-MM-DD"（Asia/Tokyo基準の記事日付と突き合わせるキー）
};

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { year: yyyy, month: d.getMonth(), day: d.getDate(), dateKey: `${yyyy}-${mm}-${dd}` };
  });
}

// 記事一覧APIのdate（ISO文字列）から、Asia/Tokyo基準の"YYYY-MM-DD"キーと"HH:mm"表示を求める。
// カレンダーのマス目キー（buildMonthGridが生成するdateKey）と同じ形式にそろえることで、
// 管理者のブラウザのタイムゾーンに関わらず常に日本時間の日付・時刻で振り分けられるようにする。
function toTokyoBucket(dateStr: string): { dateKey: string; timeLabel: string } | null {
  const parts = getTokyoDateParts(dateStr);
  if (!parts) return null;
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, timeLabel: `${parts.hour}:${parts.minute}` };
}

// ブログ記事管理タブの「どの記事がどの日付の何時に公開予定か」を一覧できる月表示カレンダー。
// 色分け: 緑=公開中／アンバー=予約公開（未来日時）／グレー=非公開。クリックで編集モーダルを開く
// （記事取得・保存フローはBlogPostsTab側のopenEditをそのまま再利用する）。
export function BlogCalendarView({
  posts,
  onSelectPost,
}: {
  posts: AdminBlogPostListItem[];
  onSelectPost: (post: AdminBlogPostListItem) => void;
}) {
  const today = useMemo(() => getTokyoDateParts(new Date().toISOString())!, []);
  const [cursor, setCursor] = useState(() => ({ year: Number(today.year), month: Number(today.month) - 1 }));

  const postsByDay = useMemo(() => {
    const map = new Map<string, { post: AdminBlogPostListItem; timeLabel: string }[]>();
    for (const post of posts) {
      const bucket = toTokyoBucket(post.date);
      if (!bucket) continue;
      const list = map.get(bucket.dateKey) ?? [];
      list.push({ post, timeLabel: bucket.timeLabel });
      map.set(bucket.dateKey, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
    }
    return map;
  }, [posts]);

  const cells = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const todayKey = `${today.year}-${today.month}-${today.day}`;

  function goToMonth(diff: number) {
    setCursor((prev) => {
      const base = new Date(prev.year, prev.month + diff, 1);
      return { year: base.getFullYear(), month: base.getMonth() };
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="前の月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="w-28 text-center text-sm font-bold text-gray-900">
            {cursor.year}年{cursor.month + 1}月
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="次の月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCursor({ year: Number(today.year), month: Number(today.month) - 1 })}
          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          今月
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          公開
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          予約公開
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          非公開
        </span>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-gray-200">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="border-b border-gray-200 bg-gray-50 py-1.5 text-center text-xs font-semibold text-gray-500">
            {w}
          </div>
        ))}
        {cells.map((cell) => {
          const inCurrentMonth = cell.month === cursor.month;
          const isToday = cell.dateKey === todayKey;
          const dayPosts = postsByDay.get(cell.dateKey) ?? [];
          return (
            <div
              key={cell.dateKey}
              className={`min-h-[92px] border-b border-r border-gray-100 p-1.5 last:border-r-0 ${
                inCurrentMonth ? "bg-white" : "bg-gray-50"
              }`}
            >
              <p
                className={`text-xs ${
                  isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 font-bold text-white"
                    : inCurrentMonth
                      ? "font-medium text-gray-600"
                      : "text-gray-300"
                }`}
              >
                {cell.day}
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {dayPosts.map(({ post, timeLabel }) => (
                  <button
                    key={post.slug}
                    type="button"
                    onClick={() => onSelectPost(post)}
                    title={post.title}
                    className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${STATUS_STYLE[getPostStatus(post)]}`}
                  >
                    {timeLabel} {post.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
