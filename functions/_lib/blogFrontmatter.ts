// content/blog/*.mdxのフロントマター（--- で囲まれたYAML風ヘッダー）をパース・生成する。
// Workersランタイムではgray-matter（Node依存が疑われる）を避け、このプロジェクトの全記事が
// 従う単純な固定フォーマット（title/description/date: "文字列", tags: ["a","b"]）専用の
// 軽量パーサーを自前で用意する。src/lib/blog.ts（Next.jsビルド時・gray-matter使用）とは別実装だが、
// 出力されるMDXファイルの形式は完全に一致させること。
export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  tags: string[];
};

export type ParsedBlogMdx = BlogFrontmatter & { content: string };

export function parseBlogMdx(raw: string): ParsedBlogMdx | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const [, fmBlock, body] = match;

  const fm: Record<string, string> = {};
  let tags: string[] = [];
  for (const line of fmBlock.split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    if (key === "tags") {
      try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed)) tags = parsed.map(String);
      } catch {
        tags = [];
      }
    } else {
      const value = rawValue.trim();
      fm[key] = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
    }
  }

  if (!fm.title || !fm.description || !fm.date) return null;
  return {
    title: fm.title,
    description: fm.description,
    date: fm.date,
    tags,
    content: body.replace(/^\r?\n/, ""),
  };
}

function escapeYamlDoubleQuoted(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function serializeBlogMdx(fm: BlogFrontmatter, content: string): string {
  return `---
title: "${escapeYamlDoubleQuoted(fm.title)}"
description: "${escapeYamlDoubleQuoted(fm.description)}"
date: "${fm.date}"
tags: ${JSON.stringify(fm.tags)}
---

${content.trim()}
`;
}
