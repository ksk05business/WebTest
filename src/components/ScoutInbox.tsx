"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScoutDetailModal,
  SCOUT_STATUS_LABEL,
  SCOUT_STATUS_STYLE,
  deriveScoutTags,
  type ScoutItem,
} from "@/src/components/ScoutDetailModal";
import { redirectToLogin } from "@/src/lib/authRedirect";

// 届いたスカウトの簡易受信ボックス。トップページ(/dashboard)から email を渡して表示する。
export function ScoutInbox({ email }: { email: string }) {
  const router = useRouter();
  const [scouts, setScouts] = useState<ScoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [selectedScoutId, setSelectedScoutId] = useState<number | null>(null);
  const unreadScoutCount = scouts.filter((s) => s.status === "sent" && !s.isRead).length;
  const selectedScout = scouts.find((s) => s.id === selectedScoutId) ?? null;

  useEffect(() => {
    if (!email) return;
    loadScouts();
  }, [email]);

  function loadScouts() {
    fetch(`/api/scouts?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data: { scouts?: ScoutItem[]; error?: string }) => {
        if (data.error === "ログインが必要です") {
          redirectToLogin(router);
          return;
        }
        if (data.scouts) setScouts(data.scouts);
      })
      .catch(() => {
        // スカウト一覧の取得に失敗してもダッシュボード自体は表示する
      })
      .finally(() => setLoading(false));
  }

  async function handleScoutAction(scoutId: number, action: "accept" | "decline") {
    setScoutError(null);
    let handledError = false;
    try {
      const res = await fetch("/api/scouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scoutId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        handledError = true;
        if (res.status === 401) {
          redirectToLogin(router);
          throw new Error("ログインが必要です");
        }
        setScoutError(data.error ?? "更新に失敗しました。時間をおいて再度お試しください。");
        throw new Error(data.error ?? "更新に失敗しました");
      }
      loadScouts();
    } catch (err) {
      if (!handledError) {
        setScoutError("通信エラーが発生しました。時間をおいて再度お試しください。");
      }
      throw err;
    }
  }

  function handleOpenScout(scoutId: number) {
    setSelectedScoutId(scoutId);
    const target = scouts.find((s) => s.id === scoutId);
    if (!target || target.isRead) return;

    fetch("/api/scouts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, scoutId, action: "read" }),
    })
      .then((res) => {
        if (res.status === 401) {
          redirectToLogin(router);
          return;
        }
        if (!res.ok) return;
        setScouts((prev) => prev.map((s) => (s.id === scoutId ? { ...s, isRead: true } : s)));
      })
      .catch(() => {
        // 既読反映に失敗してもモーダル表示自体は継続する
      });
  }

  if (loading) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">届いたスカウト</h2>
        {unreadScoutCount > 0 && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
            新着 {unreadScoutCount}件
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Webテストナビでは、人材紹介業者を通さず、企業様から直接スカウトが届きます。
      </p>
      {scoutError && <p className="text-sm font-medium text-red-600">{scoutError}</p>}
      {scouts.length === 0 ? (
        <p className="text-sm text-gray-500">まだスカウトは届いていません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {scouts.map((s) => {
            const tags = deriveScoutTags(s.message);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleOpenScout(s.id)}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        s.isRead ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {s.isRead ? "既読" : "未読"}
                    </span>
                    <p className="truncate text-xs text-gray-400">{s.companyName}</p>
                  </div>
                  <span
                    className={`flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                      SCOUT_STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {SCOUT_STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-gray-900">{s.title || "(件名なし)"}</p>
                <p className="mt-0.5 text-xs text-gray-400">{s.createdAt}</p>
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
              </button>
            );
          })}
        </div>
      )}

      {selectedScout && (
        <ScoutDetailModal
          scout={selectedScout}
          onClose={() => setSelectedScoutId(null)}
          onRespond={handleScoutAction}
        />
      )}
    </div>
  );
}
