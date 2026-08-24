"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, ShieldCheck, User } from "lucide-react";
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

const ROMAJI_PATTERN = /^[A-Za-z\- ]+$/;

const SELECT_CLASS =
  "rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [scoutConsent, setScoutConsent] = useState(true);
  const [scoutDetailsOpen, setScoutDetailsOpen] = useState(false);
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
    if (!agreedTerms) {
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
          agreedTerms,
          scoutConsent,
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
    <AuthLayout title="会員登録" subtitle="無料で登録して模試とスカウトをはじめよう">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
            苗字
            <IconInput
              icon={User}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
            名前
            <IconInput
              icon={User}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">アルファベット表記</p>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
              Last Name
              <input
                type="text"
                value={lastNameRomaji}
                onChange={(e) => setLastNameRomaji(e.target.value)}
                placeholder="Yamada"
                className={`w-full ${SELECT_CLASS}`}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
              First Name
              <input
                type="text"
                value={firstNameRomaji}
                onChange={(e) => setFirstNameRomaji(e.target.value)}
                placeholder="Taro"
                className={`w-full ${SELECT_CLASS}`}
              />
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          メールアドレス
          <IconInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          パスワード（8文字以上）
          <IconInput
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          パスワード（確認用）
          <IconInput
            icon={Lock}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            className={
              passwordConfirm && password !== passwordConfirm
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                : ""
            }
          />
          {passwordConfirm && password !== passwordConfirm && (
            <p className="text-xs font-medium text-red-600">
              パスワードが一致しません。もう一度正しいパスワードを入力してください。
            </p>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            大学名
          </span>
          <UniversityField
            value={university}
            onChange={setUniversity}
            onManualCategoryChange={setManualUniversityCategory}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          MBTI（16タイプ・任意）
          <MbtiSelect value={mbti} onChange={setMbti} className={SELECT_CLASS} />
          <span className="text-xs font-normal text-gray-400">
            わからない場合は「わからない / 回答しない」のままで構いません。
          </span>
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
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

        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-blue-600"
            />
            <span>
              <Link href="/terms" target="_blank" className="text-blue-600 underline">
                利用規約
              </Link>
              および
              <Link href="/privacy" target="_blank" className="text-blue-600 underline">
                プライバシーポリシー
              </Link>
              に同意します（必須）
            </span>
          </label>

          <div className="flex items-start justify-between gap-2">
            <label className="flex flex-1 items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={scoutConsent}
                onChange={(e) => setScoutConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-blue-600"
              />
              <span>成績・プロフィール情報の直接採用企業への共有に同意する（スカウト受信機能）</span>
            </label>
            <button
              type="button"
              onClick={() => setScoutDetailsOpen((v) => !v)}
              className="flex-shrink-0 whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {scoutDetailsOpen ? "詳細 ▲" : "詳細 ▼"}
            </button>
          </div>

          {scoutDetailsOpen && (
            <div className="ml-6 flex flex-col gap-2 rounded-lg bg-white p-3 text-xs text-gray-600">
              <p>
                成績・大学区分・志望業界などの情報を、提携する直接採用企業からのスカウト目的で共有することに同意します（任意）。同意しなくても模試・練習問題はご利用いただけます。
              </p>
              <p className="font-semibold text-blue-700">
                Webテストナビでは、人材紹介業者ではなく直接採用を行う企業からのみスカウトが届きます。
              </p>
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  2段階開示の仕組み
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>
                    同意しても、氏名・メールアドレスなどご本人を特定できる情報は企業に一切開示されません。企業に見えるのは大学区分・文理・志望業界・模試の偏差値など匿名化された情報のみです。
                  </li>
                  <li>
                    企業から匿名スカウトが届いた場合、内容を確認したうえで「承諾」した場合に限り、その企業にのみ氏名・メールアドレスが開示されます。「辞退」すれば開示されません。
                  </li>
                  <li>
                    この同意はいつでもマイページ/プロフィールから撤回できます（撤回後は新たなスカウト対象になりません）。
                  </li>
                </ul>
              </div>
              <p>
                ※ 詳しくは
                <Link href="/terms#scout" target="_blank" className="text-blue-600 underline">
                  利用規約（第5条）
                </Link>
                をご確認ください。
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            submitting || !agreedTerms || (passwordConfirm !== "" && password !== passwordConfirm)
          }
          className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
          ログイン
        </Link>
      </p>
    </AuthLayout>
  );
}
