"use client";

import { INDUSTRY_GROUPS } from "@/src/data/formOptions";

export function IndustrySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      >
        <option value="">選択してください</option>
        {INDUSTRY_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
