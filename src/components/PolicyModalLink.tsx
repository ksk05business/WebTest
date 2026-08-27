"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { PolicyContent } from "@/src/components/PolicyContent";

// フッターの「問題作成ポリシー」リンク。クリックすると/policyへ遷移する代わりに、
// 画面中央にモーダルでPolicyContent（AI独自生成規定・商標権表記）を表示する。
// /policy自体は単独ページとして引き続き存在する（TermsContentからの案内リンク等で利用）。
export function PolicyModalLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">問題作成ポリシー</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4">
                <PolicyContent />
              </div>

              <div className="flex flex-shrink-0 justify-end border-t border-gray-100 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-10 rounded-full border border-gray-300 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
