"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import { fetchWithRetry } from "@/src/lib/fetchWithRetry";

// Googleログインで新規作成されたアカウント（functions/api/auth/google-signup.ts）は、
// 大学・志望業界等の必須プロフィール項目がプレースホルダー値のまま（users.is_profile_completed = 0）。
// ダッシュボード上部にこのバナーを出し、/mypageでの入力を促す。PUT /api/me（プロフィール保存）が
// 成功するとサーバー側でis_profile_completed = 1に更新されるため、次回表示時には出なくなる。
export function ProfileCompletionBanner({ email }: { email: string }) {
  const router = useRouter();
  const [needsCompletion, setNeedsCompletion] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetchWithRetry("/api/me")
      .then((res) => res.json())
      .then((data: { is_profile_completed?: boolean; error?: string }) => {
        if (data.error === "ログインが必要です") {
          redirectToLogin(router);
          return;
        }
        setNeedsCompletion(data.is_profile_completed === false);
      })
      .catch(() => {
        // 取得に失敗してもダッシュボード自体は表示する
      });
  }, [email, router]);

  if (!needsCompletion) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <div>
        <p className="font-bold text-amber-800">プロフィール情報が未入力です</p>
        <p className="mt-0.5 text-xs text-amber-700">
          大学名・志望業界などを入力すると、企業からのスカウトを受け取れるようになります。
        </p>
      </div>
      <Link
        href="/mypage"
        className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
      >
        プロフィールを入力する
      </Link>
    </div>
  );
}
