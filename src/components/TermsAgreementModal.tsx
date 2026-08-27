"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TermsContent } from "@/src/components/TermsContent";
import { PrivacyContent } from "@/src/components/PrivacyContent";

// 会員登録画面から起動する規約確認モーダル。利用規約・プライバシーポリシーの全文を
// スクロール可能なコンテナ内に表示し、最後までスクロールするまで「同意する」を押せないようにする。
export function TermsAgreementModal({
  onAgree,
  onClose,
}: {
  onAgree: () => void;
  onClose: () => void;
}) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
      setScrolledToBottom(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">利用規約・プライバシーポリシー</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div onScroll={handleScroll} className="max-h-96 overflow-y-auto px-5 py-4">
          <TermsContent />
          <hr className="my-8 border-gray-200" />
          <PrivacyContent />
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4">
          {!scrolledToBottom && (
            <p className="text-center text-xs text-gray-500">
              最後までスクロールすると「同意する」ボタンが有効になります
            </p>
          )}
          <button
            type="button"
            disabled={!scrolledToBottom}
            onClick={onAgree}
            className="min-h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            上記内容に同意する
          </button>
        </div>
      </div>
    </div>
  );
}
