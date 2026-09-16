import { Fragment } from "react";

// 「問題文の太字の語と、同じ用法のものを選びなさい」等の設問で使われる、
// 問題文中の【対象語句】を抽出する（例: "バス【で】通学する。" → ["で"]）。
// 【】が存在しない問題文（非言語や通常の長文読解など）では空配列を返す。
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

// マッチした語句を強調表示する。問題文側は元のテキストにすでに【】が付いているためそのまま
// 太字化し、選択肢側（【】を含まない地の文からのマッチ）には表示上【】を補って囲むことで、
// 問題文と選択肢のどちらを見ても「同じ記法で対象語句が示されている」状態にする。
function renderHighlightedSpan(display: string, key: number) {
  const alreadyBracketed = display.startsWith("【") && display.endsWith("】");
  return (
    <strong key={key} className={HIGHLIGHT_CLASS}>
      {alreadyBracketed ? display : `【${display}】`}
    </strong>
  );
}

// 【対象語句】のすぐ後ろに続く「（正解の漢字）」のような丸括弧注記は、答えそのものが
// 画面に露出してしまう（ネタバレになる）ため、表示前に完全に取り除く。
// 全角（）・半角()の両方に対応し、間に空白が挟まっていても許容する。
const ANSWER_REVEAL_PATTERN = /(【[^】]+】)[ 　]*[（(][^）)]*[）)]/g;

function stripAnswerReveal(text: string): string {
  return text.replace(ANSWER_REVEAL_PATTERN, "$1");
}

// DB側の選択肢テキストに "[[対象語句]]" と明示的にマークアップされている場合の記法。
// 問題文の【】の中身がひらがな、選択肢側は別の漢字・別の活用形（同訓異字や助動詞の
// 活用違いなど）で単純な文字列一致ではハイライトできない問題に対応するための汎用パーサー。
// 「た」のように1文字の対象で同じ選択肢内に無関係な同一文字が複数回現れることがあるため、
// マッチした位置だけを厳密にハイライトし、他の同一文字には一切影響しない。
const INLINE_MARK_PATTERN = /\[\[([^\]]+)\]\]/g;

function renderInlineMarks(text: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_MARK_PATTERN)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    nodes.push(renderHighlightedSpan(match[1], key++));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return <>{nodes}</>;
}

// 助詞など、targetsに渡された語句がtext中に出現する箇所をすべて太字ハイライトする
// （同じ語句が複数回現れる場合はすべて対象。マッチが無ければtextをそのまま返す）。
function renderGlobalMatches(text: string, matchSet: Set<string>) {
  if (matchSet.size === 0) {
    return <>{text}</>;
  }

  const escaped = [...matchSet].map(escapeRegExp);
  const pattern = new RegExp(`(【(?:${escaped.join("|")})】|${escaped.join("|")})`, "g");
  const parts = text.split(pattern).filter((part) => part !== undefined && part !== "");

  if (parts.length <= 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) => {
        const inner = part.startsWith("【") && part.endsWith("】") ? part.slice(1, -1) : part;
        const isMatch = matchSet.has(inner);
        return isMatch ? renderHighlightedSpan(part, i) : <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

// 問題文・選択肢の両方で共通して使うハイライト表示コンポーネント。
// 1. 【対象語句】(正解の漢字) の丸括弧部分はネタバレになるため常に非表示にする。
// 2. テキストに "[[対象語句]]" の明示マークアップがあれば、その位置だけを最優先でハイライトする
//    （【】の中身がひらがな、選択肢側が別の漢字・活用形など、文字列一致が効かない問題向け）。
// 3. マークアップが無ければ、targetsに渡された語句（【】の中身）が出現する箇所をすべて
//    ハイライトする（助詞など、選択肢側も同じ表記で現れる問題向け、従来どおりの挙動）。
// いずれにも該当しない場合は通常のテキストとしてそのまま表示する（安全なフォールバック）。
export function HighlightedText({ text, targets }: { text: string; targets: string[] }) {
  const visibleText = stripAnswerReveal(text);

  // INLINE_MARK_PATTERNはグローバルフラグ付きの使い回しインスタンスのため、
  // .test()/.exec()で直接判定するとlastIndexが呼び出しをまたいで残り、
  // 選択肢ごとに描画するこのコンポーネントでは誤判定の原因になる。
  // ここでは文字列の単純な包含チェックのみに留める（実際の抽出はmatchAllが安全に行う）。
  if (visibleText.includes("[[") && visibleText.includes("]]")) {
    return renderInlineMarks(visibleText);
  }

  const validTargets = new Set(targets.filter((t) => t.length > 0));
  return renderGlobalMatches(visibleText, validTargets);
}
