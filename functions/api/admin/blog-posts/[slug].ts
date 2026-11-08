import { checkAdminAuth } from "../../../_lib/adminAuth";
import { parseBlogMdx, serializeBlogMdx } from "../../../_lib/blogFrontmatter";
import { githubDeleteFile, githubGetFile, githubPutFile } from "../../../_lib/githubContent";

interface Env {
  ADMIN_API_TOKEN?: string;
  GITHUB_CONTENT_TOKEN?: string;
}

const BLOG_DIR = "content/blog";
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function parseSlug(raw: string | undefined): string | null {
  if (!raw || !SLUG_RE.test(raw)) return null;
  return raw;
}

// 編集モーダル用に、本文を含む記事全体とGitHub上のsha（更新時の楽観的ロックに必須）を返す。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  if (!token) return Response.json({ error: "GitHub連携が設定されていません" }, { status: 503 });

  const slug = parseSlug(context.params.slug as string | undefined);
  if (!slug) return Response.json({ error: "不正なslugです" }, { status: 400 });

  const file = await githubGetFile(token, `${BLOG_DIR}/${slug}.mdx`);
  if (!file) return Response.json({ error: "記事が見つかりません" }, { status: 404 });

  const parsed = parseBlogMdx(file.content);
  if (!parsed) return Response.json({ error: "記事のフロントマター解析に失敗しました" }, { status: 500 });

  return Response.json({ slug, ...parsed, sha: file.sha });
};

// 記事の更新。編集モーダルから全フィールドを毎回送ってもらう想定（部分更新は行わない）。
// リクエストのshaが取得時から変わっていた場合（他で先に更新された等）はGitHubが409/422を
// 返すため、409で呼び出し元に伝える。
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  if (!token) return Response.json({ error: "GitHub連携が設定されていません" }, { status: 503 });

  const slug = parseSlug(context.params.slug as string | undefined);
  if (!slug) return Response.json({ error: "不正なslugです" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [];
  const content = typeof body.content === "string" ? body.content : "";
  const sha = typeof body.sha === "string" ? body.sha : "";
  // 一覧の公開/非公開トグルも本文全体を含むこのPUTを流用するため、trueを明示的に送ってきた
  // 場合のみdraft扱いにする（省略時に誤って非公開へ倒れないよう、falseを既定にする）。
  const draft = body.draft === true;
  if (!title || !description || !date || !content.trim() || !sha) {
    return Response.json({ error: "title・description・date・content・shaは必須です" }, { status: 400 });
  }

  const raw = serializeBlogMdx({ title, description, date, tags, draft }, content);
  const message = typeof body.commitMessage === "string" && body.commitMessage.trim()
    ? body.commitMessage.trim()
    : `fix: ブログ記事を更新（${slug}）`;
  const result = await githubPutFile(token, `${BLOG_DIR}/${slug}.mdx`, raw, message, sha);
  if (result === "conflict") {
    return Response.json(
      { error: "他の変更と競合しました。ページを再読み込みしてから編集し直してください。" },
      { status: 409 }
    );
  }
  if (!result) {
    return Response.json({ error: "GitHubへの保存に失敗しました" }, { status: 502 });
  }

  return Response.json({ ok: true, slug });
};

// 記事の削除。GitHub Contents APIの仕様上、削除にも対象ファイルの現在のshaが必須。
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  if (!token) return Response.json({ error: "GitHub連携が設定されていません" }, { status: 503 });

  const slug = parseSlug(context.params.slug as string | undefined);
  if (!slug) return Response.json({ error: "不正なslugです" }, { status: 400 });

  let body: Record<string, unknown> = {};
  try {
    body = await context.request.json();
  } catch {
    // ボディ省略時は空オブジェクト扱い（下のsha必須チェックでエラーにする）
  }
  const sha = typeof body.sha === "string" ? body.sha : "";
  if (!sha) return Response.json({ error: "shaは必須です" }, { status: 400 });

  const ok = await githubDeleteFile(token, `${BLOG_DIR}/${slug}.mdx`, `chore: ブログ記事を削除（${slug}）`, sha);
  if (!ok) return Response.json({ error: "GitHubでの削除に失敗しました" }, { status: 502 });

  return Response.json({ ok: true, slug });
};
