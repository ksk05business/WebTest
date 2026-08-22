"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

type ChatMessage = { role: "bot" | "user"; text: string };

const FAQ_ITEMS: { question: string; answer: string }[] = [
  { question: "費用はかかりますか？", answer: "学生は完全無料です。全機能を無料でご利用いただけます。" },
  {
    question: "スカウトはいつ届きますか？",
    answer: "模試を受験すると、成績や志望条件に合った企業からスカウトが届く場合があります。",
  },
  {
    question: "退会やスカウト停止はできますか？",
    answer: "マイページからいつでも変更・撤回可能です。",
  },
  {
    question: "対応しているテストは？",
    answer: "SPI3、玉手箱、TG-WEB、GAB/C-GAB、CAB、SCOAなど主要なWebテストに対応しています。",
  },
];

const GREETING: ChatMessage = {
  role: "bot",
  text: "こんにちは！AI就活ナビ助手です。下のよくある質問からお選びください。",
};

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<ChatMessage[]>([GREETING]);

  function handleAsk(item: { question: string; answer: string }) {
    setLog((l) => [...l, { role: "user", text: item.question }, { role: "bot", text: item.answer }]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-80 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
            <p className="text-sm font-bold">AI就活ナビ助手</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {log.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 border-t border-gray-100 p-3">
            {FAQ_ITEMS.map((item) => (
              <button
                key={item.question}
                type="button"
                onClick={() => handleAsk(item)}
                className="rounded-full border border-blue-200 px-3 py-1.5 text-left text-xs font-medium text-blue-700 hover:bg-blue-50"
              >
                {item.question}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="AIサポートチャットを開く"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-2xl text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
