import type { MetadataRoute } from "next";
import { GUIDE_ARTICLES } from "@/src/data/guideArticles";
import { SITE_URL } from "@/src/lib/site";

// 静的サイト出力（output: "export"）ではビルド時に一度だけ生成されるため force-static を明示する。
export const dynamic = "force-static";

// 検索エンジンに公開してよい静的ページのみを列挙する。
// 管理画面（/admin配下）、ログイン後専用ページ（/mypage, /dashboard, /result, /review,
// /company/dashboard, /company/scouts）はインデックス対象外のため含めない。
export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/forgot-password`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/test`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/practice`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/guide`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/company/apply`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/company/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const guideEntries: MetadataRoute.Sitemap = GUIDE_ARTICLES.map((article) => ({
    url: `${SITE_URL}/guide/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...guideEntries];
}
