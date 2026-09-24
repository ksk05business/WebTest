import type { Question } from "@/src/data/questions";
import { HighlightedText } from "@/src/components/HighlightedText";
import { QuestionImage, QuestionTables } from "./QuestionMedia";

// 設問の「本文部分」（問ID・タイトル・本文・画像・表）の共通レンダリング。
// /test・/practice・/review で見た目が完全に重複していたため1箇所にまとめた。
// 選択肢部分はページごとに挙動（色分け・disabled等）が異なるため、ここには含めない
// （呼び出し側でquestion.choicesを個別にレンダリングする）。
// highlightTargetsは呼び出し側で選択肢のハイライトにも使い回すため、ここでは受け取るだけで
// 内部では計算しない。
export function QuestionHeader({
  question,
  highlightTargets,
}: {
  question: Pick<Question, "questionCode" | "title" | "text" | "imageDataUri" | "tables">;
  highlightTargets: string[];
}) {
  return (
    <>
      {question.questionCode && (
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
          問ID: {question.questionCode}
        </span>
      )}

      {question.title && <p className="text-sm font-semibold text-blue-700">{question.title}</p>}

      <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">
        <HighlightedText text={question.text} targets={highlightTargets} />
      </p>

      <QuestionImage src={question.imageDataUri} />
      <QuestionTables tables={question.tables} />
    </>
  );
}
