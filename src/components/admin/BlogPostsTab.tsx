"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { BlogPostEditModal } from "./BlogPostEditModal";

export type AdminBlogPostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  sha: string;
};

type EditingState = { post: AdminBlogPostListItem | null; content: string; sha: string | null } | null;

// /blog（学生向けSEOブログ）記事の管理タブ。実体はGitHubリポジトリのcontent/blog/*.mdxのため、
// 保存操作はGitHubへのコミットとして行われ、Cloudflare Pagesの自動ビルドを経て本番へ反映される
// （即時反映ではない）。詳細はfunctions/_lib/githubContent.tsのコメント参照。
export function BlogPostsTab({
  adminToken,
  onAuthError,
}: {
  adminToken: string;
  onAuthError: () => void;
}) {
  const [posts, setPosts] = useState<AdminBlogPostListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>(null);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  function loadPosts() {
    setLoadError(null);
    fetch("/api/admin/blog-posts", { headers: { "x-admin-token": adminToken } })
      .then((res) => res.json())
      .then((data: { posts?: AdminBlogPostListItem[]; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setPosts(data.posts ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  function openCreate() {
    setEditing({ post: null, content: "", sha: null });
  }

  async function openEdit(post: AdminBlogPostListItem) {
    setActionError(null);
    setLoadingSlug(post.slug);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.slug}`, {
        headers: { "x-admin-token": adminToken },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        setActionError(data.error ?? "記事の取得に失敗しました");
        return;
      }
      setEditing({ post, content: data.content ?? "", sha: data.sha ?? null });
    } catch {
      setActionError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setLoadingSlug(null);
    }
  }

  async function handleDelete(post: AdminBlogPostListItem) {
    if (!confirm(`「${post.title}」を削除します。GitHubへコミットされ、本番サイトからも削除されます。よろしいですか？`)) {
      return;
    }
    setActionError(null);
    setDeletingSlug(post.slug);
    try {
      const res = await fetch(`/api/admin/blog-posts/${post.slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ sha: post.sha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        setActionError(data.error ?? "削除に失敗しました");
        return;
      }
      loadPosts();
    } catch {
      setActionError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          全<span className="font-bold text-gray-900">{posts?.length ?? 0}</span>記事
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          記事を新規作成
        </button>
      </div>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        保存・削除操作はGitHubへのコミットとして実行され、Cloudflare
        Pagesの自動ビルドを経て本番サイトへ反映されます（反映まで数分〜十数分かかります）。
      </p>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}
      {actionError && <p className="text-sm font-medium text-red-600">{actionError}</p>}

      {!posts ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-500">記事がありません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <div key={p.slug} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    /blog/{p.slug} ・ {p.date.slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-1">
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="記事を表示"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    disabled={loadingSlug === p.slug}
                    onClick={() => openEdit(p)}
                    className="rounded-full p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                    aria-label="編集"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={deletingSlug === p.slug}
                    onClick={() => handleDelete(p)}
                    className="rounded-full p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-sm text-gray-600">{p.description}</p>

              {p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BlogPostEditModal
          post={editing.post}
          initialContent={editing.content}
          initialSha={editing.sha}
          adminToken={adminToken}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadPosts();
          }}
          onAuthError={onAuthError}
        />
      )}
    </div>
  );
}
