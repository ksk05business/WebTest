import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  // trueの場合、高さ・余白を詰めたコンパクト表示にする（会員登録画面など縦幅を節約したい場面向け）。
  // 未指定の場合は既存の見た目（ログイン画面等）を維持する。
  compact?: boolean;
};

// メール・パスワード・氏名などの入力欄に共通のアイコン付きスタイルを適用する。
export function IconInput({ icon: Icon, className, compact, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className={`pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400`}
      />
      <input
        {...props}
        className={`w-full rounded-xl border border-gray-300 pl-10 pr-3 text-gray-900 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
          compact ? "min-h-9 py-1.5" : "min-h-12 py-2.5"
        } ${className ?? ""}`}
      />
    </div>
  );
}
