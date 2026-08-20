"use client";

import { useEffect, useState } from "react";
import { MANUAL_ENTRY_UNIVERSITIES, UNIVERSITIES } from "@/src/data/universities";

const UNIVERSITY_OPTIONS = [...UNIVERSITIES, ...MANUAL_ENTRY_UNIVERSITIES];

export function UniversityField({
  value,
  onChange,
  onManualCategoryChange,
  initialManualCategory,
}: {
  value: string;
  onChange: (value: string) => void;
  // 手動入力（その他国公立大学/その他私立大学/海外大学）を選んだ場合に、選んだ区分を
  // 親コンポーネントへ伝える。大学名一覧から選び直した場合はnullを渡す。
  onManualCategoryChange?: (category: string | null) => void;
  // マイページ等、既に手動入力の大学区分が保存されている場合の初期表示用。
  initialManualCategory?: string | null;
}) {
  const [manualLabel, setManualLabel] = useState<string | null>(initialManualCategory ?? null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  // 非同期取得（マイページのプロフィール読み込みなど）でvalueが後から確定するケースに対応。
  // ユーザーが検索文字を入力した際はonChange("")で一旦valueが空になるため、
  // value が空のときは同期しない（入力中の文字がリセットされてしまうのを防ぐ）。
  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  useEffect(() => {
    if (initialManualCategory) setManualLabel(initialManualCategory);
  }, [initialManualCategory]);

  if (manualLabel) {
    return (
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${manualLabel}の大学名を入力してください`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
        <button
          type="button"
          onClick={() => {
            setManualLabel(null);
            setQuery("");
            onChange("");
            onManualCategoryChange?.(null);
          }}
          className="self-start text-xs text-blue-600 underline"
        >
          一覧から選び直す
        </button>
      </div>
    );
  }

  const filtered =
    query.trim() === ""
      ? UNIVERSITY_OPTIONS
      : UNIVERSITY_OPTIONS.filter((u) => u.includes(query.trim()));

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="大学名を入力して検索"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">該当する大学がありません</li>
          )}
          {filtered.map((u) => (
            <li key={u}>
              <button
                type="button"
                onMouseDown={() => {
                  if (MANUAL_ENTRY_UNIVERSITIES.includes(u)) {
                    setManualLabel(u);
                    onChange("");
                    onManualCategoryChange?.(u);
                    setOpen(false);
                    return;
                  }
                  onChange(u);
                  setQuery(u);
                  onManualCategoryChange?.(null);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-blue-50"
              >
                {u}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
