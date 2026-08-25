"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isFreeEmailDomain } from "@/src/lib/freeEmailDomains";

type FormType = "account_apply" | "document_request";

const FORM_TABS: { value: FormType; label: string }[] = [
  { value: "account_apply", label: "利用審査申請（アカウント発行）" },
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
          ...(formType === "account_apply"
            ? { department, jobTitle, accountType: "direct_hire", inquiryMessage }
            : {}),
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
      <Link
        href="/#business"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        企業様向けトップへ戻る
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">企業様向け 利用審査申請 / 資料請求</h1>
        <p className="text-sm text-gray-600">
          スコア・志望業界による高精度データベースからターゲット学生に直接スカウトを送れます。
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
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            お問い合わせ・利用目的（任意）
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              rows={4}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>
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
