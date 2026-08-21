"use client";

import { useState } from "react";

export type ScoutItem = {
  id: number;
  companyName: string;
  title: string;
  message: string | null;
  status: string;
  isAnonymous: boolean;
  isRead: boolean;
  createdAt: string;
};

const TAG_KEYWORDS: { keyword: string; label: string }[] = [
  { keyword: "特別選考", label: "特別選考ルート" },
  { keyword: "早期選考", label: "早期選考" },
  { keyword: "面談確約", label: "面談確約" },
  { keyword: "カジュアル面談", label: "カジュアル面談" },
  { keyword: "内定直結", label: "内定直結" },
  { keyword: "優遇", label: "選考優遇" },
];

// メッセージ本文に含まれる特徴的なキーワードから表示用タグを抽出する簡易ヒューリスティック。
export function deriveScoutTags(message: string | null): string[] {
  if (!message) return [];
  const tags: string[] = [];
  for (const { keyword, label } of TAG_KEYWORDS) {
    if (message.includes(keyword) && !tags.includes(label)) {
      tags.push(label);
    }
  }
  return tags;
}

export const SCOUT_STATUS_LABEL: Record<string, string> = {
  sent: "未回答",
  accepted: "承諾済み（実名開示中）",
  declined: "辞退済み",
};

export const SCOUT_STATUS_STYLE: Record<string, string> = {
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-gray-100 text-gray-500",
};

type ConfirmView = "detail" | "confirmAccept" | "confirmDecline";

export function ScoutDetailModal({
  scout,
  onClose,
  onRespond,
}: {
  scout: ScoutItem;
  onClose: () => void;
  onRespond: (scoutId: number, action: "accept" | "decline") => Promise<void>;
}) {
  const [view, setView] = useState<ConfirmView>("detail");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tags = deriveScoutTags(scout.message);

  async function handleConfirm(action: "accept" | "decline") {
    setSubmitting(true);
    setError(null);
    try {
      await onRespond(scout.id, action);
      onClose();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        {view === "detail" && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400">{scout.companyName}</p>
                <h2 className="text-lg font-bold text-gray-900">{scout.title || "(件名なし)"}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xl leading-none text-gray-400 hover:text-gray-600"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  SCOUT_STATUS_STYLE[scout.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {SCOUT_STATUS_LABEL[scout.status] ?? scout.status}
              </span>
              <span className="text-xs text-gray-400">{scout.createdAt}</span>
            </div>

            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
              {scout.message || "(本文なし)"}
            </p>

            <p className="mt-3 text-xs text-gray-400">
              {scout.isAnonymous
                ? "承諾するまで、あなたの氏名・メールアドレスはこの企業に開示されません。"
                : "承諾済み：この企業にはあなたの氏名・メールアドレスが開示されています。"}
            </p>

            {scout.status === "sent" && (
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setView("confirmAccept")}
                  className="flex-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  承諾する
                </button>
                <button
                  type="button"
                  onClick={() => setView("confirmDecline")}
                  className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  辞退する
                </button>
              </div>
            )}
          </>
        )}

        {view === "confirmAccept" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">企業と連絡を取る準備はOKですか？</h2>
            <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              承諾すると、<span className="font-semibold">{scout.companyName}</span>
              にあなたの氏名・メールアドレスが開示され、この企業から直接連絡が届くようになります。
            </p>
            <p className="text-xs text-gray-500">
              承諾後は「マイページ」からいつでもスカウト受信の同意自体を撤回できます。まずは気軽に返信してみましょう。
            </p>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirm("accept")}
                className="flex-1 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "処理中..." : "はい、承諾する"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setView("detail")}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                やめておく
              </button>
            </div>
          </div>
        )}

        {view === "confirmDecline" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">このスカウトを辞退しますか？</h2>
            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
              辞退しても、あなたの氏名・メールアドレスがこの企業に開示されることはありません。辞退の連絡は自動で処理されるため、企業に失礼になることはありませんのでご安心ください。
            </p>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleConfirm("decline")}
                className="flex-1 rounded-full bg-gray-700 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "処理中..." : "辞退する"}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setView("detail")}
                className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
