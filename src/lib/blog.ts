import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// SEOブログ（/blog）の記事本体。content/blog/配下の.mdxファイル1本=1記事として管理する。
// 既存の/guide（TSデータ配列で管理）とは異なり、本文にReactコンポーネント（<CallToActionCTA/>等）を
// 直接埋め込みたいという要件のため、実ファイルのMDX+フロントマター方式を採用している。
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
};

export type BlogPost = BlogFrontmatter & {
  slug: string;
  content: string;
};

function getAllSlugsFromDisk(): string[] {
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

// フロントマターのdateが未来（ビルド時点の現在日時より後）の記事は「予約公開」扱いとし、
// 公開日時を迎えるまで一覧・詳細ページとも一切出力しない（静的サイト出力のため、実際に
// サイトへ反映されるのはこの判定を行うビルド・デプロイのタイミングになる）。
function isPublished(date: string): boolean {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() <= Date.now();
}

// generateStaticParams等で使う。予約公開中（未来日付）の記事のスラッグは除外し、
// 該当ページ自体が静的サイトに生成されないようにする。
export function getAllBlogSlugs(): string[] {
  return getAllSlugsFromDisk().filter((slug) => {
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
    try {
      const raw = readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      return isPublished(data.date);
    } catch {
      return false;
    }
  });
}

export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  try {
    const raw = readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    if (!isPublished(data.date)) return null;
    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      tags: data.tags ?? [],
      content,
    };
  } catch {
    return null;
  }
}

// フロントマターのdateは"2026-09-09"のような日付のみ、"2026-09-11T17:00:00+09:00"のような
// 日時+タイムゾーン付きの両方を許容する（後者はJSON-LDのdatePublishedに正確な時刻を渡すため）。
// 表示用には人間が読みやすい日本語形式（例: 2026年9月11日）に変換する。
export function formatBlogDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

export function getAllBlogPosts(): BlogPost[] {
  return getAllBlogSlugs()
    .map((slug) => getBlogPost(slug))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// 記事下部の「関連記事」用。同じタグを多く共有する記事ほど上位に来るようスコアリングし、
// 同点の場合は新しい記事を優先する。該当が無い場合は空配列を返す（呼び出し側でセクション自体を隠す）。
export function getRelatedPosts(currentSlug: string, tags: string[], limit = 2): BlogPost[] {
  const tagSet = new Set(tags);
  return getAllBlogPosts()
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({ post, score: post.tags.filter((t) => tagSet.has(t)).length }))
    .sort((a, b) => b.score - a.score || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, limit)
    .map(({ post }) => post);
}
