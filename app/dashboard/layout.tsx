import type { ReactNode } from "react";
import { getAllBlogPosts } from "@/src/lib/blog";
import { BlogSummaryProvider } from "@/src/components/BlogSummaryProvider";

// Server Component。app/dashboard/page.tsx（"use client"）内のRecommendedCompanies
// （就活記事・コラムカード）へブログ記事一覧を渡すために、ビルド時にgetAllBlogPosts()を実行する。
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const posts = getAllBlogPosts()
    .slice(0, 3)
    .map(({ slug, title, date, tags }) => ({ slug, title, date, tags }));

  return <BlogSummaryProvider posts={posts}>{children}</BlogSummaryProvider>;
}
