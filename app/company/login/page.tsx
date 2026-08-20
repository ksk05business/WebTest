"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data: { error?: string; companyName?: string; approved?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        // API側からJSON以外の応答が返ってきた場合
      }
      if (!res.ok || !data.companyName) {
        setError(data.error ?? `ログインに失敗しました（status: ${res.status}）`);
        return;
      }
      localStorage.setItem(
        "spiCompanyUser",
        JSON.stringify({ companyName: data.companyName, email, approved: Boolean(data.approved) })
      );
      router.push("/company/dashboard");
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">企業様ログイン</h1>
      <p className="text-sm text-gray-500">
        企業アカウントは運営による審査を経て発行されます。アカウントの発行をご希望の方はお問い合わせください。
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </main>
  );
}
