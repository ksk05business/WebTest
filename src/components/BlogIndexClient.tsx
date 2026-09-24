"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME } from "@/src/lib/site";
import { BLOG_CATEGORY_ORDER, getBlogCategoryLabel, getBlogUnitLabel } from "@/src/data/tagTaxonomy";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { BackLink } from "@/src/components/BackLink";

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
  const [category, setCategory] = useState("すべて");
  // カテゴリー（テスト種類）を切り替えたら、以前選んでいた単元の絞り込みは必ずリセットする
  // （切り替え後のカテゴリーにその単元が存在せず、記事が0件のまま表示され続けるのを防ぐため）。
  const [unit, setUnit] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("spiUser"));
  }, []);

  const latestPosts = posts.slice(0, 3);

  // 実際に記事が存在するカテゴリーだけをチップとして表示する（0件のカテゴリーを出さない）。
  const categories = useMemo(() => {
    const present = new Set(posts.map((p) => getBlogCategoryLabel(p.tags)));
    return ["すべて", ...BLOG_CATEGORY_ORDER.filter((c) => present.has(c))];
  }, [posts]);

  const postsInCategory = useMemo(
    () => (category === "すべて" ? posts : posts.filter((p) => getBlogCategoryLabel(p.tags) === category)),
    [posts, category],
  );

  // 特定のテスト種類を選んだときだけ、その配下の単元（暗号・図形問題・推論など）でさらに
  // 絞り込めるようにする。単元が2種類未満（全部同じ単元、または単元タグ自体がない）場合は
  // チップを出しても意味がないため非表示にする。
  const units = useMemo(() => {
    if (category === "すべて") return [];
    const found = new Set(
      postsInCategory.map((p) => getBlogUnitLabel(p.tags, category)).filter((u): u is string => u !== null),
    );
    return found.size >= 2 ? Array.from(found) : [];
  }, [postsInCategory, category]);

  const filteredPosts = useMemo(
    () => (unit ? postsInCategory.filter((p) => getBlogUnitLabel(p.tags, category) === unit) : postsInCategory),
    [postsInCategory, unit, category],
  );

  function handleCategoryChange(next: string) {
    setCategory(next);
    setUnit(null);
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
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              無料登録
            </Link>
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
              {SITE_NAME}が発信する、SPI3・玉手箱等の解き方・対策のコツをまとめた記事です。
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
            <div className={`flex flex-wrap gap-2 ${units.length > 0 ? "mb-3" : "mb-5"}`}>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCategoryChange(c)}
                  className={
                    category === c
                      ? "rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white"
                      : "rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  }
                >
                  {c}
                </button>
              ))}
            </div>

            {units.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-1.5 border-l-2 border-blue-100 pl-3">
                <button
                  type="button"
                  onClick={() => setUnit(null)}
                  className={
                    unit === null
                      ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      : "rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                  }
                >
                  すべて
                </button>
                {units.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={
                      unit === u
                        ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        : "rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
                    }
                  >
                    {u}
                  </button>
                ))}
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
