"use client";

import { useEffect, useState } from "react";
import { MANUAL_ENTRY_UNIVERSITIES, UNIVERSITIES } from "@/src/data/universities";

const UNIVERSITY_OPTIONS = [...UNIVERSITIES, ...MANUAL_ENTRY_UNIVERSITIES];

export function UniversityField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [manualLabel, setManualLabel] = useState<string | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  // 非同期取得（マイページのプロフィール読み込みなど）でvalueが後から確定するケースに対応。
  // ユーザーが検索文字を入力した際はonChange("")で一旦valueが空になるため、
  // value が空のときは同期しない（入力中の文字がリセットされてしまうのを防ぐ）。
  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

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
                    setOpen(false);
                    return;
                  }
                  onChange(u);
                  setQuery(u);
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
