"use client";

import Link from "next/link";

// プロフィール未入力（users.is_profile_completed = 0）のユーザーが練習問題・模試を
// 開始しようとした際に表示するモーダル。ダッシュボードのボタンクリック時（事前ブロック）と、
// /practice・/testへの直接URLアクセス時（各画面自身のAPI応答403を受けての表示）の
// 両方から使う共通コンポーネント。
export function ProfileRequiredModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <p className="text-base font-bold text-gray-900">プロフィール情報の登録が必要です</p>
        <p className="mt-2 text-sm text-gray-600">
          練習問題・模試を受験するには、プロフィール情報の登録が必要です。
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/mypage"
            className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            プロフィールを入力する
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
