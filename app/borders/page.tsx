"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2, X } from "lucide-react";
import { INDUSTRIES } from "@/src/data/formOptions";
import { TEST_TYPES } from "@/src/data/testTypes";

type CompanyBorder = {
  id: number;
  companyName: string;
  companyNameKana: string;
  industry: string;
  testType: string;
  borderLevel: string;
  selectionTiming: string;
  description: string;
};

const BORDER_LEVEL_STYLE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-blue-100 text-blue-700",
  B: "bg-emerald-100 text-emerald-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-gray-100 text-gray-600",
};

export default function BordersPage() {
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  const [borders, setBorders] = useState<CompanyBorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (keyword.trim()) params.set("q", keyword.trim());
        if (industry) params.set("industry", industry);
        for (const t of selectedTestTypes) params.append("testType", t);

        const res = await fetch(`/api/company-borders?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError("検索に失敗しました。時間をおいて再度お試しください。");
          return;
        }
        setBorders(data.borders ?? []);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("通信エラーが発生しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [keyword, industry, selectedTestTypes]);

  // 検索結果（漢字・ふりがな両方に部分一致済み）の企業名をそのままサジェスト候補として使う。
  // 別途サジェスト専用のAPIは設けず、既に取得済みのデータを再利用する。
  const suggestions = useMemo(() => {
    const names = Array.from(new Set(borders.map((b) => b.companyName)));
    return names.slice(0, 8);
  }, [borders]);

  function toggleTestType(name: string) {
    setSelectedTestTypes((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-blue-700">
            Webテスト<span className="text-gray-900">ナビ</span>
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
          >
            無料登録
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">企業ボーダー検索</h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              志望企業の適性検査ボーダーライン目安を検索できます。企業名・業界・検査種別で絞り込み、対策の優先順位を決める参考にしてください。
            </p>
          </div>

          {/* 検索・フィルターパネル */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setSuggestionsOpen(false)}
                placeholder="企業名で検索（ひらがなでもOK。例: 三菱商事 / みつびし）"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-9 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="検索キーワードをクリア"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* サジェスト（オートコンプリート）候補 */}
              {suggestionsOpen && keyword.trim() && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {suggestions.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        // onBlurより先に発火させるためonMouseDownを使う（onClickだと入力欄のblurが
                        // 先に走りサジェストが消えてしまい、クリックが成立しない）。
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setKeyword(name);
                          setSuggestionsOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-500">業界で絞り込み</span>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none sm:max-w-xs"
                >
                  <option value="">すべての業界</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-500">検査種別で絞り込み</span>
                <div className="flex flex-wrap gap-2">
                  {TEST_TYPES.map((t) => {
                    const active = selectedTestTypes.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTestType(t.name)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 検索結果 */}
          {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">検索中...</p>
          ) : borders.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              条件に一致する企業が見つかりませんでした。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {borders.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div>
                        <p className="font-bold text-gray-900">{b.companyName}</p>
                        <p className="text-xs text-gray-500">{b.industry}</p>
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        BORDER_LEVEL_STYLE[b.borderLevel] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      ボーダー {b.borderLevel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                      {b.testType}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-gray-600">{b.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
