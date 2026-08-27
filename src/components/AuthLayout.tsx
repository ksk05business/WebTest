import type { ReactNode } from "react";
import Link from "next/link";
import { Brain, ShieldCheck, Target } from "lucide-react";

const FEATURES = [
  { icon: Target, text: "高精度模試で弱点をあぶり出す" },
  { icon: ShieldCheck, text: "2段階開示で安心のスカウト受信" },
  { icon: Brain, text: "忘却曲線に基づく反復復習に対応" },
];

// ログイン・会員登録ページ共通のビジュアルレイアウト。
// デスクトップでは左にグラデーションのビジュアルパネル、右にフォームカードを並べる。
// モバイルではビジュアルパネルは非表示にし、コンパクトなロゴのみをフォーム上部に表示する。
export function AuthLayout({
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-md",
  outerPaddingClassName = "py-10",
  cardPaddingClassName = "p-8 sm:p-10",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  // フォームカードの最大幅。項目数が多い会員登録画面など、既定の"max-w-md"より
  // 広いレイアウトが必要な場合に上書きする（ログイン画面は既定値のまま）。
  maxWidthClassName?: string;
  // 外枠（画面全体）の上下余白。縦幅を節約したい画面向けに上書きできる。
  outerPaddingClassName?: string;
  // フォームカード自体の内側余白。縦幅を節約したい画面向けに上書きできる。
  cardPaddingClassName?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-10 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-2/5 lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <Link href="/" className="relative z-10 text-2xl font-bold">
          Webテスト<span className="text-blue-200">ナビ</span>
        </Link>

        <div className="relative z-10 flex flex-col gap-7">
          <h2 className="text-3xl font-bold leading-snug text-balance">
            主要Webテストの高精度模試で弱点を克服し、
            <br />
            優良企業からのスカウトを獲得しよう
          </h2>
          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li
                key={f.text}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur-sm"
              >
                <f.icon className="h-5 w-5 flex-shrink-0 text-blue-100" />
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-blue-100">&copy; Webテストナビ</p>
      </div>

      <div className={`flex flex-1 flex-col items-center justify-center px-6 ${outerPaddingClassName}`}>
        <Link
          href="/"
          className="mb-6 text-2xl font-bold text-blue-700 lg:hidden"
        >
          Webテスト<span className="text-gray-900">ナビ</span>
        </Link>

        <div
          className={`w-full ${maxWidthClassName} rounded-2xl border border-gray-200 bg-white/90 ${cardPaddingClassName} shadow-xl shadow-blue-900/5 backdrop-blur-sm`}
        >
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
