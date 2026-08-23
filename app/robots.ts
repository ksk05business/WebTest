import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/lib/site";

// 静的サイト出力（output: "export"）ではビルド時に一度だけ生成されるため force-static を明示する。
export const dynamic = "force-static";

// ログイン後専用ページ・管理画面・APIはクロール対象外とし、それ以外は
// Googlebot・BingbotだけでなくAI検索/回答エンジンのクローラー（GPTBot、PerplexityBot等）にも
// 明示的に許可を出し、AIO/GEO（AI検索最適化）を狙う。
const DISALLOWED_PATHS = [
  "/admin",
  "/dashboard",
  "/mypage",
  "/result",
  "/review",
  "/company/dashboard",
  "/company/scouts",
  "/api",
];

const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: AI_CRAWLER_USER_AGENTS,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
