"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics";
import { Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/src/components/AuthLayout";
import { IconInput } from "@/src/components/IconInput";
import { TermsAgreementModal } from "@/src/components/TermsAgreementModal";
import { GoogleLoginButton } from "@/src/components/GoogleLoginButton";
import { LineLoginButton } from "@/src/components/LineLoginButton";

// 会員登録はメールアドレス・パスワードのみで完結させる（2026-09-13の改修で、氏名・大学・
// 志望業界等の詳細プロフィール入力を登録フローから分離した）。登録直後のアカウントは
// functions/api/register.tsがプレースホルダー値でプロフィールを仮埋めし
// is_profile_completed=0で作成するため、ログイン後はダッシュボードの
// ProfileCompletionBannerから/mypageへ誘導される（Googleログインでの新規作成と同じ導線）。
export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
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

    if (!email.trim() || !password || !passwordConfirm) {
      setError("すべての項目を入力してください");
      return;
    }
    if (!agreedAll) {
      setError("利用規約・プライバシーポリシーへの同意が必要です");
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
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
      trackEvent("sign_up", { method: "email" });
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
            <p className="text-xs font-medium text-red-600">パスワードが一致しません</p>
          )}
        </label>

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
          ご入力いただいたメールアドレスは暗号化して厳重に保管されます。氏名・大学名などのプロフィールは登録後にマイページから入力できます。
        </p>

        <button
          type="submit"
          disabled={
            submitting || !agreedAll || (passwordConfirm !== "" && password !== passwordConfirm)
          }
          className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        または
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginButton label="Googleで登録" />
        <LineLoginButton label="LINEで登録" />
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
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
