import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { formatBlogDate, getAllBlogPosts } from "@/src/lib/blog";
import { SITE_NAME } from "@/src/lib/site";

export const metadata: Metadata = {
  title: "Webテスト対策ブログ",
  description: "SPI3・玉手箱など主要Webテストの解き方・対策のコツを解説する記事一覧です。",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

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
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Webテスト対策ブログ</h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              {SITE_NAME}が発信する、SPI3・玉手箱等の解き方・対策のコツをまとめた記事です。
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <p className="font-bold text-gray-900">{post.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{post.description}</p>
                  <p className="mt-2 text-[11px] text-gray-400">{formatBlogDate(post.date)}</p>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
