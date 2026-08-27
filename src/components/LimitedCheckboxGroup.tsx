"use client";

import { useState } from "react";

export function LimitedCheckboxGroup({
  label,
  options,
  selected,
  onChange,
  max,
  compact,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  max: number;
  // trueの場合、2列グリッド・詰めた余白のコンパクト表示にする（会員登録画面向け）。
  // 未指定の場合は既存の見た目（マイページ等）を維持する。
  compact?: boolean;
}) {
  const [warning, setWarning] = useState<string | null>(null);

  function handleToggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      setWarning(null);
      return;
    }
    if (selected.length >= max) {
      setWarning(`最大${max}つまで選択できます`);
      return;
    }
    setWarning(null);
    onChange([...selected, value]);
  }

  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <div
        className={
          compact
            ? "grid grid-cols-2 gap-x-2 gap-y-0.5 rounded-lg border border-gray-300 bg-white p-1.5"
            : "flex flex-col gap-1 rounded-lg border border-gray-300 bg-white p-2"
        }
      >
        {options.map((o) => (
          <label
            key={o}
            className={
              compact
                ? "flex min-h-8 items-center gap-1.5 rounded-md px-1 text-xs font-normal leading-tight text-gray-700 hover:bg-gray-50"
                : "flex min-h-12 items-center gap-2 rounded-md px-1 text-sm font-normal text-gray-700 hover:bg-gray-50"
            }
          >
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => handleToggle(o)}
              className="h-4 w-4 flex-shrink-0 accent-blue-600"
            />
            {o}
          </label>
        ))}
      </div>
      {warning && <p className="text-xs font-medium text-red-600">{warning}</p>}
    </div>
  );
}
