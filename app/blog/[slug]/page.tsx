import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { formatBlogDate, getAllBlogSlugs, getBlogPost, getRelatedPosts } from "@/src/lib/blog";
import { TrackedLink } from "@/src/components/TrackedLink";
import { MdxWrapper } from "@/src/components/MdxWrapper";
import { RelatedArticles } from "@/src/components/RelatedArticles";
import { SITE_NAME, SITE_OGP_IMAGE, SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      siteName: SITE_NAME,
      url,
      type: "article",
      publishedTime: post.date,
      images: [{ url: SITE_OGP_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [SITE_OGP_IMAGE],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post.slug, post.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    inLanguage: "ja",
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  // FAQフロントマターがある記事のみFAQPageのJSON-LDを追加（GEO/AIO/LLMO対策、seo-blog-authoringスキル参照）。
  const faqJsonLd =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        // eslint-disable-next-line react/no-danger
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

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

      <main className="flex-1 px-6 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ChevronLeft className="h-4 w-4" />
            記事一覧に戻る
          </Link>

          <div className="mb-8 flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{post.title}</h1>
            <p className="text-xs text-gray-400">{formatBlogDate(post.date)}</p>
          </div>

          <MdxWrapper source={post.content} />

          <RelatedArticles posts={relatedPosts} />
        </div>
      </main>
    </div>
  );
}
