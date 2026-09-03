"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { BackLink } from "@/src/components/BackLink";
import {
  ScoutDetailPanel,
  SCOUT_STATUS_LABEL,
  SCOUT_STATUS_STYLE,
  deriveScoutTags,
  scoutDeadlineInfo,
  type ScoutItem,
} from "@/src/components/ScoutDetailPanel";
import { formatDateTime } from "@/src/lib/formatDate";
import { redirectToLogin } from "@/src/lib/authRedirect";

type FilterTab = "all" | "accepted" | "sent";
type SortOrder = "newest" | "deadline";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "accepted", label: "承諾済" },
  { id: "sent", label: "未承諾" },
];

function toTimestamp(sqliteUtc: string): number {
  return new Date(`${sqliteUtc.replace(" ", "T")}Z`).getTime();
}

export default function DashboardScoutsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [scouts, setScouts] = useState<ScoutItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedScoutId, setSelectedScoutId] = useState<number | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    loadScouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  function loadScouts() {
    fetch("/api/scouts")
      .then((res) => {
        if (res.status === 401) {
          redirectToLogin(router);
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data: { scouts?: ScoutItem[]; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setScouts(data.scouts ?? []);
      })
      .catch(() =>
        setLoadError((prev) => prev ?? "スカウト一覧の取得に失敗しました。時間をおいて再度お試しください。")
      );
  }

  async function handleRespond(scoutId: number, action: "accept" | "decline") {
    setRespondError(null);
    const res = await fetch("/api/scouts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoutId, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        redirectToLogin(router);
        throw new Error("unauthorized");
      }
      setRespondError(data.error ?? "更新に失敗しました。時間をおいて再度お試しください。");
      throw new Error(data.error ?? "更新に失敗しました");
    }
    loadScouts();
  }

  function handleOpenScout(scoutId: number) {
    setSelectedScoutId(scoutId);
    const target = scouts?.find((s) => s.id === scoutId);
    if (!target || target.isRead) return;

    fetch("/api/scouts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scoutId, action: "read" }),
    })
      .then((res) => {
        if (res.status === 401) {
          redirectToLogin(router);
          return;
        }
        if (!res.ok) return;
        setScouts((prev) => prev?.map((s) => (s.id === scoutId ? { ...s, isRead: true } : s)) ?? null);
      })
      .catch(() => {
        // 既読反映に失敗しても詳細表示自体は継続する
      });
  }

  const filteredScouts = useMemo(() => {
    if (!scouts) return [];
    const base = filter === "all" ? scouts : scouts.filter((s) => s.status === filter);
    return [...base].sort((a, b) => {
      const diff = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
      return sortOrder === "newest" ? -diff : diff;
    });
  }, [scouts, filter, sortOrder]);

  const selectedScout = scouts?.find((s) => s.id === selectedScoutId) ?? null;

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <BackLink href="/dashboard" label="ダッシュボードへ戻る" />
        <h1 className="mb-6 mt-3 text-xl font-bold text-gray-900">スカウト</h1>

        {loadError && <p className="mb-4 text-sm font-medium text-red-600">{loadError}</p>}
        {respondError && <p className="mb-4 text-sm font-medium text-red-600">{respondError}</p>}

        {scouts === null && !loadError ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            {/* 左カラム: スカウト一覧リスト */}
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`min-h-10 flex-shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                      filter === tab.id
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>{filteredScouts.length}件</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="min-h-10 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700"
                >
                  <option value="newest">新着順</option>
                  <option value="deadline">期限が近い順</option>
                </select>
              </div>

              {filteredScouts.length === 0 ? (
                <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
                  該当するスカウトはありません。
                </p>
              ) : (
                <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-1">
                  {filteredScouts.map((s) => {
                    const tags = deriveScoutTags(s.message);
                    const deadline = s.status === "sent" ? scoutDeadlineInfo(s.createdAt) : null;
                    const isSelected = s.id === selectedScoutId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleOpenScout(s.id)}
                        className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                SCOUT_STATUS_STYLE[s.status] ?? "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {SCOUT_STATUS_LABEL[s.status] ?? s.status}
                            </span>
                            {!s.isRead && (
                              <span className="flex-shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                未読
                              </span>
                            )}
                          </div>
                          <span className="flex-shrink-0 whitespace-nowrap text-[11px] text-gray-400">
                            {formatDateTime(s.createdAt)}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-gray-900">{s.companyName}</p>
                        <p className="truncate text-xs text-gray-600">{s.title || "(件名なし)"}</p>
                        {s.message && <p className="line-clamp-2 text-xs text-gray-500">{s.message}</p>}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {deadline && (
                          <p
                            className={`text-[11px] font-semibold ${
                              deadline.urgent ? "text-red-600" : "text-gray-400"
                            }`}
                          >
                            {deadline.text}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 右カラム: スカウト詳細表示 */}
            <div className="min-w-0">
              {selectedScout ? (
                <ScoutDetailPanel key={selectedScout.id} scout={selectedScout} onRespond={handleRespond} />
              ) : (
                <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
                  左の一覧からスカウトを選択すると、ここに詳細が表示されます。
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
