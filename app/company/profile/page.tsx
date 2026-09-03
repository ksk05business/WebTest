"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { BackLink } from "@/src/components/BackLink";
import { APPEAL_TAGS, SHORT_MESSAGE_MAX_LENGTH } from "@/src/data/formOptions";
import { redirectToCompanyLogin } from "@/src/lib/authRedirect";

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

type Profile = {
  companyName: string;
  contactName: string;
  email: string;
  shortMessage: string;
  appealTags: string[];
};

export default function CompanyProfilePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [shortMessage, setShortMessage] = useState("");
  const [appealTags, setAppealTags] = useState<string[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/company/profile")
      .then((res) => res.json())
      .then((data: Profile & { error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") {
            redirectToCompanyLogin(router);
            return;
          }
          setLoadError(data.error);
          return;
        }
        setCompanyName(data.companyName);
        setContactName(data.contactName);
        setEmail(data.email);
        setShortMessage(data.shortMessage);
        setAppealTags(data.appealTags);
      })
      .catch(() => setLoadError("プロフィールの取得に失敗しました"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!contactName.trim() || !email.trim() || !shortMessage.trim()) {
      setProfileError("すべての必須項目を入力してください");
      return;
    }
    if (shortMessage.trim().length > SHORT_MESSAGE_MAX_LENGTH) {
      setProfileError(`企業メッセージは${SHORT_MESSAGE_MAX_LENGTH}文字以内で入力してください`);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactName, email, shortMessage, appealTags }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          redirectToCompanyLogin(router);
          return;
        }
        setProfileError(data.error ?? `更新に失敗しました（status: ${res.status}）`);
        return;
      }
      const raw = localStorage.getItem("spiCompanyUser");
      if (raw) {
        const stored = JSON.parse(raw) as Record<string, unknown>;
        localStorage.setItem(
          "spiCompanyUser",
          JSON.stringify({ ...stored, contactName: contactName.trim(), email: email.trim() })
        );
      }
      setProfileSuccess(true);
    } catch {
      setProfileError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || newPassword.length < 8) {
      setPasswordError("現在のパスワードを入力し、新しいパスワードは8文字以上にしてください");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/company/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 && data.error === "ログインが必要です") {
          redirectToCompanyLogin(router);
          return;
        }
        setPasswordError(data.error ?? `変更に失敗しました（status: ${res.status}）`);
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSavingPassword(false);
    }
  }

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <CompanyHeader companyName={companyName} />

      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
        <BackLink href="/company/dashboard" label="ダッシュボードへ戻る" />
        <h1 className="text-lg font-bold text-gray-900">プロフィール設定</h1>

        {loading ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : loadError ? (
          <p className="text-sm font-medium text-red-600">{loadError}</p>
        ) : (
          <>
            <form
              onSubmit={handleProfileSubmit}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5"
            >
              <h2 className="text-sm font-bold text-gray-900">基本情報</h2>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                ご担当者様 氏名
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                会社用メールアドレス
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
              </label>

              <h2 className="mt-2 text-sm font-bold text-gray-900">
                「あなたへのおすすめ企業」掲載設定
              </h2>
              <p className="text-xs text-gray-500">
                学生のマイページに表示されるアピール内容です。
              </p>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                企業メッセージ（必須・{SHORT_MESSAGE_MAX_LENGTH}文字以内）
                <input
                  type="text"
                  value={shortMessage}
                  onChange={(e) => setShortMessage(e.target.value.slice(0, SHORT_MESSAGE_MAX_LENGTH))}
                  maxLength={SHORT_MESSAGE_MAX_LENGTH}
                  placeholder="例: 20代で年収1000万円も可能"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                />
                <span className="self-end text-xs text-gray-400">
                  {shortMessage.length} / {SHORT_MESSAGE_MAX_LENGTH}
                </span>
              </label>

              <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                アピールタグ（複数選択可）
                <div className="grid grid-cols-1 gap-1 rounded-lg border border-gray-300 bg-white p-2 sm:grid-cols-2">
                  {APPEAL_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-sm font-normal text-gray-700">
                      <input
                        type="checkbox"
                        checked={appealTags.includes(tag)}
                        onChange={() => setAppealTags(toggleValue(appealTags, tag))}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              {profileError && <p className="text-sm font-medium text-red-600">{profileError}</p>}
              {profileSuccess && (
                <p className="text-sm font-medium text-green-600">保存しました。</p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-2 rounded-full bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProfile ? "保存中..." : "変更を保存"}
              </button>
            </form>

            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5"
            >
              <h2 className="text-sm font-bold text-gray-900">パスワード変更</h2>

              <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                現在のパスワード
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
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

              {passwordError && <p className="text-sm font-medium text-red-600">{passwordError}</p>}
              {passwordSuccess && (
                <p className="text-sm font-medium text-green-600">パスワードを変更しました。</p>
              )}

              <button
                type="submit"
                disabled={savingPassword}
                className="mt-2 rounded-full bg-gray-800 py-2.5 font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {savingPassword ? "変更中..." : "パスワードを変更"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
