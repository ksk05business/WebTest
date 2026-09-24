import type { TableBlock } from "@/src/data/questions";

// 設問の画像（グラフ等）。/test・/practice・/review・結果一覧（ExamReviewList）で
// まったく同じ見た目だったものを1箇所にまとめた共通コンポーネント。
export function QuestionImage({ src }: { src?: string }) {
  if (!src) return null;
  return (
    <div className="overflow-x-auto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="設問のグラフ" className="mx-auto max-w-full rounded-lg border border-gray-200" />
    </div>
  );
}

// 設問の表（複数可）。/test・/practice・/review・結果一覧（ExamReviewList）で
// まったく同じ見た目だったものを1箇所にまとめた共通コンポーネント。
export function QuestionTables({ tables }: { tables?: TableBlock[] }) {
  if (!tables) return null;
  return (
    <div className="flex flex-col gap-4">
      {tables.map((table, ti) => (
        <div key={ti} className="overflow-x-auto">
          {table.title && <p className="mb-1 text-sm font-semibold text-gray-700">{table.title}</p>}
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
                    <td key={ci} className="border border-gray-300 px-3 py-1.5 text-center text-gray-700">
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
  );
}
