"use client";

import { TrackedLink } from "@/src/components/TrackedLink";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME } from "@/src/lib/site";
import { BLOG_CATEGORY_ORDER, getBlogCategoryLabel, getBlogSubtags } from "@/src/data/tagTaxonomy";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { BackLink } from "@/src/components/BackLink";

// 折りたたみ前に表示するサブタグの最大数（超える場合は「もっと見る」で全件表示に切り替える）。
const SUBTAG_COLLAPSE_LIMIT = 16;

type BlogListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
};

// src/lib/blog.tsのformatBlogDate()と同じロジック。blog.tsはnode:fsに依存しており
// クライアントコンポーネントからimportするとビルドが壊れるため、この関数だけこちらに複製する。
function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export function BlogIndexClient({ posts }: { posts: BlogListItem[] }) {
  const [loggedIn, setLoggedIn] = useState(false);
  // 第1階層（メインカテゴリー）。デフォルトは常に「すべて」。
  const [category, setCategory] = useState("すべて");
  // 第2階層（サブタグ）。カテゴリーを切り替えたら必ずリセットする
  // （切り替え後のカテゴリーにそのサブタグが存在せず、記事が0件のまま表示され続けるのを防ぐため）。
  const [subtag, setSubtag] = useState<string | null>(null);
  const [showAllSubtags, setShowAllSubtags] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("spiUser"));
  }, []);

  // 一覧はgetAllBlogPosts()（src/lib/blog.ts）の時点で公開日時の降順（最新順）にソート済みで、
  // ここでは並び順を変えずにそのまま使う。
  const latestPosts = posts.slice(0, 3);

  // 第1階層は「すべて」＋固定9カテゴリー（BLOG_CATEGORY_ORDER）を常に表示する。
  // 現時点で該当記事が0件のカテゴリーがあっても、今後追加される前提のタクソノミーとして出しておく。
  const categories = ["すべて", ...BLOG_CATEGORY_ORDER];

  const postsInCategory = useMemo(
    () => (category === "すべて" ? posts : posts.filter((p) => getBlogCategoryLabel(p.tags) === category)),
    [posts, category],
  );

  // 第2階層（サブタグ）。選択中カテゴリー配下の記事だけから、使用頻度順にタグ候補を集計する。
  const subtags = useMemo(() => getBlogSubtags(postsInCategory, category), [postsInCategory, category]);
  const visibleSubtags = showAllSubtags ? subtags : subtags.slice(0, SUBTAG_COLLAPSE_LIMIT);

  const filteredPosts = useMemo(
    () => (subtag ? postsInCategory.filter((p) => p.tags.includes(subtag)) : postsInCategory),
    [postsInCategory, subtag],
  );

  function handleCategoryChange(next: string) {
    setCategory(next);
    setSubtag(null);
    setShowAllSubtags(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {loggedIn ? (
        <DashboardHeader />
      ) : (
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-bold text-blue-700">
              Webテスト<span className="text-gray-900">ナビ</span>
            </Link>
            <TrackedLink
              location="header"
              href="/register"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              無料登録
            </TrackedLink>
          </div>
        </header>
      )}

      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {loggedIn && (
            <div className="mb-6">
              <BackLink href="/dashboard" label="ダッシュボードへ戻る" />
            </div>
          )}

          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">ブログ / コラム</h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              {SITE_NAME}が発信する、SPI・玉手箱等の解き方・対策のコツをまとめた記事です。
            </p>
          </div>

          <section className="mb-14">
            <h2 className="mb-4 text-base font-bold text-gray-900 sm:text-lg">最新記事</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex flex-col gap-2 rounded-xl border-2 border-blue-100 bg-blue-50/60 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <span className="w-fit rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    NEW
                  </span>
                  <p className="font-bold text-gray-900">{post.title}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{post.description}</p>
                  <p className="mt-auto pt-1 text-[11px] text-gray-400">{formatDate(post.date)}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-base font-bold text-gray-900 sm:text-lg">カテゴリーから探す</h2>
            <div className={`flex flex-wrap gap-2 ${subtags.length > 0 ? "mb-3" : "mb-5"}`}>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCategoryChange(c)}
                  className={
                    category === c
                      ? "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white"
                      : "rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {subtags.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-1.5 border-l-2 border-blue-100 pl-3">
                <button
                  type="button"
                  onClick={() => setSubtag(null)}
                  className={
                    subtag === null
                      ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      : "rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                  }
                >
                  すべて
                </button>
                {visibleSubtags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSubtag(tag)}
                    className={
                      subtag === tag
                        ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        : "rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                    }
                  >
                    {tag} <span className="text-gray-400">{count}</span>
                  </button>
                ))}
                {!showAllSubtags && subtags.length > SUBTAG_COLLAPSE_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllSubtags(true)}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    もっと見る（+{subtags.length - SUBTAG_COLLAPSE_LIMIT}）
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {filteredPosts.length === 0 && (
                <p className="text-sm text-gray-400">このカテゴリーの記事はまだありません。</p>
              )}
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="font-bold text-gray-900">{post.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{post.description}</p>
                    <p className="mt-2 text-[11px] text-gray-400">{formatDate(post.date)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
