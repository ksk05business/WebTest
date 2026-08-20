"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { FACULTY_TYPES, INDUSTRY_GROUPS } from "@/src/data/formOptions";
import { UNIVERSITY_CATEGORIES } from "@/src/data/universityCategories";

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm font-normal text-gray-700">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => onChange(toggleValue(selected, o))}
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function IndustryCheckboxGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:col-span-2">
      志望業界
      <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2">
        {INDUSTRY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-500">{group.label}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {group.options.map((o) => (
                <label key={o} className="flex items-center gap-1 text-sm font-normal text-gray-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(o)}
                    onChange={() => onChange(toggleValue(selected, o))}
                  />
                  {o}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Candidate = {
  studentId: number;
  universityCategory: string | null;
  facultyType: string;
  industryFirst: string;
  industrySecond: string;
  industryThird: string;
  latestDeviationScore: number | null;
};

type SentScout = {
  id: number;
  status: string;
  isAnonymous: boolean;
  message: string | null;
  createdAt: string;
  universityCategory: string | null;
  facultyType: string;
  industryFirst: string;
  industrySecond: string;
  industryThird: string;
  lastName: string | null;
  firstName: string | null;
  email: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  sent: "未対応",
  accepted: "承諾済み",
  declined: "辞退済み",
};

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [approved, setApproved] = useState(false);

  const [universityCategories, setUniversityCategories] = useState<string[]>([]);
  const [facultyTypes, setFacultyTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [minDeviation, setMinDeviation] = useState("");

  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Record<number, string>>({});
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendMessageById, setSendMessageById] = useState<Record<number, string>>({});

  const [sentScouts, setSentScouts] = useState<SentScout[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    const company = JSON.parse(raw) as { companyName?: string; email?: string; approved?: boolean };
    if (!company.email) {
      router.replace("/company/login");
      return;
    }
    setCompanyEmail(company.email);
    setCompanyName(company.companyName ?? "");
    setApproved(Boolean(company.approved));
    setAuthChecked(true);

    if (company.approved) {
      loadSentScouts(company.email);
    }
  }, [router]);

  function loadSentScouts(email: string) {
    fetch(`/api/company/sent-scouts?companyEmail=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data: { scouts?: SentScout[] }) => {
        if (data.scouts) setSentScouts(data.scouts);
      })
      .catch(() => {
        // 送信済み一覧の取得に失敗してもダッシュボード自体は表示する
      });
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);
    setSearching(true);
    try {
      const params = new URLSearchParams({ companyEmail });
      universityCategories.forEach((v) => params.append("universityCategory", v));
      facultyTypes.forEach((v) => params.append("facultyType", v));
      industries.forEach((v) => params.append("industry", v));
      if (minDeviation) params.set("minDeviation", minDeviation);

      const res = await fetch(`/api/company/scouts?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSearchError(data.error ?? `検索に失敗しました（status: ${res.status}）`);
        setCandidates(null);
        return;
      }
      setCandidates(data.candidates ?? []);
    } catch {
      setSearchError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSearching(false);
    }
  }

  async function handleSendScout(studentId: number) {
    setSendingId(studentId);
    setSendMessageById((m) => ({ ...m, [studentId]: "" }));
    try {
      const res = await fetch("/api/company/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyEmail,
          studentId,
          message: messages[studentId] ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendMessageById((m) => ({ ...m, [studentId]: data.error ?? "送信に失敗しました" }));
        return;
      }
      setSendMessageById((m) => ({ ...m, [studentId]: "スカウトを送信しました。" }));
      loadSentScouts(companyEmail);
    } catch {
      setSendMessageById((m) => ({
        ...m,
        [studentId]: "通信エラーが発生しました。時間をおいて再度お試しください。",
      }));
    } finally {
      setSendingId(null);
    }
  }

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <CompanyHeader companyName={companyName} />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        {!approved ? (
          <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-bold">アカウントは運営の承認待ちです。</p>
            <p className="mt-1">
              承認され次第、候補者の検索・スカウト送信がご利用いただけるようになります。
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <h1 className="text-lg font-bold text-gray-900">候補者を探す</h1>
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2"
              >
                <CheckboxGroup
                  label="大学区分（複数選択可）"
                  options={UNIVERSITY_CATEGORIES}
                  selected={universityCategories}
                  onChange={setUniversityCategories}
                />

                <CheckboxGroup
                  label="学部・区分（文理、複数選択可）"
                  options={FACULTY_TYPES}
                  selected={facultyTypes}
                  onChange={setFacultyTypes}
                />

                <IndustryCheckboxGroup selected={industries} onChange={setIndustries} />

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  SPI偏差値（以上）
                  <input
                    type="number"
                    value={minDeviation}
                    onChange={(e) => setMinDeviation(e.target.value)}
                    placeholder="例: 55"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full rounded-full bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-8"
                  >
                    {searching ? "検索中..." : "検索する"}
                  </button>
                </div>
              </form>

              {searchError && <p className="text-sm font-medium text-red-600">{searchError}</p>}

              {candidates && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-gray-500">{candidates.length}件の候補者</p>
                  {candidates.map((c) => (
                    <div key={c.studentId} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                          {c.universityCategory ?? "区分未設定"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">{c.facultyType}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">
                          偏差値:{" "}
                          {c.latestDeviationScore !== null ? c.latestDeviationScore.toFixed(1) : "未受験"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        志望業界: {c.industryFirst} / {c.industrySecond} / {c.industryThird}
                      </p>
                      <textarea
                        value={messages[c.studentId] ?? ""}
                        onChange={(e) =>
                          setMessages((m) => ({ ...m, [c.studentId]: e.target.value }))
                        }
                        placeholder="スカウトメッセージ（任意）"
                        rows={2}
                        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          type="button"
                          disabled={sendingId === c.studentId}
                          onClick={() => handleSendScout(c.studentId)}
                          className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {sendingId === c.studentId ? "送信中..." : "スカウトを送る"}
                        </button>
                        {sendMessageById[c.studentId] && (
                          <span className="text-xs text-gray-600">{sendMessageById[c.studentId]}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-gray-900">送信済みスカウト</h2>
              {sentScouts.length === 0 ? (
                <p className="text-sm text-gray-500">まだスカウトを送信していません。</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                          状態
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                          大学区分/文理
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                          氏名・連絡先
                        </th>
                        <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-800">
                          送信日時
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentScouts.map((s) => (
                        <tr key={s.id}>
                          <td className="border-b border-gray-100 px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                s.status === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : s.status === "declined"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {STATUS_LABEL[s.status] ?? s.status}
                            </span>
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2 text-gray-700">
                            {s.universityCategory ?? "-"} / {s.facultyType}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2 text-gray-700">
                            {s.isAnonymous ? (
                              <span className="text-gray-400">承諾待ち（非開示）</span>
                            ) : (
                              <span>
                                {s.lastName} {s.firstName}（{s.email}）
                              </span>
                            )}
                          </td>
                          <td className="border-b border-gray-100 px-3 py-2 text-gray-500">
                            {s.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
