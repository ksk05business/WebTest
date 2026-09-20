import { CircleChordsDiagram } from "./CircleChordsDiagram";

// questions.explanation（ステップごとの文字列配列）の1要素を描画する。
// "[[CIRCLE_CHORDS:3]]" のような特殊マーカーは図解コンポーネントに置き換え、
// それ以外は通常のテキストとして表示する。
const CIRCLE_CHORDS_PATTERN = /^\[\[CIRCLE_CHORDS:([34])\]\]$/;

export function ExplanationStep({ step }: { step: string }) {
  const match = step.match(CIRCLE_CHORDS_PATTERN);
  if (match) {
    return <CircleChordsDiagram lines={Number(match[1]) as 3 | 4} />;
  }
  return <>{step}</>;
}
