"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { UniversityField } from "@/src/components/UniversityField";
import { IndustrySelect } from "@/src/components/IndustrySelect";
import { FACULTY_TYPES, GRADUATION_MONTHS, GRADUATION_YEARS } from "@/src/data/formOptions";

const ROMAJI_PATTERN = /^[A-Za-z\- ]+$/;

type Profile = {
  last_name: string;
  first_name: string;
  last_name_romaji: string;
  first_name_romaji: string;
  email: string;
  faculty_type: string;
  university: string;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  graduation_year: number;
  graduation_month: number;
  scout_consent: number;
};

type ScoutItem = {
  id: number;
  companyName: string;
  message: string | null;
  status: string;
  isAnonymous: boolean;
  createdAt: string;
};

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameRomaji, setLastNameRomaji] = useState("");
  const [firstNameRomaji, setFirstNameRomaji] = useState("");
  const [facultyType, setFacultyType] = useState("");
  const [university, setUniversity] = useState("");
  const [industryFirst, setIndustryFirst] = useState("");
  const [industrySecond, setIndustrySecond] = useState("");
  const [industryThird, setIndustryThird] = useState("");
  const [graduationYear, setGraduationYear] = useState(String(GRADUATION_YEARS[0]));
  const [graduationMonth, setGraduationMonth] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scoutConsent, setScoutConsent] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);
  const [examSummary, setExamSummary] = useState<{
    attemptCount: number;
    latestDeviationScore: number | null;
    bestAccuracyRate: number | null;
  } | null>(null);
  const [scouts, setScouts] = useState<ScoutItem[]>([]);
  const [scoutActionId, setScoutActionId] = useState<number | null>(null);
  const [scoutError, setScoutError] = useState<string | null>(null);

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

    fetch(`/api/exam-results?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setExamSummary(data);
      })
      .catch(() => {
        // 成績サマリーの取得に失敗してもマイページ自体は表示する
      });

    loadScouts(user.email);

    fetch(`/api/me?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data: Profile & { error?: string }) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setEmail(data.email);
        setLastName(data.last_name);
        setFirstName(data.first_name);
        setLastNameRomaji(data.last_name_romaji);
        setFirstNameRomaji(data.first_name_romaji);
        setFacultyType(data.faculty_type);
        setUniversity(data.university);
        setIndustryFirst(data.industry_first);
        setIndustrySecond(data.industry_second);
        setIndustryThird(data.industry_third);
        setGraduationYear(String(data.graduation_year));
        setGraduationMonth(String(data.graduation_month));
        setScoutConsent(Boolean(data.scout_consent));
      })
      .catch(() => setError("プロフィールの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [router]);

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
      !industryThird
    ) {
      setError("すべての項目を入力してください");
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
          industryFirst,
          industrySecond,
          industryThird,
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
        setError(data.error ?? `更新に失敗しました（status: ${res.status}）`);
        return;
      }
      localStorage.setItem("spiUser", JSON.stringify({ name: data.name, email }));
      setSuccess(true);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  function loadScouts(userEmail: string) {
    fetch(`/api/scouts?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data: { scouts?: ScoutItem[]; error?: string }) => {
        if (data.scouts) setScouts(data.scouts);
      })
      .catch(() => {
        // スカウト一覧の取得に失敗してもマイページ自体は表示する
      });
  }

  async function handleScoutAction(scoutId: number, action: "accept" | "decline") {
    setScoutActionId(scoutId);
    setScoutError(null);
    try {
      const res = await fetch("/api/scouts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, scoutId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScoutError(data.error ?? "更新に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      loadScouts(email);
    } catch {
      setScoutError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setScoutActionId(null);
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
        <h1 className="text-2xl font-bold text-gray-900">マイページ</h1>

        {examSummary && examSummary.attemptCount > 0 && (
          <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            模試の成績: 最新偏差値{" "}
            <span className="font-bold text-blue-700">
              {examSummary.latestDeviationScore !== null
                ? examSummary.latestDeviationScore.toFixed(1)
                : "-"}
            </span>
            ／最高正答率{" "}
            <span className="font-bold text-blue-700">
              {examSummary.bestAccuracyRate !== null
                ? `${Math.round(examSummary.bestAccuracyRate * 100)}%`
                : "-"}
            </span>
            （受験{examSummary.attemptCount}回）
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
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
              <UniversityField value={university} onChange={setUniversity} />
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
            {success && (
              <p className="text-sm font-medium text-green-600">保存しました。</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </form>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-900">届いたスカウト</h2>
            {scoutError && <p className="text-sm font-medium text-red-600">{scoutError}</p>}
            {scouts.length === 0 ? (
              <p className="text-sm text-gray-500">まだスカウトは届いていません。</p>
            ) : (
              <div className="flex flex-col gap-3">
                {scouts.map((s) => (
                  <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{s.companyName}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : s.status === "declined"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {s.status === "sent" ? "未対応" : s.status === "accepted" ? "承諾済み" : "辞退済み"}
                      </span>
                    </div>
                    {s.message && <p className="mt-2 text-sm text-gray-700">{s.message}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                      {s.isAnonymous
                        ? "承諾するまで、あなたの氏名・メールアドレスはこの企業に開示されません。"
                        : "承諾済み：この企業にはあなたの氏名・メールアドレスが開示されています。"}
                    </p>
                    {s.status === "sent" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={scoutActionId === s.id}
                          onClick={() => handleScoutAction(s.id, "accept")}
                          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          承諾する
                        </button>
                        <button
                          type="button"
                          disabled={scoutActionId === s.id}
                          onClick={() => handleScoutAction(s.id, "decline")}
                          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          辞退する
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
