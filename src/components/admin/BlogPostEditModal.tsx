"use client";

import { useState } from "react";
import type { AdminBlogPostListItem } from "./BlogPostsTab";
import { MdxLivePreview } from "./MdxLivePreview";
import { TagTaxonomyPicker } from "./TagTaxonomyPicker";

// <input type="datetime-local">はタイムゾーンを持たない"YYYY-MM-DDTHH:mm"形式でしか
// 値をやり取りできない。運営者は日本時間で運用している前提のため、表示・保存とも
// Asia/Tokyo（+09:00固定、サマータイム無し）に統一して変換する。
function toDatetimeLocalValue(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return `${dateStr}T00:00`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function fromDatetimeLocalValue(value: string): string {
  if (!value) return "";
  return `${value}:00+09:00`;
}

// 新規作成・編集どちらもこのモーダルを使う。post が null なら新規作成、値があれば編集。
// 編集時はGET /api/admin/blog-posts/{slug} で本文とshaを取得してからこのモーダルを開く想定
// （一覧レスポンスには本文を含まないため）。
export function BlogPostEditModal({
  post,
  initialContent,
  initialSha,
  initialDraft,
  adminToken,
  onClose,
  onSaved,
  onAuthError,
}: {
  post: AdminBlogPostListItem | null;
  initialContent: string;
  initialSha: string | null;
  initialDraft: boolean;
  adminToken: string;
  onClose: () => void;
  onSaved: () => void;
  onAuthError: () => void;
}) {
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // 画面幅が狭い場合の「エディタ/プレビュー」タブ切り替え用（lg以上では常に2カラム表示のため使わない）。
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const isEditing = post !== null;

  async function handleSave() {
    setError(null);
    if (!isEditing && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug.trim())) {
      setError("slugは半角小文字英数字とハイフンのみ使用できます（例: my-new-article）");
      return;
    }
    if (!title.trim() || !description.trim() || !date.trim() || !content.trim()) {
      setError("タイトル・説明文・公開日時・本文は必須です");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        tags,
        content,
        // このモーダルには公開/非公開を切り替えるUIを置かない（一覧のトグルで行う）ため、
        // 開いたときの値をそのまま書き戻し、本文編集だけでは公開状態が変わらないようにする。
        draft: initialDraft,
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
        className="flex w-full max-w-6xl flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "92vh" }}
      >
        <h3 className="mb-1 text-lg font-bold text-gray-900">
          {isEditing ? `記事を編集：${post!.title}` : "記事を新規作成"}
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          保存するとGitHubへコミットされ、Cloudflare
          Pagesの自動ビルドを経て本番サイトへ反映されます（反映まで数分〜十数分かかります）。
          {!isEditing && "新規作成した記事は既定で非公開になります。公開する際は一覧のトグルで切り替えてください。"}
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

          <label className="flex flex-col gap-1 text-sm sm:max-w-xs">
            <span className="font-semibold text-gray-700">公開日時</span>
            <input
              type="datetime-local"
              value={toDatetimeLocalValue(date)}
              onChange={(e) => setDate(fromDatetimeLocalValue(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs text-gray-500">
              日本時間で指定してください。未来の日時にすると、トグルが「公開」でもその日時まで
              「予約公開」として一覧・sitemap等には表示されません（過去日時にすると即座に公開対象になります）。
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-700">
              タグ（階層を辿って選択。複数追加可）
            </span>
            <TagTaxonomyPicker tags={tags} onChange={setTags} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-700">本文（MDX形式。フロントマターは含めない）</span>

            {/* lg未満: エディタ/プレビューをタブ切り替え。lg以上: 常に左右2カラムで同時表示。 */}
            <div className="flex gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mobileTab === "editor" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600"
                }`}
              >
                エディタ
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  mobileTab === "preview" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600"
                }`}
              >
                プレビュー
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                className={`rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none ${
                  mobileTab === "preview" ? "hidden lg:block" : ""
                }`}
              />
              <div
                className={`overflow-y-auto rounded-lg border border-gray-200 bg-white ${
                  mobileTab === "editor" ? "hidden lg:block" : ""
                }`}
                style={{ maxHeight: "min(60vh, 520px)" }}
              >
                <MdxLivePreview source={content} />
              </div>
            </div>
          </div>

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
