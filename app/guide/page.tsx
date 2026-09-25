import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { GUIDE_ARTICLES } from "@/src/data/guideArticles";
import { SITE_NAME } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "Webテスト単元別 解き方ガイド一覧",
  description:
    "SPI・玉手箱の各単元（推論、四則逆算、論理的読解など）ごとの解き方・対策のコツをまとめた無料ガイド一覧です。",
  alternates: { canonical: "/guide" },
};

export default function GuideIndexPage() {
  const groups = new Map<string, typeof GUIDE_ARTICLES>();
  for (const article of GUIDE_ARTICLES) {
    const key = `${article.testLabel}／${article.groupLabel}`;
    const list = groups.get(key);
    if (list) list.push(article);
    else groups.set(key, [article]);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-blue-700">
            Webテスト<span className="text-gray-900">ナビ</span>
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
          >
            無料登録
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Webテスト単元別 解き方ガイド
            </h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              {SITE_NAME}が単元ごとにまとめた解き方・対策のコツです。気になる単元をタップして、頻出パターンとよくあるミスを確認しましょう。
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {Array.from(groups.entries()).map(([groupKey, articles]) => (
              <section key={groupKey}>
                <h2 className="mb-4 text-lg font-bold text-gray-900">{groupKey}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/guide/${article.slug}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        <p className="font-bold text-gray-900">{article.unitLabel}</p>
                        <p className="mt-1 text-xs text-gray-500">{article.metaDescription.slice(0, 44)}…</p>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
