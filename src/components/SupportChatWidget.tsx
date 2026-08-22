"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = { role: "bot" | "user"; text: string };

const QUICK_QUESTIONS = [
  "費用はかかりますか？",
  "スカウトはいつ届きますか？",
  "退会やスカウト停止はできますか？",
  "対応しているテストは？",
];

const GREETING: ChatMessage = {
  role: "bot",
  text: "こんにちは！Webテストナビ AIアシスタントです。サービスの使い方やWebテスト対策について、気になることを何でも自由にご質問ください。",
};

const FALLBACK_ERROR_TEXT =
  "うまく回答できませんでした。時間をおいて再度お試しいただくか、「お問い合わせ」フォームからご連絡ください。";

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log, sending, open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const historyForRequest = log.slice(-6);
    setLog((l) => [...l, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyForRequest }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) {
        setLog((l) => [...l, { role: "bot", text: data.error ?? FALLBACK_ERROR_TEXT }]);
        return;
      }
      setLog((l) => [...l, { role: "bot", text: data.reply }]);
    } catch {
      setLog((l) => [...l, { role: "bot", text: FALLBACK_ERROR_TEXT }]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-80 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
            <p className="text-sm font-bold">Webテストナビ AIアシスタント</p>
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
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            {sending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 p-3 pb-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-blue-200 px-2.5 py-1 text-left text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-100 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力..."
              disabled={sending}
              className="flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="送信"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
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
