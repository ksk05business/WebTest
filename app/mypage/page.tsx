"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { UniversityField } from "@/src/components/UniversityField";
import { IndustrySelect } from "@/src/components/IndustrySelect";
import {
  DESIRED_OCCUPATIONS,
  FACULTY_TYPES,
  GRADUATION_MONTHS,
  GRADUATION_YEARS,
  MAX_DESIRED_OCCUPATIONS,
} from "@/src/data/formOptions";
import { MANUAL_ENTRY_UNIVERSITIES, UNIVERSITIES } from "@/src/data/universities";
import { LimitedCheckboxGroup } from "@/src/components/LimitedCheckboxGroup";
import { redirectToLogin } from "@/src/lib/authRedirect";

const ROMAJI_PATTERN = /^[A-Za-z\- ]+$/;

type Profile = {
  last_name: string;
  first_name: string;
  last_name_romaji: string;
  first_name_romaji: string;
  email: string;
  faculty_type: string;
  university: string;
  university_category: string | null;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  desired_occupations: string[];
  graduation_year: number;
  graduation_month: number;
  scout_consent: number;
};

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameRomaji, setLastNameRomaji] = useState("");
  const [firstNameRomaji, setFirstNameRomaji] = useState("");
  const [facultyType, setFacultyType] = useState("");
  const [university, setUniversity] = useState("");
  const [manualUniversityCategory, setManualUniversityCategory] = useState<string | null>(null);
  const [industryFirst, setIndustryFirst] = useState("");
  const [industrySecond, setIndustrySecond] = useState("");
  const [industryThird, setIndustryThird] = useState("");
  const [desiredOccupations, setDesiredOccupations] = useState<string[]>([]);
  const [graduationYear, setGraduationYear] = useState(String(GRADUATION_YEARS[0]));
  const [graduationMonth, setGraduationMonth] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoutConsent, setScoutConsent] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);
  const [savedProfile, setSavedProfile] = useState<Profile | null>(null);

  function applyProfile(data: Profile) {
    setEmail(data.email);
    setLastName(data.last_name);
    setFirstName(data.first_name);
    setLastNameRomaji(data.last_name_romaji);
    setFirstNameRomaji(data.first_name_romaji);
    setFacultyType(data.faculty_type);
    setUniversity(data.university);
    setManualUniversityCategory(
      data.university_category &&
        (MANUAL_ENTRY_UNIVERSITIES as string[]).includes(data.university_category) &&
        !(UNIVERSITIES as string[]).includes(data.university)
        ? data.university_category
        : null
    );
    setIndustryFirst(data.industry_first);
    setIndustrySecond(data.industry_second);
    setIndustryThird(data.industry_third);
    setDesiredOccupations(Array.isArray(data.desired_occupations) ? data.desired_occupations : []);
    setGraduationYear(String(data.graduation_year));
    setGraduationMonth(String(data.graduation_month));
    setScoutConsent(Boolean(data.scout_consent));
    setSavedProfile(data);
  }

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { email?: string };
    if (!user.email) {
      router.replace("/login");
      return;
    }

    fetch(`/api/me?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data: Profile & { error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") {
            redirectToLogin(router);
            return;
          }
          setError(data.error);
          return;
        }
        applyProfile(data);
      })
      .catch(() => setError("プロフィールの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [router]);

  function handleCancelEdit() {
    if (savedProfile) applyProfile(savedProfile);
    setError(null);
    setMode("view");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      !lastName.trim() ||
      !firstName.trim() ||
      !lastNameRomaji.trim() ||
      !firstNameRomaji.trim() ||
      !facultyType ||
      !university ||
      !industryFirst ||
      !industrySecond ||
      !industryThird ||
      desiredOccupations.length === 0
    ) {
      setError("すべての項目を入力してください");
      return;
    }
    if (desiredOccupations.length > MAX_DESIRED_OCCUPATIONS) {
      setError(`希望職種は最大${MAX_DESIRED_OCCUPATIONS}つまで選択してください`);
      return;
    }
    if (!ROMAJI_PATTERN.test(lastNameRomaji.trim()) || !ROMAJI_PATTERN.test(firstNameRomaji.trim())) {
      setError("Last Name / First Nameは半角アルファベットで入力してください");
      return;
    }
    if (
      industryFirst === industrySecond ||
      industryFirst === industryThird ||
      industrySecond === industryThird
    ) {
      setError("第一〜第三志望の業界はそれぞれ異なるものを選択してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lastName,
          firstName,
          lastNameRomaji,
          firstNameRomaji,
          facultyType,
          university,
          manualUniversityCategory,
          industryFirst,
          industrySecond,
          industryThird,
          desiredOccupations,
          graduationYear: Number(graduationYear),
          graduationMonth: Number(graduationMonth),
        }),
      });
      let data: { error?: string; name?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合
      }
      if (!res.ok || !data.name) {
        if (res.status === 401) {
          redirectToLogin(router);
          return;
        }
        setError(data.error ?? `更新に失敗しました（status: ${res.status}）`);
        return;
      }
      localStorage.setItem("spiUser", JSON.stringify({ name: data.name, email }));
      setSavedProfile({
        last_name: lastName,
        first_name: firstName,
        last_name_romaji: lastNameRomaji,
        first_name_romaji: firstNameRomaji,
        email,
        faculty_type: facultyType,
        university,
        university_category: manualUniversityCategory,
        industry_first: industryFirst,
        industry_second: industrySecond,
        industry_third: industryThird,
        desired_occupations: desiredOccupations,
        graduation_year: Number(graduationYear),
        graduation_month: Number(graduationMonth),
        scout_consent: scoutConsent ? 1 : 0,
      });
      setSuccess(true);
      setMode("view");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function handleScoutConsentChange(next: boolean) {
    setScoutConsent(next);
    setConsentSaving(true);
    setConsentMessage(null);
    try {
      const res = await fetch("/api/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scoutConsent: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          redirectToLogin(router);
          return;
        }
        setScoutConsent(!next);
        setConsentMessage(data.error ?? `更新に失敗しました（status: ${res.status}）`);
        return;
      }
      setConsentMessage(next ? "スカウト目的での情報提供に同意しました。" : "同意を撤回しました。");
    } catch {
      setScoutConsent(!next);
      setConsentMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setConsentSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
          {!loading && mode === "view" && (
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setMode("edit");
              }}
              className="rounded-full border border-blue-300 px-4 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              プロフィールを編集
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : mode === "view" ? (
          <div className="flex flex-col gap-4">
            {success && <p className="text-sm font-medium text-green-600">保存しました。</p>}
            <dl className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <div>
                <dt className="text-xs text-gray-500">メールアドレス</dt>
                <dd className="text-gray-900">{email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">氏名</dt>
                <dd className="text-gray-900">
                  {lastName} {firstName}（{lastNameRomaji} {firstNameRomaji}）
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">大学名</dt>
                <dd className="text-gray-900">{university || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">学部・区分</dt>
                <dd className="text-gray-900">{facultyType || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">志望業界（第一〜第三志望）</dt>
                <dd className="text-gray-900">
                  {industryFirst} / {industrySecond} / {industryThird}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">希望職種</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {desiredOccupations.length > 0 ? (
                    desiredOccupations.map((o) => (
                      <span
                        key={o}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {o}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">卒業年月</dt>
                <dd className="text-gray-900">
                  {graduationYear}年{graduationMonth}月
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              メールアドレス
              <input
                type="email"
                value={email}
                disabled
                className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500"
              />
              <span className="text-xs text-gray-400">
                メールアドレスの変更は現在サポートしていません
              </span>
            </label>

            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                苗字
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                名前
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500">アルファベット表記</p>
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                  Last Name
                  <input
                    type="text"
                    value={lastNameRomaji}
                    onChange={(e) => setLastNameRomaji(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                  First Name
                  <input
                    type="text"
                    value={firstNameRomaji}
                    onChange={(e) => setFirstNameRomaji(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              大学名
              <UniversityField
                value={university}
                onChange={setUniversity}
                onManualCategoryChange={setManualUniversityCategory}
                initialManualCategory={manualUniversityCategory}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              学部・区分
              <select
                value={facultyType}
                onChange={(e) => setFacultyType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              >
                <option value="">選択してください</option>
                {FACULTY_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">志望業界（第一〜第三志望）</p>
              <IndustrySelect label="第一志望" value={industryFirst} onChange={setIndustryFirst} />
              <IndustrySelect label="第二志望" value={industrySecond} onChange={setIndustrySecond} />
              <IndustrySelect label="第三志望" value={industryThird} onChange={setIndustryThird} />
            </div>

            <LimitedCheckboxGroup
              label="希望職種（最大3つまで選択可）"
              options={DESIRED_OCCUPATIONS}
              selected={desiredOccupations}
              onChange={setDesiredOccupations}
              max={MAX_DESIRED_OCCUPATIONS}
            />

            <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              卒業年月
              <div className="flex gap-2">
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                >
                  {GRADUATION_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <select
                  value={graduationMonth}
                  onChange={(e) => setGraduationMonth(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                >
                  {GRADUATION_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 rounded-full border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                編集をキャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "変更を保存"}
              </button>
            </div>
          </form>
        )}

        {!loading && (
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900">スカウト目的でのデータ共有</h2>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={scoutConsent}
                disabled={consentSaving}
                onChange={(e) => handleScoutConsentChange(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                成績・大学名・志望業界などの情報を、提携する就活エージェント・企業からのスカウト目的で共有することに同意します（任意）。詳しくは
                <a href="/terms" target="_blank" className="text-blue-600 underline">
                  利用規約
                </a>
                をご確認ください。
              </span>
            </label>
            {consentMessage && <p className="text-xs text-gray-600">{consentMessage}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
