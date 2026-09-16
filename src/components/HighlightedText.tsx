import { Fragment } from "react";

// 「問題文の太字の語と、同じ用法のものを選びなさい」等の設問で使われる、
// 問題文中の【対象語句】を抽出する（例: "バス【で】通学する。" → ["で"]）。
// 【】が存在しない問題文（非言語・通常の長文読解など）では空配列を返す。
const BRACKET_TARGET_PATTERN = /【([^】]+)】/g;

export function extractBracketTargets(text: string): string[] {
  const targets = new Set<string>();
  for (const match of text.matchAll(BRACKET_TARGET_PATTERN)) {
    if (match[1]) targets.add(match[1]);
  }
  return [...targets];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HIGHLIGHT_CLASS =
  "font-bold text-indigo-700 underline decoration-indigo-300 decoration-2 underline-offset-2";

// 問題文・選択肢の両方で共通して使うハイライト表示コンポーネント。
// targetsに一致する箇所を太字ハイライトする:
// - 問題文側: "【対象語句】" の形（括弧ごと）にマッチさせて括弧付きのまま強調する。
// - 選択肢側: 括弧の無い地の文から対象語句の出現箇所をそのまま強調する。
// targetsが空、またはtext内に一致箇所が無い場合は通常のテキストとしてそのまま表示する
// （【】を使わない他の問題形式でもエラーにならないフォールバック）。
export function HighlightedText({ text, targets }: { text: string; targets: string[] }) {
  const validTargets = [...new Set(targets.filter((t) => t.length > 0))];
  if (validTargets.length === 0) {
    return <>{text}</>;
  }

  const escaped = validTargets.map(escapeRegExp);
  const pattern = new RegExp(`(【(?:${escaped.join("|")})】|${escaped.join("|")})`, "g");
  const parts = text.split(pattern).filter((part) => part !== undefined && part !== "");

  if (parts.length <= 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) => {
        const inner = part.startsWith("【") && part.endsWith("】") ? part.slice(1, -1) : part;
        const isMatch = validTargets.includes(inner);
        return isMatch ? (
          <strong key={i} className={HIGHLIGHT_CLASS}>
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        );
      })}
    </>
  );
}
