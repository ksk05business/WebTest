import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BlogPost } from "@/src/lib/blog";

// ブログ記事下部の「関連記事」。回遊率向上のため、スマホは縦1列・PCは横2列のカード表示にする。
// 関連記事が1件も無い場合は何も描画しない（呼び出し側で件数チェック不要）。
export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-gray-100 pt-8">
      <h2 className="mb-4 text-base font-bold text-gray-900">関連記事</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold leading-snug text-gray-900">{post.title}</p>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
