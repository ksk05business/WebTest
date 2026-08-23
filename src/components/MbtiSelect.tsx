"use client";

import { MBTI_GROUP_LABELS, MBTI_GROUP_ORDER, MBTI_TYPES } from "@/src/data/mbti";

// MBTI（16タイプ）選択用のドロップダウン。value="" は「わからない/回答しない」を表す（任意項目）。
// 登録画面・マイページの双方から共通で利用する。
export function MbtiSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">わからない / 回答しない</option>
      {MBTI_GROUP_ORDER.map((group) => (
        <optgroup key={group} label={MBTI_GROUP_LABELS[group]}>
          {MBTI_TYPES.filter((t) => t.group === group).map((t) => (
            <option key={t.code} value={t.code}>
              {t.code} ({t.nickname})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
