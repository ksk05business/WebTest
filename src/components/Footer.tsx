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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-zinc-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          {/* ブランドエリア */}
          <div>
            <Link href="/" className="text-xl font-bold text-white">
              Webテスト<span className="text-blue-400">ナビ</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
              参考書を買わずに、SPI3・玉手箱・TG-WEBなど主要Webテストを完全無料で対策できる就活生向け模試プラットフォーム。
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
