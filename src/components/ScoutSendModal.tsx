"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redirectToCompanyLogin } from "@/src/lib/authRedirect";

type Candidate = {
  studentId: number;
  universityCategory: string | null;
  facultyType: string;
  latestDeviationScore: number | null;
};

const SCOUT_TEMPLATES = [
  { label: "テンプレートを選択しない", title: "", message: "" },
  {
    label: "カジュアル面談のご案内",
    title: "カジュアル面談のご案内",
    message:
      "はじめまして。貴殿のプロフィールを拝見し、ぜひ一度カジュアルにお話しさせていただきたくご連絡いたしました。\n選考とは切り離した形での面談ですので、企業研究の一環としてお気軽にご参加いただけますと幸いです。\nご興味をお持ちいただけましたら、ご返信をお待ちしております。",
  },
  {
    label: "特別選考ルートのご案内",
    title: "特別選考ルートのご案内",
    message:
      "はじめまして。貴殿のこれまでの実績・プロフィールを拝見し、ぜひ弊社の特別選考ルートにご案内したくご連絡いたしました。\n通常の選考フローの一部を短縮したご案内となります。ご興味をお持ちいただけましたら、詳細をご案内させていただきます。",
  },
] as const;

export function ScoutSendModal({
  candidate,
  companyEmail,
  onClose,
  onSent,
}: {
  candidate: Candidate;
  companyEmail: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const router = useRouter();
  const [templateIndex, setTemplateIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function applyTemplate(index: number) {
    setTemplateIndex(index);
    const t = SCOUT_TEMPLATES[index];
    setTitle(t.title);
    setMessage(t.message);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !message.trim()) {
      setError("件名と本文メッセージを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyEmail,
          studentId: candidate.studentId,
          title,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          redirectToCompanyLogin(router);
          return;
        }
        setError(data.error ?? `送信に失敗しました（status: ${res.status}）`);
        return;
      }
      onSent();
      onClose();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">スカウトを送信する</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
            {candidate.universityCategory ?? "区分未設定"}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">{candidate.facultyType}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            偏差値:{" "}
            {candidate.latestDeviationScore !== null
              ? candidate.latestDeviationScore.toFixed(1)
              : "未受験"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            テンプレート
            <select
              value={templateIndex}
              onChange={(e) => applyTemplate(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            >
              {SCOUT_TEMPLATES.map((t, i) => (
                <option key={t.label} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            スカウトタイトル / 件名
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: カジュアル面談のご案内"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            本文メッセージ
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
