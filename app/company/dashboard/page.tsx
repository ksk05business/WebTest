"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { ScoutSendModal } from "@/src/components/ScoutSendModal";
import { MbtiBadge } from "@/src/components/MbtiBadge";
import { DESIRED_OCCUPATIONS, FACULTY_TYPES, INDUSTRIES } from "@/src/data/formOptions";
import { UNIVERSITY_CATEGORIES } from "@/src/data/universityCategories";
import { MBTI_GROUP_LABELS, MBTI_GROUP_ORDER, MBTI_TYPES } from "@/src/data/mbti";
import { redirectToCompanyLogin } from "@/src/lib/authRedirect";

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

function MbtiCheckboxGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      MBTI指定（複数選択可）
      <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2">
        {MBTI_GROUP_ORDER.map((group) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400">{MBTI_GROUP_LABELS[group]}</p>
            {MBTI_TYPES.filter((t) => t.group === group).map((t) => (
              <label key={t.code} className="flex items-center gap-2 text-sm font-normal text-gray-700">
                <input
                  type="checkbox"
                  checked={selected.includes(t.code)}
                  onChange={() => onChange(toggleValue(selected, t.code))}
                />
                {t.code} ({t.nickname})
              </label>
            ))}
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
  desiredOccupations: string[];
  latestDeviationScore: number | null;
  mbti: string | null;
};

export default function CompanyDashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [approved, setApproved] = useState(false);

  const [universityCategories, setUniversityCategories] = useState<string[]>([]);
  const [facultyTypes, setFacultyTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [desiredOccupations, setDesiredOccupations] = useState<string[]>([]);
  const [mbtiCodes, setMbtiCodes] = useState<string[]>([]);
  const [minDeviation, setMinDeviation] = useState("");

  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [scoutTarget, setScoutTarget] = useState<Candidate | null>(null);
  const [sentNoteById, setSentNoteById] = useState<Record<number, string>>({});

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    const company = JSON.parse(raw) as {
      companyName?: string;
      contactName?: string;
      email?: string;
      approved?: boolean;
    };
    if (!company.email) {
      router.replace("/company/login");
      return;
    }
    setCompanyEmail(company.email);
    setCompanyName(company.companyName ?? "");
    setContactName(company.contactName ?? "");
    setApproved(Boolean(company.approved));
    setAuthChecked(true);
  }, [router]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);
    setSearching(true);
    try {
      const params = new URLSearchParams({ companyEmail });
      universityCategories.forEach((v) => params.append("universityCategory", v));
      facultyTypes.forEach((v) => params.append("facultyType", v));
      industries.forEach((v) => params.append("industry", v));
      desiredOccupations.forEach((v) => params.append("desiredOccupation", v));
      mbtiCodes.forEach((v) => params.append("mbti", v));
      if (minDeviation) params.set("minDeviation", minDeviation);

      const res = await fetch(`/api/company/scouts?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          redirectToCompanyLogin(router);
          return;
        }
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

              <CheckboxGroup
                label="志望業界（複数選択可）"
                options={INDUSTRIES}
                selected={industries}
                onChange={setIndustries}
              />

              <CheckboxGroup
                label="希望職種（複数選択可）"
                options={DESIRED_OCCUPATIONS}
                selected={desiredOccupations}
                onChange={setDesiredOccupations}
              />

              <MbtiCheckboxGroup selected={mbtiCodes} onChange={setMbtiCodes} />

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
                      <MbtiBadge code={c.mbti} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      志望業界: {c.industryFirst} / {c.industrySecond} / {c.industryThird}
                    </p>
                    {c.desiredOccupations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.desiredOccupations.map((o) => (
                          <span
                            key={o}
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                          >
                            {o}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setScoutTarget(c)}
                        className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        スカウトを送信する
                      </button>
                      {sentNoteById[c.studentId] && (
                        <span className="text-xs text-gray-600">{sentNoteById[c.studentId]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {scoutTarget && (
        <ScoutSendModal
          candidate={scoutTarget}
          companyEmail={companyEmail}
          companyName={companyName}
          contactName={contactName}
          onClose={() => setScoutTarget(null)}
          onSent={() =>
            setSentNoteById((m) => ({ ...m, [scoutTarget.studentId]: "スカウトを送信しました。" }))
          }
        />
      )}
    </div>
  );
}
