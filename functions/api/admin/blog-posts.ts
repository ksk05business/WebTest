import { checkAdminAuth } from "../../_lib/adminAuth";
import { parseBlogMdx, serializeBlogMdx } from "../../_lib/blogFrontmatter";
import { githubGetFile, githubListDir, githubPutFile } from "../../_lib/githubContent";

interface Env {
  ADMIN_API_TOKEN?: string;
  GITHUB_CONTENT_TOKEN?: string;
}

const BLOG_DIR = "content/blog";
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type BlogPostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  sha: string;
};

// /admin/dashboard「ブログ記事管理」タブ用の一覧取得API。GitHub上のcontent/blog/配下の.mdx
// ファイルを列挙し、各ファイルのフロントマターを読み取って返す（本文は含めない。一覧表示には
// 不要で、記事数・本文量が増えるとレスポンスが重くなるため。本文は個別記事取得
// GET /api/admin/blog-posts/{slug} で取得する）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  if (!token) return Response.json({ error: "GitHub連携が設定されていません" }, { status: 503 });

  const entries = await githubListDir(token, BLOG_DIR);
  if (entries === null) {
    return Response.json({ error: "記事一覧の取得に失敗しました" }, { status: 502 });
  }

  const mdxEntries = entries.filter((e) => e.type === "file" && e.name.endsWith(".mdx"));
  const posts = await Promise.all(
    mdxEntries.map(async (e): Promise<BlogPostListItem | null> => {
      const slug = e.name.replace(/\.mdx$/, "");
      const file = await githubGetFile(token, e.path);
      if (!file) return null;
      const parsed = parseBlogMdx(file.content);
      if (!parsed) return null;
      return {
        slug,
        title: parsed.title,
        description: parsed.description,
        date: parsed.date,
        tags: parsed.tags,
        sha: e.sha,
      };
    })
  );

  return Response.json({
    posts: posts
      .filter((p): p is BlogPostListItem => p !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  });
};

// 新規記事の作成。同じslugのファイルが既に存在する場合は409を返す。
// GitHubへのコミットが行われるだけで、実際に本番の/blogページへ反映されるまでには
// Cloudflare Pagesの自動ビルド・デプロイの時間（数分〜十数分）がかかる点に注意。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  if (!token) return Response.json({ error: "GitHub連携が設定されていません" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!SLUG_RE.test(slug)) {
    return Response.json(
      { error: "slugは半角小文字英数字とハイフンのみ使用できます（例: my-new-article）" },
      { status: 400 }
    );
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  const content = typeof body.content === "string" ? body.content : "";
  if (!title || !description || !date || !content.trim()) {
    return Response.json({ error: "title・description・date・contentは必須です" }, { status: 400 });
  }

  const path = `${BLOG_DIR}/${slug}.mdx`;
  const existing = await githubGetFile(token, path);
  if (existing) {
    return Response.json({ error: "同じslugの記事が既に存在します" }, { status: 409 });
  }

  const raw = serializeBlogMdx({ title, description, date, tags }, content);
  const result = await githubPutFile(token, path, raw, `feat: ブログ記事を新規追加（${slug}）`);
  if (!result) {
    return Response.json({ error: "GitHubへの保存に失敗しました" }, { status: 502 });
  }

  return Response.json({ ok: true, slug });
};
