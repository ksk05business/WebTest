"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FACULTY_TYPES, INDUSTRY_GROUPS } from "@/src/data/formOptions";
import { MANUAL_ENTRY_UNIVERSITIES, UNIVERSITIES } from "@/src/data/universities";

const UNIVERSITY_OPTIONS = [...UNIVERSITIES, ...MANUAL_ENTRY_UNIVERSITIES];
const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) => 2026 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const ROMAJI_PATTERN = /^[A-Za-z\- ]+$/;

function IndustrySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      >
        <option value="">選択してください</option>
        {INDUSTRY_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function UniversityField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [manualLabel, setManualLabel] = useState<string | null>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  if (manualLabel) {
    return (
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${manualLabel}の大学名を入力してください`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
        <button
          type="button"
          onClick={() => {
            setManualLabel(null);
            setQuery("");
            onChange("");
          }}
          className="self-start text-xs text-blue-600 underline"
        >
          一覧から選び直す
        </button>
      </div>
    );
  }

  const filtered =
    query.trim() === ""
      ? UNIVERSITY_OPTIONS
      : UNIVERSITY_OPTIONS.filter((u) => u.includes(query.trim()));

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="大学名を入力して検索"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">該当する大学がありません</li>
          )}
          {filtered.map((u) => (
            <li key={u}>
              <button
                type="button"
                onMouseDown={() => {
                  if (MANUAL_ENTRY_UNIVERSITIES.includes(u)) {
                    setManualLabel(u);
                    onChange("");
                    setOpen(false);
                    return;
                  }
                  onChange(u);
                  setQuery(u);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-blue-50"
              >
                {u}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameRomaji, setLastNameRomaji] = useState("");
  const [firstNameRomaji, setFirstNameRomaji] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [facultyType, setFacultyType] = useState("");
  const [university, setUniversity] = useState("");
  const [industryFirst, setIndustryFirst] = useState("");
  const [industrySecond, setIndustrySecond] = useState("");
  const [industryThird, setIndustryThird] = useState("");
  const [graduationYear, setGraduationYear] = useState(String(GRADUATION_YEARS[0]));
  const [graduationMonth, setGraduationMonth] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !lastName.trim() ||
      !firstName.trim() ||
      !lastNameRomaji.trim() ||
      !firstNameRomaji.trim() ||
      !email.trim() ||
      !password ||
      !passwordConfirm ||
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
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName,
          firstName,
          lastNameRomaji,
          firstNameRomaji,
          email,
          password,
          facultyType,
          university,
          industryFirst,
          industrySecond,
          industryThird,
          graduationYear: Number(graduationYear),
          graduationMonth: Number(graduationMonth),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "登録に失敗しました");
        return;
      }
      router.push("/login");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">会員登録</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <p className="text-xs text-gray-500">
            アルファベット表記（英語版サイトで使用します）
          </p>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
              Last Name
              <input
                type="text"
                value={lastNameRomaji}
                onChange={(e) => setLastNameRomaji(e.target.value)}
                placeholder="Yamada"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
              First Name
              <input
                type="text"
                value={firstNameRomaji}
                onChange={(e) => setFirstNameRomaji(e.target.value)}
                placeholder="Taro"
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          パスワード（8文字以上）
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          パスワード（確認用）
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
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

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          大学名
          <UniversityField value={university} onChange={setUniversity} />
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
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-blue-600 underline">
          ログイン
        </Link>
      </p>
    </main>
  );
}
