import type { ReactNode } from "react";

// MDX記事内で「ここが重要」という要約・まとめを視覚的に強調するボックス。
// <PointBox>本文</PointBox> または <PointBox label="注意">本文</PointBox> のように使う。
export function PointBox({ label = "ポイント", children }: { label?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-4 rounded-r-md border-l-4 border-blue-500 bg-blue-50 px-4 py-2.5">
      <p className="mb-0.5 text-sm font-bold text-blue-700">{label}</p>
      <div className="text-sm leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}
