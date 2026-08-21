"use client";

import { useState } from "react";

export function LimitedCheckboxGroup({
  label,
  options,
  selected,
  onChange,
  max,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
  max: number;
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
      <div className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-white p-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm font-normal text-gray-700">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => handleToggle(o)}
            />
            {o}
          </label>
        ))}
      </div>
      {warning && <p className="text-xs font-medium text-red-600">{warning}</p>}
    </div>
  );
}
