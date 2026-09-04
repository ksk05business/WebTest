"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, User } from "lucide-react";
import {
  DEFAULT_DESIRED_OCCUPATIONS,
  DESIRED_OCCUPATIONS,
  FACULTY_TYPES,
  GRADUATION_MONTHS,
  GRADUATION_YEARS,
  MAX_DESIRED_OCCUPATIONS,
} from "@/src/data/formOptions";
import { IndustrySelect } from "@/src/components/IndustrySelect";
import { UniversityField } from "@/src/components/UniversityField";
import { LimitedCheckboxGroup } from "@/src/components/LimitedCheckboxGroup";
import { AuthLayout } from "@/src/components/AuthLayout";
import { IconInput } from "@/src/components/IconInput";
import { MbtiSelect } from "@/src/components/MbtiSelect";
import { TermsAgreementModal } from "@/src/components/TermsAgreementModal";

const ROMAJI_PATTERN = /^[A-Za-z\- ]+$/;

const SELECT_CLASS =
  "min-h-9 rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-900 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

// Enterキーで送信せず、フォーム内の次のinput/selectへフォーカスを移動する。
function focusNextField(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const form = (e.currentTarget as HTMLInputElement).form;
  if (!form) return;
  const focusables = Array.from(
    form.querySelectorAll<HTMLElement>(
      "input:not([type=checkbox]):not([disabled]), select:not([disabled]), textarea:not([disabled])"
    )
  );
  const index = focusables.indexOf(e.currentTarget as HTMLElement);
  if (index > -1 && index < focusables.length - 1) {
    focusables[index + 1].focus();
  }
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
  const [manualUniversityCategory, setManualUniversityCategory] = useState<string | null>(null);
  const [industryFirst, setIndustryFirst] = useState("");
  const [industrySecond, setIndustrySecond] = useState("");
  const [industryThird, setIndustryThird] = useState("");
  const [desiredOccupations, setDesiredOccupations] = useState<string[]>(DEFAULT_DESIRED_OCCUPATIONS);
  const [mbti, setMbti] = useState("");
  const [graduationYear, setGraduationYear] = useState(String(GRADUATION_YEARS[0]));
  const [graduationMonth, setGraduationMonth] = useState("3");
  // 利用規約（モーダルを最後までスクロールして初めて同意可能）とプライバシーポリシー
  // （直接チェック可能。成績・プロフィール情報の企業への共有＝スカウト機能への同意もここに内包）を分離。
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const agreedAll = agreedToTerms && agreedToPrivacy;

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
    if (!agreedAll) {
      setError("利用規約・プライバシーポリシーへの同意が必要です");
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
          manualUniversityCategory,
          industryFirst,
          industrySecond,
          industryThird,
          desiredOccupations,
          mbti,
          graduationYear: Number(graduationYear),
          graduationMonth: Number(graduationMonth),
          agreedTerms: agreedAll,
          // プライバシーポリシーへの同意に、成績・プロフィール情報の企業への共有（スカウト機能）
          // への同意を内包している（登録フォーム上の独立チェックボックスは廃止済み）。
          scoutConsent: agreedToPrivacy,
        }),
      });
      let data: { error?: string; name?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合（例: エンドポイント未配信）
      }
      if (!res.ok || !data.name) {
        setError(data.error ?? `登録に失敗しました（status: ${res.status}）`);
        return;
      }
      localStorage.setItem("spiUser", JSON.stringify({ name: data.name, email }));
      router.push("/dashboard");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="会員登録"
      subtitle="無料で登録して模試とスカウトをはじめよう"
      maxWidthClassName="max-w-3xl"
      outerPaddingClassName="py-4 sm:py-6"
      cardPaddingClassName="p-5 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            苗字
            <IconInput
              icon={User}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={focusNextField}
              compact
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            名前
            <IconInput
              icon={User}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={focusNextField}
              compact
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Last Name（アルファベット）
            <input
              type="text"
              value={lastNameRomaji}
              onChange={(e) => setLastNameRomaji(e.target.value)}
              onKeyDown={focusNextField}
              placeholder="Yamada"
              className={`w-full ${SELECT_CLASS}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            First Name（アルファベット）
            <input
              type="text"
              value={firstNameRomaji}
              onChange={(e) => setFirstNameRomaji(e.target.value)}
              onKeyDown={focusNextField}
              placeholder="Taro"
              className={`w-full ${SELECT_CLASS}`}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:col-span-2">
            メールアドレス
            <IconInput
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={focusNextField}
              placeholder="you@example.com"
              compact
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            パスワード（8文字以上）
            <IconInput
              icon={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={focusNextField}
              placeholder="••••••••"
              compact
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            パスワード（確認用）
            <IconInput
              icon={Lock}
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              onKeyDown={focusNextField}
              placeholder="••••••••"
              compact
              className={
                passwordConfirm && password !== passwordConfirm
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : ""
              }
            />
            {passwordConfirm && password !== passwordConfirm && (
              <p className="text-xs font-medium text-red-600">パスワードが一致しません</p>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:col-span-2">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              大学名
            </span>
            <UniversityField
              value={university}
              onChange={setUniversity}
              onManualCategoryChange={setManualUniversityCategory}
              onKeyDown={focusNextField}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            学部・区分
            <select
              value={facultyType}
              onChange={(e) => setFacultyType(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">選択してください</option>
              {FACULTY_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            卒業年月
            <div className="flex gap-2">
              <select
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className={`flex-1 ${SELECT_CLASS}`}
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
                className={`flex-1 ${SELECT_CLASS}`}
              >
                {GRADUATION_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <p className="text-sm font-medium text-gray-700">志望業界（第一〜第三志望）</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <IndustrySelect label="第一志望" value={industryFirst} onChange={setIndustryFirst} />
              <IndustrySelect label="第二志望" value={industrySecond} onChange={setIndustrySecond} />
              <IndustrySelect label="第三志望" value={industryThird} onChange={setIndustryThird} />
            </div>
          </div>

          <div className="sm:col-span-2">
            <LimitedCheckboxGroup
              label="希望職種（最大3つまで選択可）"
              options={DESIRED_OCCUPATIONS}
              selected={desiredOccupations}
              onChange={setDesiredOccupations}
              max={MAX_DESIRED_OCCUPATIONS}
              compact
            />
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:col-span-2">
            MBTI（16タイプ・任意）
            <MbtiSelect value={mbti} onChange={setMbti} className={SELECT_CLASS} />
            <span className="text-xs font-normal text-gray-400">
              わからない場合は「わからない / 回答しない」のままで構いません。
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agreedToTerms}
              disabled
              readOnly
              className="mt-0.5 h-4 w-4 accent-blue-600 disabled:opacity-100"
            />
            <span>
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="font-semibold text-blue-600 underline hover:text-blue-700"
              >
                利用規約
              </button>
              の内容を最後までご確認のうえ、同意します（必須）
              {agreedToTerms && (
                <span className="ml-1 font-semibold text-green-600">✓ 同意済み</span>
              )}
            </span>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-600"
            />
            <span>
              <Link href="/privacy" target="_blank" className="font-semibold text-blue-600 underline">
                プライバシーポリシー
              </Link>
              に同意します（必須）
            </span>
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <p className="flex items-start gap-1 text-xs text-gray-500">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          ご入力いただいた氏名・メールアドレスは暗号化して厳重に保管されます。本人の同意なく企業に公開されることは一切ありません。
        </p>

        <button
          type="submit"
          disabled={
            submitting || !agreedAll || (passwordConfirm !== "" && password !== passwordConfirm)
          }
          className="mt-1 min-h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>

      <p className="mt-3 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
          ログイン
        </Link>
      </p>

      {termsModalOpen && (
        <TermsAgreementModal
          onAgree={() => {
            setAgreedToTerms(true);
            setTermsModalOpen(false);
          }}
          onClose={() => setTermsModalOpen(false)}
        />
      )}
    </AuthLayout>
  );
}
