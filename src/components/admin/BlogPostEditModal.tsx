"use client";

import { useState } from "react";
import type { AdminBlogPostListItem } from "./BlogPostsTab";

// 新規作成・編集どちらもこのモーダルを使う。post が null なら新規作成、値があれば編集。
// 編集時はGET /api/admin/blog-posts/{slug} で本文とshaを取得してからこのモーダルを開く想定
// （一覧レスポンスには本文を含まないため）。
export function BlogPostEditModal({
  post,
  initialContent,
  initialSha,
  adminToken,
  onClose,
  onSaved,
  onAuthError,
}: {
  post: AdminBlogPostListItem | null;
  initialContent: string;
  initialSha: string | null;
  adminToken: string;
  onClose: () => void;
  onSaved: () => void;
  onAuthError: () => void;
}) {
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().slice(0, 10));
  const [tagsText, setTagsText] = useState(post?.tags.join(", ") ?? "");
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = post !== null;

  async function handleSave() {
    setError(null);
    if (!isEditing && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug.trim())) {
      setError("slugは半角小文字英数字とハイフンのみ使用できます（例: my-new-article）");
      return;
    }
    if (!title.trim() || !description.trim() || !date.trim() || !content.trim()) {
      setError("タイトル・説明文・公開日・本文は必須です");
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        tags,
        content,
        ...(isEditing ? { sha: initialSha } : { slug: slug.trim() }),
      };
      const res = await fetch(
        isEditing ? `/api/admin/blog-posts/${post!.slug}` : "/api/admin/blog-posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      onSaved();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="flex w-full max-w-3xl flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "92vh" }}
      >
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          {isEditing ? `記事を編集：${post!.title}` : "記事を新規作成"}
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          保存するとGitHubへコミットされ、Cloudflare
          Pagesの自動ビルドを経て本番サイトへ反映されます（反映まで数分〜十数分かかります）。
        </p>

        <div className="flex flex-col gap-4">
          {!isEditing && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">
                slug（URL、半角英数字とハイフンのみ。作成後は変更不可）
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="例: kaigaidaisei-webtest-taisaku"
                className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">タイトル</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">説明文（SEO description）</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">公開日</span>
              <input
                type="date"
                value={date.slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">タグ（カンマ区切り）</span>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="SPI, 推論, 無料"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">本文（MDX形式。フロントマターは含めない）</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "GitHubへ保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
