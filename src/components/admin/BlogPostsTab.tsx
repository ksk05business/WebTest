"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { BlogPostEditModal } from "./BlogPostEditModal";
import { Switch } from "./Switch";

export type AdminBlogPostListItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  draft: boolean;
  sha: string;
};

type EditingState = { post: AdminBlogPostListItem | null; content: string; sha: string | null } | null;

// draft（管理画面トグル）とdate（公開日時）の組み合わせから、一覧カードに出す3状態を求める。
// 判定ロジック自体はsrc/lib/blog.tsのisPublished()と必ず一致させること（二重管理を避けたいが、
// 一方はNode.jsのビルド時専用モジュール、他方はブラウザで動くクライアントコンポーネントのため
// 共有できない。ロジックを変更したら両方を直すこと）。
type PostStatus = "published" | "scheduled" | "draft";

function getPostStatus(p: AdminBlogPostListItem): PostStatus {
  if (p.draft) return "draft";
  const d = new Date(p.date);
  if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return "scheduled";
  return "published";
}

// 予約公開バッジ表示用。管理者は日本時間で運用している前提のため、実行環境のタイムゾーンに
// 関わらずAsia/Tokyoで固定フォーマットする。
function formatScheduledAt(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((part) => part.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

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
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(type: "success" | "error", message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }

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

  // 一覧カードの公開/非公開トグル。一覧レスポンスには本文を含まないため、既存の編集保存フロー
  // （GET→本文取得→PUTでGitHubへコミット）を流用し、draftフィールドだけを反転させて送り直す。
  async function handleToggleDraft(post: AdminBlogPostListItem) {
    setTogglingSlug(post.slug);
    try {
      const getRes = await fetch(`/api/admin/blog-posts/${post.slug}`, {
        headers: { "x-admin-token": adminToken },
      });
      const getData = await getRes.json().catch(() => ({}));
      if (!getRes.ok) {
        if (getData.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        showToast("error", getData.error ?? "記事の取得に失敗しました");
        return;
      }

      const nextDraft = !post.draft;
      const putRes = await fetch(`/api/admin/blog-posts/${post.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          title: getData.title,
          description: getData.description,
          date: getData.date,
          tags: getData.tags,
          content: getData.content,
          sha: getData.sha,
          draft: nextDraft,
          commitMessage: `chore: ブログ記事を${nextDraft ? "非公開" : "公開"}に切り替え（${post.slug}）`,
        }),
      });
      const putData = await putRes.json().catch(() => ({}));
      if (!putRes.ok) {
        if (putData.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        showToast("error", putData.error ?? "ステータスの更新に失敗しました");
        return;
      }

      setPosts((prev) => prev?.map((p) => (p.slug === post.slug ? { ...p, draft: nextDraft } : p)) ?? prev);
      // draftをfalseにしても、dateが未来のままなら実際には「予約公開」状態になる
      // （まだ本番には出ない）ため、トースト文言もそれに合わせて出し分ける。
      const nextDate = new Date(post.date);
      const willBeScheduled = !nextDraft && !Number.isNaN(nextDate.getTime()) && nextDate.getTime() > Date.now();
      const statusLabel = nextDraft
        ? "非公開"
        : willBeScheduled
          ? `予約公開（${formatScheduledAt(post.date)}に公開予定）`
          : "公開";
      showToast("success", `「${post.title}」を${statusLabel}にしました（GitHubへコミット済み）`);
    } catch {
      showToast("error", "通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setTogglingSlug(null);
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
        編集画面で公開日時を未来に設定すると「予約公開」になり、その日時を過ぎたあとに
        次のビルドが走った時点で公開されます。
      </p>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}
      {actionError && <p className="text-sm font-medium text-red-600">{actionError}</p>}

      {!posts ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-500">記事がありません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => {
            const status = getPostStatus(p);
            return (
            <div key={p.slug} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900">{p.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        status === "draft"
                          ? "bg-gray-200 text-gray-600"
                          : status === "scheduled"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {status === "draft"
                        ? "非公開"
                        : status === "scheduled"
                          ? `${formatScheduledAt(p.date)}に公開予定`
                          : "公開"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    /blog/{p.slug} ・ {p.date.slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Switch
                    checked={!p.draft}
                    disabled={togglingSlug === p.slug}
                    onChange={() => handleToggleDraft(p)}
                    label={p.draft ? `「${p.title}」を公開する` : `「${p.title}」を非公開にする`}
                  />
                  <div className="flex gap-1">
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
            );
          })}
        </div>
      )}

      {editing && (
        <BlogPostEditModal
          post={editing.post}
          initialContent={editing.content}
          initialSha={editing.sha}
          initialDraft={editing.post?.draft ?? true}
          adminToken={adminToken}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadPosts();
          }}
          onAuthError={onAuthError}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
