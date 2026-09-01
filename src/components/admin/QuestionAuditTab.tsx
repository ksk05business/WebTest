"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ChevronDown, Pencil, Search, Trash2 } from "lucide-react";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { TEST_TYPES } from "@/src/data/testTypes";
import { STOCK_CYCLES } from "@/src/data/examStockTargets";
import { QuestionEditModal } from "./QuestionEditModal";

export type AdminQuestion = {
  id: number;
  category: string;
  subCategory: string;
  title: string | null;
  questionText: string;
  tables: unknown;
  options: string[];
  correctAnswer: number;
  explanation: string[];
  difficulty: number;
  status: string;
  originalityNote: string | null;
  passageGroupId: number | null;
  imageDataUri: string | null;
  isReviewed: boolean;
  isMockOnly: boolean;
  createdAt: string;
};

type StockUnit = {
  testId: string | null;
  testName: string;
  sectionLabel: string | null;
  category: string;
  subCategory: string;
  practiceCount: number;
  mockCount: number;
  total: number;
  mockTarget: number | null;
  stockShortfall: number;
  stockStatus: "not_applicable" | "achieved" | "insufficient";
};

const PAGE_SIZE = 20;

type ReviewedFilter = "all" | "reviewed" | "unreviewed";
type MockFilter = "all" | "practice" | "mock";

// 選択中のテスト種別に属する単元一覧（単元セレクトの選択肢用）。groupLabelでどの科目かも分かるようにする。
function unitsForTest(testId: string): { category: string; subCategory: string; label: string }[] {
  const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testId] ?? [];
  return groups.flatMap((g) =>
    g.units.map((u) => ({ category: g.category, subCategory: u.subCategory, label: `${g.groupLabel} / ${u.label}` }))
  );
}

export function QuestionAuditTab({
  adminToken,
  onAuthError,
}: {
  adminToken: string;
  onAuthError: () => void;
}) {
  const [testId, setTestId] = useState<string>("");
  const [unitKey, setUnitKey] = useState<string>(""); // "category::subCategory" or ""
  const [reviewedFilter, setReviewedFilter] = useState<ReviewedFilter>("all");
  const [mockFilter, setMockFilter] = useState<MockFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [stockUnits, setStockUnits] = useState<StockUnit[] | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockCollapsed, setStockCollapsed] = useState(false);

  const units = useMemo(() => unitsForTest(testId), [testId]);

  function loadQuestions() {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams();

    if (unitKey) {
      const [category, subCategory] = unitKey.split("::");
      params.append("category", category);
      params.append("subCategory", subCategory);
    } else if (testId) {
      const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testId] ?? [];
      groups.forEach((g) => params.append("category", g.category));
    }

    if (reviewedFilter === "reviewed") params.set("reviewed", "true");
    if (reviewedFilter === "unreviewed") params.set("reviewed", "false");
    if (mockFilter === "practice") params.set("mockOnly", "false");
    if (mockFilter === "mock") params.set("mockOnly", "true");
    if (search) params.set("search", search);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(page * PAGE_SIZE));

    fetch(`/api/admin/questions?${params.toString()}`, { headers: { "x-admin-token": adminToken } })
      .then((res) => res.json())
      .then((data: { questions?: AdminQuestion[]; total?: number; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setQuestions(data.questions ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, testId, unitKey, reviewedFilter, mockFilter, search, page]);

  // 在庫サマリー（テスト種別・単元ごとの練習問題数／模試専用問題数／模試ストック達成状況）は
  // タブ表示時に一度だけ取得する（フィルタ操作のたびに取り直す必要はない）。
  useEffect(() => {
    fetch("/api/admin/question-stats", { headers: { "x-admin-token": adminToken } })
      .then((res) => res.json())
      .then((data: { units?: StockUnit[]; error?: string }) => {
        if (data.error) {
          setStockError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setStockUnits(data.units ?? []);
      })
      .catch(() => setStockError("在庫サマリーの取得に失敗しました。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const stockByTest = useMemo(() => {
    const map = new Map<string, StockUnit[]>();
    for (const u of stockUnits ?? []) {
      const list = map.get(u.testName);
      if (list) list.push(u);
      else map.set(u.testName, [u]);
    }
    return map;
  }, [stockUnits]);

  function handleTestChange(next: string) {
    setTestId(next);
    setUnitKey("");
    setPage(0);
  }

  function handleUnitChange(next: string) {
    setUnitKey(next);
    setPage(0);
  }

  function handleReviewedChange(next: ReviewedFilter) {
    setReviewedFilter(next);
    setPage(0);
  }

  function handleMockFilterChange(next: MockFilter) {
    setMockFilter(next);
    setPage(0);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  // 在庫サマリーの単元行をクリックすると、その単元の問題一覧へ即座に絞り込む。
  function jumpToUnit(u: StockUnit) {
    if (u.testId) setTestId(u.testId);
    setUnitKey(`${u.category}::${u.subCategory}`);
    setPage(0);
  }

  async function handleToggleReviewed(q: AdminQuestion) {
    setTogglingId(q.id);
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          category: q.category,
          subCategory: q.subCategory,
          title: q.title,
          questionText: q.questionText,
          tables: q.tables,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          status: q.status,
          originalityNote: q.originalityNote,
          passageGroupId: q.passageGroupId,
          imageDataUri: q.imageDataUri,
          isReviewed: !q.isReviewed,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        setLoadError("レビュー状態の更新に失敗しました");
        return;
      }
      setQuestions((list) =>
        (list ?? []).map((item) => (item.id === q.id ? { ...item, isReviewed: !q.isReviewed } : item))
      );
    } catch {
      setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(q: AdminQuestion) {
    if (!confirm(`この問題（ID: ${q.id}）を削除します。よろしいですか？\n\n${q.questionText.slice(0, 60)}...`)) {
      return;
    }
    setDeletingId(q.id);
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error ?? "削除に失敗しました");
        return;
      }
      setQuestions((list) => (list ?? []).filter((item) => item.id !== q.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setStockCollapsed((c) => !c)}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">問題データ在庫サマリー</span>
            {stockUnits && (
              <span className="text-xs text-gray-400">
                練習問題 {stockByTest.size > 0 && "計"}
                {(stockUnits ?? []).reduce((s, u) => s + u.practiceCount, 0)}問 / 模試専用{" "}
                {(stockUnits ?? []).reduce((s, u) => s + u.mockCount, 0)}問
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${stockCollapsed ? "" : "rotate-180"}`}
          />
        </button>

        {!stockCollapsed && (
          <div className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4">
            {stockError && <p className="text-sm font-medium text-red-600">{stockError}</p>}
            {!stockUnits && !stockError && <p className="text-sm text-gray-500">在庫を集計しています...</p>}
            {stockUnits &&
              Array.from(stockByTest.entries()).map(([testName, testUnits]) => (
                <div key={testName} className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-gray-700">{testName}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400">
                          <th className="px-2 py-1 font-medium">単元・形式</th>
                          <th className="px-2 py-1 font-medium">練習問題</th>
                          <th className="px-2 py-1 font-medium">模試専用</th>
                          <th className="px-2 py-1 font-medium">在庫状況</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testUnits.map((u) => (
                          <tr
                            key={`${u.category}::${u.subCategory}`}
                            onClick={() => jumpToUnit(u)}
                            className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-2 py-1.5 text-gray-800">
                              {u.subCategory}
                              {u.sectionLabel && u.sectionLabel !== u.subCategory && (
                                <span className="ml-1 text-xs text-gray-400">（{u.sectionLabel}）</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-gray-600">{u.practiceCount}問</td>
                            <td className="px-2 py-1.5 text-gray-600">{u.mockCount}問</td>
                            <td className="px-2 py-1.5">
                              {u.stockStatus === "achieved" && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                  目標{STOCK_CYCLES}回分クリア
                                </span>
                              )}
                              {u.stockStatus === "insufficient" && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                  残り{u.stockShortfall}問不足（目標{u.mockTarget}問）
                                </span>
                              )}
                              {u.stockStatus === "not_applicable" && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                                  模試未使用
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="問題文・タイトルをキーワード検索"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          検索
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(0);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            クリア
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          テスト種別
          <select
            value={testId}
            onChange={(e) => handleTestChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          >
            <option value="">すべて</option>
            {TEST_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          単元
          <select
            value={unitKey}
            onChange={(e) => handleUnitChange(e.target.value)}
            disabled={!testId || units.length === 0}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">すべての単元</option>
            {units.map((u) => (
              <option key={`${u.category}::${u.subCategory}`} value={`${u.category}::${u.subCategory}`}>
                {u.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          {(["all", "unreviewed", "reviewed"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleReviewedChange(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                reviewedFilter === f
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "すべて" : f === "unreviewed" ? "未確認のみ" : "確認済みのみ"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {(["all", "practice", "mock"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleMockFilterChange(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                mockFilter === f
                  ? "bg-purple-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f === "all" ? "練習/模試すべて" : f === "practice" ? "練習問題のみ" : "模試専用のみ"}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-gray-400">{total}件</span>
      </div>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}

      {loading && !questions ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : questions && questions.length === 0 ? (
        <p className="text-sm text-gray-500">該当する問題はありません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(questions ?? []).map((q) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {q.category}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {q.subCategory}
                  </span>
                  <span className="text-xs text-gray-400">ID: {q.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      q.isMockOnly ? "bg-purple-100 text-purple-700" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {q.isMockOnly ? "模試専用" : "練習問題"}
                  </span>
                  {q.status !== "published" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      {q.status === "draft" ? "下書き" : "非公開"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleReviewed(q)}
                    disabled={togglingId === q.id}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                      q.isReviewed
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {q.isReviewed ? "確認完了" : "未確認"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(q)}
                    className="flex items-center gap-1 rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q)}
                    disabled={deletingId === q.id}
                    className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    削除
                  </button>
                </div>
              </div>

              {q.title && <p className="mt-2 text-sm font-semibold text-gray-800">{q.title}</p>}
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{q.questionText}</p>

              {q.imageDataUri && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.imageDataUri}
                  alt="設問の図表"
                  className="mt-2 max-h-48 max-w-full rounded-lg border border-gray-200"
                />
              )}

              <ul className="mt-3 flex flex-col gap-1">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      i === q.correctAnswer
                        ? "border-green-400 bg-green-50 font-semibold text-green-800"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                    {i === q.correctAnswer && <span className="ml-2 text-xs">（正解）</span>}
                  </li>
                ))}
              </ul>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p className="mb-1 text-xs font-bold text-gray-500">解説</p>
                <ol className="list-decimal space-y-0.5 pl-5">
                  {q.explanation.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-full border border-gray-300 px-4 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            前へ
          </button>
          <span className="text-gray-500">
            {page + 1} / {totalPages}ページ
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-full border border-gray-300 px-4 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            次へ
          </button>
        </div>
      )}

      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          adminToken={adminToken}
          onClose={() => setEditingQuestion(null)}
          onAuthError={onAuthError}
          onSaved={(updated) => {
            setQuestions((list) => (list ?? []).map((item) => (item.id === updated.id ? updated : item)));
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}
