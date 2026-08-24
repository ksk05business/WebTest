"use client";

import { useState } from "react";
import Link from "next/link";
import { isFreeEmailDomain } from "@/src/lib/freeEmailDomains";

const ACCOUNT_TYPES = [
  { value: "direct_hire", label: "直接採用企業（自社採用のみ）" },
  { value: "agency", label: "就活エージェント / 人材紹介会社（原則ご利用いただけません）" },
] as const;

type FormType = "account_apply" | "document_request";

const FORM_TABS: { value: FormType; label: string }[] = [
  { value: "account_apply", label: "無料アカウント開設（利用審査申請）" },
  { value: "document_request", label: "サービス紹介資料請求" },
];

export default function CompanyApplyPage() {
  const [formType, setFormType] = useState<FormType>("account_apply");

  // 両フォーム共通の項目
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [corporateSiteUrl, setCorporateSiteUrl] = useState("");

  // 利用審査申請（account_apply）のみの項目
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [accountType, setAccountType] = useState<string>("direct_hire");
  const [inquiryMessage, setInquiryMessage] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState<FormType | null>(null);

  function handleTabChange(next: FormType) {
    setFormType(next);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const commonMissing =
      !companyName.trim() ||
      !contactName.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !corporateSiteUrl.trim();
    const applyOnlyMissing = formType === "account_apply" && (!department.trim() || !jobTitle.trim());

    if (commonMissing || applyOnlyMissing) {
      setError("必須項目をすべて入力してください");
      return;
    }

    if (isFreeEmailDomain(email.trim())) {
      setError("会社用のメールアドレス（独自ドメイン）を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: formType,
          companyName,
          contactName,
          email,
          phoneNumber,
          corporateSiteUrl,
          ...(formType === "account_apply" ? { department, jobTitle, accountType, inquiryMessage } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `送信に失敗しました（status: ${res.status}）`);
        return;
      }
      setSubmittedType(formType);
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedType) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        {submittedType === "account_apply" ? (
          <>
            <p className="text-lg font-bold text-gray-900">お申し込みありがとうございます</p>
            <p className="text-sm leading-relaxed text-gray-600">
              運営にて内容を確認のうえ、審査が完了次第、担当者より個別にご連絡いたします。今しばらくお待ちください。
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-bold text-gray-900">資料請求を受け付けました</p>
            <p className="text-sm leading-relaxed text-gray-600">
              ご入力いただいた会社用メールアドレス宛に、サービス紹介資料をお送りいたします。今しばらくお待ちください。
            </p>
          </>
        )}
        <Link href="/" className="mt-2 text-sm text-blue-600 underline">
          トップページに戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">直接採用企業様向け お申し込み</h1>
        <p className="text-sm text-gray-600">
          スコア・志望業界による高精度データベースからターゲット学生に直接スカウトを送れます。いたずら登録防止のため、運営による審査を経てアカウントを発行いたします。まずはサービス紹介資料のみご希望の場合は「サービス紹介資料請求」からお申し込みください。
        </p>
      </div>

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-bold">ご利用いただける事業者について</p>
        <p className="mt-1 leading-relaxed">
          本サービスは、求職者の直接採用（自社採用）を目的とする事業会社様専用です。求職者を他社へ紹介・仲介する人材紹介行為を目的としたご利用、および取得した情報を第三者へ転売する目的でのご利用（就活エージェント・人材紹介会社様等によるご利用）はお断りしております。該当する場合、誠に恐れ入りますが本サービスをご利用いただけません。
        </p>
      </div>

      <div className="flex gap-1 rounded-full bg-gray-100 p-1">
        {FORM_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTabChange(t.value)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              formType === t.value ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          会社名・組織名
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          ご担当者様 氏名
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        {formType === "account_apply" && (
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
              部署
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
              役職
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          会社用メールアドレス
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@your-company.co.jp"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
          <span className="text-xs text-gray-400">
            Gmail・Yahoo!メール等のフリーメールはご利用いただけません
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          電話番号
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="03-1234-5678"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          コーポレートサイトURL
          <input
            type="url"
            value={corporateSiteUrl}
            onChange={(e) => setCorporateSiteUrl(e.target.value)}
            placeholder="https://your-company.co.jp"
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        {formType === "account_apply" && (
          <>
            <div className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              契約・アカウント種別
              <div className="flex flex-col gap-1 rounded-lg border border-gray-300 bg-white p-2">
                {ACCOUNT_TYPES.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 text-sm font-normal text-gray-700">
                    <input
                      type="radio"
                      name="accountType"
                      value={t.value}
                      checked={accountType === t.value}
                      onChange={(e) => setAccountType(e.target.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              {accountType === "agency" && (
                <p className="text-xs font-medium text-red-600">
                  ⚠ 人材紹介・エージェント事業者様からのお申し込みは原則承認されません。直接採用（自社採用）目的でのご利用のみお申し込みください。
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              お問い合わせ・利用目的（任意）
              <textarea
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                rows={4}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </label>
          </>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "送信中..." : formType === "account_apply" ? "審査を申し込む" : "資料請求する"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/company/login" className="text-blue-600 underline">
          企業様ログイン
        </Link>
      </p>
    </main>
  );
}
