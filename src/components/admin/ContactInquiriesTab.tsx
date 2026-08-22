"use client";

import { useEffect, useState } from "react";

type ContactInquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  unhandled: "未対応",
  handled: "対応済み",
};

const STATUS_STYLE: Record<string, string> = {
  unhandled: "bg-amber-100 text-amber-700",
  handled: "bg-green-100 text-green-700",
};

export function ContactInquiriesTab({
  adminToken,
  onAuthError,
}: {
  adminToken: string;
  onAuthError: () => void;
}) {
  const [inquiries, setInquiries] = useState<ContactInquiry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  function loadInquiries() {
    setLoadError(null);
    fetch("/api/admin/contact-inquiries", { headers: { "x-admin-token": adminToken } })
      .then((res) => res.json())
      .then((data: { inquiries?: ContactInquiry[]; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setInquiries(data.inquiries ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  async function handleToggleStatus(inquiry: ContactInquiry) {
    const nextStatus = inquiry.status === "handled" ? "unhandled" : "handled";
    setUpdatingId(inquiry.id);
    try {
      const res = await fetch("/api/admin/contact-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ id: inquiry.id, status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error ?? "更新に失敗しました");
        return;
      }
      setInquiries((list) =>
        (list ?? []).map((i) => (i.id === inquiry.id ? { ...i, status: nextStatus } : i))
      );
    } catch {
      setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loadError) {
    return <p className="text-sm font-medium text-red-600">{loadError}</p>;
  }

  if (!inquiries) {
    return <p className="text-sm text-gray-500">読み込み中...</p>;
  }

  if (inquiries.length === 0) {
    return <p className="text-sm text-gray-500">お問い合わせはまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr>
            <th className="px-3 py-2 font-semibold">送信日時</th>
            <th className="px-3 py-2 font-semibold">お名前</th>
            <th className="px-3 py-2 font-semibold">メールアドレス</th>
            <th className="px-3 py-2 font-semibold">内容</th>
            <th className="px-3 py-2 font-semibold">ステータス</th>
            <th className="px-3 py-2 font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {inquiries.map((i) => (
            <tr key={i.id} className="align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{i.createdAt}</td>
              <td className="px-3 py-2 text-gray-900">{i.name}</td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-700">{i.email}</span>
                  <a
                    href={`mailto:${i.email}`}
                    className="w-fit rounded-full border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    メールソフトで返信
                  </a>
                </div>
              </td>
              <td className="max-w-xs px-3 py-2 text-gray-700">
                <p className="whitespace-pre-wrap">{i.message}</p>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLE[i.status] ?? "bg-gray-100 text-gray-500"
                  }`}
                >
                  {STATUS_LABEL[i.status] ?? i.status}
                </span>
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  disabled={updatingId === i.id}
                  onClick={() => handleToggleStatus(i)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {i.status === "handled" ? "未対応に戻す" : "対応済みにする"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
