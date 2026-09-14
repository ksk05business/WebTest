"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/src/components/AuthLayout";
import { IconInput } from "@/src/components/IconInput";
import { TermsAgreementModal } from "@/src/components/TermsAgreementModal";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// functions/api/auth/line-callback.ts が「未登録（またはメールアドレス取得不可）」と
// 判定した場合に遷移してくる画面。/auth/google-signupと同じ枠組みだが、LINEはメール
// アドレスが取得できない場合があるため（チャネル側の許可申請が必要）、その場合は
// メールアドレス入力欄を表示するフォールバックUIを追加している（要件4）。
export default function LineSignupPage() {
  const router = useRouter();
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const agreedAll = agreedToTerms && agreedToPrivacy;
  const needsEmailInput = pendingLoaded && !pendingEmail;

  useEffect(() => {
    fetch("/api/auth/line-pending")
      .then((res) => res.json())
      .then((data: { error?: string; email?: string | null }) => {
        if (data.error) {
          setLoadError("LINEログインの情報が見つかりませんでした。もう一度お試しください。");
          return;
        }
        setPendingEmail(data.email ?? null);
        setPendingLoaded(true);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, []);

  async function handleCreateAccount() {
    setError(null);
    if (needsEmailInput && !EMAIL_PATTERN.test(emailInput.trim())) {
      setError("有効なメールアドレスを入力してください");
      return;
    }
    if (!agreedAll) {
      setError("利用規約・プライバシーポリシーへの同意が必要です");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/line-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreedTerms: agreedAll,
          scoutConsent: agreedToPrivacy,
          ...(needsEmailInput ? { email: emailInput.trim() } : {}),
        }),
      });
      let data: { error?: string; name?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合
      }
      if (!res.ok || !data.name) {
        setError(data.error ?? `登録に失敗しました（status: ${res.status}）`);
        return;
      }
      // セッションCookieはこの時点で発行済み。/auth/callback で /api/me を叩き、
      // 既存のログインと同じ形でspiUserをlocalStorageへ保存してから/dashboardへ渡す。
      router.replace("/auth/callback");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <AuthLayout title="LINEログイン" subtitle="登録手続きを続けられませんでした">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{loadError}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
          ログイン画面に戻る
        </Link>
      </AuthLayout>
    );
  }

  if (!pendingLoaded) {
    return (
      <AuthLayout title="LINEログイン" subtitle="確認しています...">
        <p className="text-center text-sm text-gray-500">読み込み中...</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="会員登録" subtitle="LINEアカウントで新規会員登録を行います">
      <div className="flex flex-col gap-4">
        {pendingEmail ? (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span className="font-semibold">{pendingEmail}</span> でアカウントを作成します。
          </p>
        ) : (
          <>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              LINEアカウントからメールアドレスを取得できませんでした。会員登録に使用するメールアドレスを入力してください。
            </p>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              メールアドレス
              <IconInput
                icon={Mail}
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </>
        )}
        <p className="text-xs text-gray-500">
          大学・志望業界などのプロフィールは登録後に「プロフィール設定」画面からいつでも入力・変更できます。
        </p>

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
              {agreedToTerms && <span className="ml-1 font-semibold text-green-600">✓ 同意済み</span>}
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
        )}

        <p className="flex items-start gap-1 text-xs text-gray-500">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          ご入力いただいた氏名・メールアドレスは暗号化して厳重に保管されます。本人の同意なく企業に公開されることは一切ありません。
        </p>

        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={submitting || !agreedAll || (needsEmailInput && !emailInput.trim())}
          className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "登録中..." : "アカウントを作成する"}
        </button>
      </div>

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
