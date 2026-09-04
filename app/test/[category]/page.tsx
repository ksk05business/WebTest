import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, HelpCircle, ListChecks, Sparkles } from "lucide-react";
import { TEST_GUIDES, findTestGuide } from "@/src/data/testGuides";
import { SITE_NAME, SITE_OGP_IMAGE, SITE_URL } from "@/src/lib/site";

export function generateStaticParams() {
  return TEST_GUIDES.map((guide) => ({ category: guide.slug }));
}

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const guide = findTestGuide(category);
  if (!guide) return {};

  const url = `${SITE_URL}/test/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.metaDescription,
    keywords: guide.keywords,
    alternates: { canonical: `/test/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      siteName: SITE_NAME,
      url,
      type: "website",
      images: [{ url: SITE_OGP_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.metaDescription,
      images: [SITE_OGP_IMAGE],
    },
  };
}

export default async function TestCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const guide = findTestGuide(category);
  if (!guide) notFound();

  const url = `${SITE_URL}/test/${guide.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${SITE_NAME}（${guide.name}対策）`,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url,
        description: guide.metaDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
        provider: { "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
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
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
          >
            無料登録
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-16 text-center sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5">
          <Link
            href="/test"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-100 hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            他のWebテスト種別を見る
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
            提供元：{guide.provider}
          </span>
          <h1 className="text-balance text-2xl font-bold leading-snug text-white drop-shadow-sm sm:text-3xl md:text-4xl">
            {guide.name}の問題集・対策サイト
          </h1>
          <p className="text-balance text-sm leading-relaxed text-blue-50 sm:text-base">{guide.heroCopy}</p>
          <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:text-base"
            >
              【完全無料】今すぐ会員登録して対策を始める
            </Link>
            <Link
              href={guide.practiceHref}
              className="rounded-full border-2 border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:text-base"
            >
              {guide.practiceAvailable ? `${guide.shortName}の練習問題を見る` : "対応済みテストを見る"}
            </Link>
          </div>
          <p className="text-xs text-blue-100">{guide.practiceNote}</p>
        </div>
      </section>

      <main className="flex-1 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {/* 特徴・出題傾向 */}
          <section>
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {guide.name}の特徴・出題傾向
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {guide.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          {/* 受験形式・出題領域テーブル */}
          <section className="mt-10">
            <div className="mb-5 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">受験形式・出題領域</h2>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {guide.formats.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-start sm:gap-6 ${
                    i > 0 ? "border-t border-gray-100" : ""
                  }`}
                >
                  <span className="w-32 flex-shrink-0 text-sm font-bold text-gray-900">{f.label}</span>
                  <span className="text-sm leading-relaxed text-gray-600">{f.detail}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 代表的な例題 */}
          <section className="mt-10">
            <div className="mb-5 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">代表的な例題と詳細解説</h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{guide.example.question}</p>
              {guide.example.choices && (
                <ul className="mt-4 flex flex-col gap-2">
                  {guide.example.choices.map((choice, i) => (
                    <li
                      key={choice}
                      className={`rounded-lg border px-4 py-2.5 text-sm ${
                        i === guide.example.answerIndex
                          ? "border-blue-300 bg-blue-50 font-semibold text-blue-800"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {choice}
                      {i === guide.example.answerIndex && (
                        <span className="ml-2 text-xs font-bold text-blue-600">（正解）</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-xs font-bold text-gray-500">解説</p>
                <p className="text-sm leading-relaxed text-gray-700">{guide.example.explanation}</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-10">
            <div className="mb-5 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">よくある質問</h2>
            </div>
            <div className="flex flex-col gap-3">
              {guide.faqs.map((f) => (
                <details
                  key={f.question}
                  className="group rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                >
                  <summary className="cursor-pointer list-none font-semibold text-gray-900">
                    {f.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-center shadow-lg">
            <p className="text-balance text-lg font-bold text-white">
              {guide.name}対策を今すぐ無料で始めましょう
            </p>
            <p className="mt-2 text-sm text-blue-50">
              登録3分・完全無料。忘却曲線に基づく復習機能で、間違えた問題を効率よく定着させられます。
            </p>
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                無料登録して対策を始める
              </Link>
              <Link
                href={guide.practiceHref}
                className="rounded-full border-2 border-white/70 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                {guide.practiceAvailable ? `${guide.shortName}の練習問題を見る` : "対応済みテストの練習問題を見る"}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
