import Link from "next/link";
import { TrackedLink } from "@/src/components/TrackedLink";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, TriangleAlert } from "lucide-react";
import { GUIDE_ARTICLES, findGuideArticle } from "@/src/data/guideArticles";
import { SITE_NAME, SITE_OGP_IMAGE, SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = findGuideArticle(slug);
  if (!article) return {};

  const url = `${SITE_URL}/guide/${article.slug}`;
  return {
    title: article.title,
    description: article.metaDescription,
    alternates: { canonical: `/guide/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      siteName: SITE_NAME,
      url,
      type: "article",
      images: [{ url: SITE_OGP_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
      images: [SITE_OGP_IMAGE],
    },
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = findGuideArticle(slug);
  if (!article) notFound();

  const practiceHref = `/practice?testType=${encodeURIComponent(article.testId)}&category=${encodeURIComponent(
    article.category
  )}&subCategory=${encodeURIComponent(article.subCategory)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: article.title,
    description: article.metaDescription,
    url: `${SITE_URL}/guide/${article.slug}`,
    inLanguage: "ja",
    isAccessibleForFree: true,
    learningResourceType: "解き方ガイド",
    about: `${article.testLabel} ${article.unitLabel}`,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/guide"
            className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-700"
          >
            <ChevronLeft className="h-4 w-4" />
            単元別解き方ガイド一覧へ戻る
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-700">
            <span className="rounded-full bg-blue-50 px-3 py-1">{article.testLabel}</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">{article.groupLabel}</span>
          </div>

          <h1 className="text-balance text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
            {article.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">{article.intro}</p>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">解き方のコツ</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {article.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {article.example && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">例題で確認</h2>
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-700 shadow-sm">
                <p className="whitespace-pre-line">{article.example.problem}</p>
                {article.example.choices && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {article.example.choices.map((choice) => (
                      <li key={choice}>{choice}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 font-bold text-blue-700">正解：{article.example.answer}</p>
                <p className="mt-1">{article.example.explanation}</p>
              </div>
            </section>
          )}

          {article.commonMistakes && article.commonMistakes.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">よくあるミス</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {article.commonMistakes.map((mistake) => (
                  <li
                    key={mistake}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
                  >
                    <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                    {mistake}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center shadow-lg">
            <p className="text-balance text-lg font-bold text-white">
              「{article.unitLabel}」の練習問題を無料で解いてみましょう
            </p>
            <p className="mt-2 text-sm text-blue-50">
              Webテストナビは登録3分・完全無料。忘却曲線に基づく復習機能で、間違えた問題を効率よく定着させられます。
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <TrackedLink
                location="bottom_register"
                href="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                無料登録して対策を始める
              </TrackedLink>
              <TrackedLink
                location="bottom_practice"
                href={practiceHref}
                className="rounded-full border-2 border-white/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                「{article.unitLabel}」の練習問題を見る
              </TrackedLink>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
