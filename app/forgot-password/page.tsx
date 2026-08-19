"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("メールアドレスを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data: { error?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合
      }
      if (!res.ok) {
        setError(data.error ?? `送信に失敗しました（status: ${res.status}）`);
        return;
      }
      setInfo(data.message ?? "ワンタイムパスワードを送信しました。");
      setStep("reset");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!otp.trim() || !newPassword || !newPasswordConfirm) {
      setError("すべての項目を入力してください");
      return;
    }
    if (newPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError("パスワードが一致しません");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合
      }
      if (!res.ok) {
        setError(data.error ?? `再設定に失敗しました（status: ${res.status}）`);
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
      <h1 className="text-2xl font-bold text-gray-900">パスワードをお忘れの方</h1>

      {step === "request" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            登録済みのメールアドレスを入力してください。ワンタイムパスワードをお送りします。
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "送信中..." : "ワンタイムパスワードを送信"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {info && <p className="text-sm text-green-700">{info}</p>}
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            ワンタイムパスワード（6桁）
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 tracking-widest"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            新しいパスワード（8文字以上）
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            新しいパスワード（確認用）
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className={`rounded-lg border px-3 py-2 text-gray-900 ${
                newPasswordConfirm && newPassword !== newPasswordConfirm
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
            />
            {newPasswordConfirm && newPassword !== newPasswordConfirm && (
              <p className="text-xs font-medium text-red-600">
                パスワードが一致しません。もう一度正しいパスワードを入力してください。
              </p>
            )}
          </label>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={
              submitting ||
              (newPasswordConfirm !== "" && newPassword !== newPasswordConfirm)
            }
            className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "設定中..." : "パスワードを再設定する"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("request");
              setError(null);
              setInfo(null);
            }}
            className="text-xs text-gray-500 underline"
          >
            メールアドレスを入力し直す
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 underline">
          ログイン画面に戻る
        </Link>
      </p>
    </main>
  );
}
