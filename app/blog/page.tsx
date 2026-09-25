import type { Metadata } from "next";
import { getAllBlogPosts } from "@/src/lib/blog";
import { BlogIndexClient } from "@/src/components/BlogIndexClient";

export const metadata: Metadata = {
  title: "Webテスト対策ブログ",
  description: "SPI・玉手箱など主要Webテストの解き方・対策のコツを解説する記事一覧です。",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts().map(({ slug, title, description, date, tags }) => ({
    slug,
    title,
    description,
    date,
    tags,
  }));

  return <BlogIndexClient posts={posts} />;
}
