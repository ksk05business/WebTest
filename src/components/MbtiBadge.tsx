import { getMbtiLabel } from "@/src/data/mbti";

// 「ENTJ (指揮官)」形式のバッジ表示。未登録・不正な値の場合は何も表示しない。
export function MbtiBadge({ code, className }: { code: string | null | undefined; className?: string }) {
  const label = getMbtiLabel(code);
  if (!label) return null;
  return (
    <span
      className={`rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ${className ?? ""}`}
    >
      {label}
    </span>
  );
}
