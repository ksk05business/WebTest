import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
};

// メール・パスワード・氏名などの入力欄に共通のアイコン付きスタイルを適用する。
export function IconInput({ icon: Icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400"
      />
      <input
        {...props}
        className={`w-full min-h-12 rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-gray-900 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
          className ?? ""
        }`}
      />
    </div>
  );
}
