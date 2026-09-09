import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

// MDX記事内でメリット等を箇条書き（チェックマーク付き）で見せるためのコンポーネント。
// <CheckList><CheckItem>...</CheckItem><CheckItem>...</CheckItem></CheckList> のように使う。
export function CheckList({ children }: { children: ReactNode }) {
  return <ul className="not-prose my-6 flex flex-col gap-2.5">{children}</ul>;
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed text-gray-700">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}
