import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// ヘッダーのナビゲーション以外に前の画面へ戻る導線が無いサブページ（マイページ・企業向け各種設定画面等）
// の上部に置く、共通の「戻る」リンク。遷移先が明確な場合はhrefで固定の親ページへ、
// ブラウザ履歴に素直に戻ってよい場合はonClickでrouter.back()を渡す使い方を想定する。
export function BackLink({
  href,
  label = "戻る",
  onClick,
}: {
  href?: string;
  label?: string;
  onClick?: () => void;
}) {
  const className = "inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-800";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ChevronLeft className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <Link href={href ?? "/"} className={className}>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
