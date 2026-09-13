import type { ExamReviewEntry } from "@/src/data/questions";
import { getTargetTimeSeconds } from "@/src/data/targetTimes";

// 試験終了直後の結果画面（/result）と、過去の受験結果の詳細画面（/result/history）の
// 両方で使う「解答一覧」の共通レンダリング。問題文・選択肢（正誤色分け）・解説・解答時間を表示する。
export function ExamReviewList({ review }: { review: ExamReviewEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {review.map((entry, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 ${
            entry.correct ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-0.5 font-bold ${
                entry.correct ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {entry.correct ? "正解" : "不正解"}
            </span>
            <span className="text-gray-500">問{i + 1}</span>
            {entry.questionCode && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-gray-400">
                {entry.questionCode}
              </span>
            )}
          </div>

          {entry.title && <p className="mb-1 text-sm font-semibold text-blue-700">{entry.title}</p>}
          <p className="whitespace-pre-wrap text-sm font-medium text-gray-900">{entry.text}</p>

          {entry.imageDataUri && (
            <div className="mt-2 overflow-x-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.imageDataUri}
                alt="設問のグラフ"
                className="mx-auto max-w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          {entry.tables && (
            <div className="mt-2 flex flex-col gap-4">
              {entry.tables.map((table, ti) => (
                <div key={ti} className="overflow-x-auto">
                  {table.title && (
                    <p className="mb-1 text-sm font-semibold text-gray-700">{table.title}</p>
                  )}
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr>
                        {table.headers.map((header, hi) => (
                          <th
                            key={hi}
                            className="border border-gray-300 bg-gray-100 px-3 py-1.5 text-center font-semibold text-gray-800"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className="border border-gray-300 px-3 py-1.5 text-center text-gray-700"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-1.5">
            {entry.choices.map((choice) => {
              const isCorrectChoice = choice.label === entry.correctLabel;
              const isSelectedChoice = choice.label === entry.selectedLabel;
              let style = "border-gray-200 text-gray-600";
              if (isCorrectChoice) style = "border-green-500 bg-green-50 font-semibold text-green-800";
              else if (isSelectedChoice) style = "border-red-500 bg-red-50 text-red-800";
              return (
                <div key={choice.label} className={`rounded-md border px-3 py-1.5 text-sm ${style}`}>
                  <span className="mr-2 font-bold">{choice.label}.</span>
                  {choice.text}
                  {isSelectedChoice && !isCorrectChoice && (
                    <span className="ml-2 text-xs font-semibold">（あなたの解答）</span>
                  )}
                  {isCorrectChoice && <span className="ml-2 text-xs font-semibold">（正解）</span>}
                </div>
              );
            })}
            {entry.selectedLabel === null && (
              <p className="text-xs font-semibold text-gray-500">未回答（時間切れ）</p>
            )}
          </div>

          <div className="mt-3 rounded-md bg-white/70 p-3">
            <p className="mb-1 text-xs font-bold text-gray-500">解説</p>
            <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-gray-700">
              {entry.explanation.map((step, si) => (
                <li key={si}>{step}</li>
              ))}
            </ol>

            {entry.answerTimeSeconds !== null &&
              (() => {
                const targetSeconds = getTargetTimeSeconds(entry.rawCategory, entry.category);
                const overTarget = entry.answerTimeSeconds > targetSeconds;
                return (
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 pt-2 text-xs text-gray-500">
                    <span>目標時間: {targetSeconds}秒</span>
                    <span>
                      あなたの解答時間:{" "}
                      <span className={`font-bold ${overTarget ? "text-red-500" : "text-green-600"}`}>
                        {entry.answerTimeSeconds}秒
                      </span>
                    </span>
                  </p>
                );
              })()}
          </div>
        </div>
      ))}
    </div>
  );
}
