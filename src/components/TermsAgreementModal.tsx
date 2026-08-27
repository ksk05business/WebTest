"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TermsContent } from "@/src/components/TermsContent";

// 会員登録画面から起動する利用規約の確認モーダル。利用規約の全文をスクロール可能な
// コンテナ内に表示し、最後までスクロールするまで「同意する」を押せないようにする。
// プライバシーポリシーは別途、登録フォーム側で直接チェック可能な項目として分離している。
//
// document.bodyへポータル描画する: 呼び出し元（会員登録フォームのカード）が
// backdrop-blurを持ち、それがposition:fixedの包含ブロックを作ってしまうため、
// ポータルを使わないとモーダルが画面中央ではなくそのカードの位置基準でずれて表示され、
// 画面上部にはみ出す・手動スクロールが必要になるといった不具合が発生していた。
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
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setScrolledToBottom(true);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">利用規約</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div onScroll={handleScroll} className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <TermsContent />
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2 border-t border-gray-100 px-5 py-4">
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
            上記利用規約に同意する
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
