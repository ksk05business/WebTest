import type { ReactNode } from "react";

// ブログ記事（MDX）内で「就活生の悩み」⇄「Webテストナビ公式の回答」という対話形式の
// 吹き出しを表現するコンポーネント。<ChatBubble speaker="student">...</ChatBubble> のように使う。
const SPEAKER_CONFIG = {
  student: {
    name: "就活生",
    emoji: "😥",
    avatarBg: "bg-gray-200",
    bubble: "bg-gray-100 text-gray-800 rounded-bl-sm",
    row: "flex-row",
    items: "items-start",
  },
  official: {
    name: "Webテストナビ公式",
    emoji: "😊",
    avatarBg: "bg-blue-100",
    bubble: "bg-blue-600 text-white rounded-br-sm",
    row: "flex-row-reverse",
    items: "items-end",
  },
} as const;

export function ChatBubble({
  speaker,
  children,
}: {
  speaker: "student" | "official";
  children: ReactNode;
}) {
  const cfg = SPEAKER_CONFIG[speaker];
  return (
    <div className={`not-prose my-1.5 flex items-end gap-1 ${cfg.row}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-base ${cfg.avatarBg}`}
        aria-hidden
      >
        {cfg.emoji}
      </div>
      <div className={`flex flex-col gap-0.5 ${cfg.items}`}>
        <span className="text-[11px] font-semibold text-gray-400">{cfg.name}</span>
        <div className={`w-fit max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-snug ${cfg.bubble}`}>{children}</div>
      </div>
    </div>
  );
}
