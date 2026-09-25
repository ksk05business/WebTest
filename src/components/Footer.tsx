import Link from "next/link";
import { PolicyModalLink } from "@/src/components/PolicyModalLink";

const LINK_COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "サービス",
    links: [
      { href: "/", label: "トップページ" },
      { href: "/guide", label: "単元別解き方ガイド" },
      { href: "/blog", label: "お役立ちブログ" },
    ],
  },
  {
    heading: "情報",
    links: [
      { href: "/terms", label: "利用規約" },
      { href: "/privacy", label: "プライバシーポリシー" },
    ],
  },
  {
    heading: "企業・サポート",
    links: [
      { href: "/company/apply", label: "企業様はこちら" },
      { href: "/contact", label: "お問い合わせ" },
    ],
  },
];

const INFO_COLUMN_HEADING = "情報";

const LINK_CLASS = "text-gray-400 transition-colors hover:text-white";

// app/icon.svg（サービスのファビコン/アプリアイコン）と同じマークをインラインSVGで複製したもの。
// 自身のグラデーション背景を持つ自己完結型のアイコンのため、ダークテーマのフッター上でも
// 単色版を別途用意せずそのまま視認性を確保できる。
function ServiceLogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="footer-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#footer-logo-gradient)" />
      <polygon points="32,9 39,32 32,55 25,32" fill="#ffffff" />
      <polygon points="9,32 32,25 55,32 32,39" fill="#ffffff" opacity="0.55" />
      <circle cx="32" cy="32" r="4.5" fill="#3b82f6" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-zinc-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          {/* ブランドエリア */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <ServiceLogoMark className="h-8 w-8" />
              <span className="text-xl font-bold text-white">
                Webテスト<span className="text-blue-400">ナビ</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              参考書を買わずに、SPI・玉手箱・TG-WEBなど主要Webテストを完全無料で対策できる就活生向け模試プラットフォーム。
              スマホひとつで、スキマ時間に本番形式の練習ができます。
            </p>
          </div>

          {/* リンクエリア（3カラム） */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {LINK_COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-semibold text-gray-100">{col.heading}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_CLASS}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {col.heading === INFO_COLUMN_HEADING && (
                    <li>
                      <PolicyModalLink className={LINK_CLASS}>問題作成ポリシー</PolicyModalLink>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* サブフッター */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-2 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:justify-between">
          <p>&copy; {year} Webテストナビ</p>
          <p>日本語</p>
        </div>
      </div>
    </footer>
  );
}
