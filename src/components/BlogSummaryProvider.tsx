"use client";

import { createContext, useContext, type ReactNode } from "react";

export type BlogSummary = { slug: string; title: string; date: string; tags: string[] };

// app/dashboard/page.tsxは"use client"のため、node:fsを使うgetAllBlogPosts()を直接呼べない。
// Server Component（app/dashboard/layout.tsx）でビルド時に取得した結果をContext経由で
// クライアントツリーに受け渡す（このアプリで初めてContextを使う箇所。ブログ記事一覧のような
// ビルド時静的データをクライアントコンポーネントの深い階層まで渡す目的に限定して使う）。
const BlogSummaryContext = createContext<BlogSummary[]>([]);

export function BlogSummaryProvider({ posts, children }: { posts: BlogSummary[]; children: ReactNode }) {
  return <BlogSummaryContext.Provider value={posts}>{children}</BlogSummaryContext.Provider>;
}

export function useBlogSummaries(): BlogSummary[] {
  return useContext(BlogSummaryContext);
}
