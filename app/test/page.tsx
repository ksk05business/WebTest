"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/src/data/questions";

const TIME_PER_QUESTION = 60;
// /testは現状SPI3本番模試専用のため、玉手箱等の他テスト向けカテゴリ（tamatebako_*等）を誤って
// 出題しないよう、SPIの4大分類のみに明示的に絞り込む（functions/api/exam-results.tsのBROAD_CATEGORIESと同じ）。
const SPI_CATEGORIES = ["verbal", "non_verbal", "structural", "english"];

export default function TestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [results, setResults] = useState<
    { questionId: number; category: string; correct: boolean }[]
  >([]);

  const question = questions?.[currentIndex];
  const isLast = questions !== null && currentIndex === questions.length - 1;

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const params = new URLSearchParams();
    SPI_CATEGORIES.forEach((c) => params.append("category", c));
    fetch(`/api/questions?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { questions?: Question[]; error?: string }) => {
        if (!data.questions || data.questions.length === 0) {
          setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
          return;
        }
        setQuestions(data.questions);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [authChecked]);

  // reset timer whenever we move to a new question
  useEffect(() => {
    setTimeLeft(TIME_PER_QUESTION);
  }, [currentIndex]);

  // countdown
  useEffect(() => {
    if (!authChecked || answered || !question) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      setResults((r) => [...r, { questionId: question.id, category: question.category, correct: false }]);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, authChecked, question]);

  function handleSelect(label: string) {
    if (answered || !question) return;
    setSelected(label);
    setAnswered(true);
    const isCorrectAnswer = label === question.answer;
    setResults((r) => [
      ...r,
      { questionId: question.id, category: question.category, correct: isCorrectAnswer },
    ]);
    if (isCorrectAnswer) {
      setScore((s) => s + 1);
    }
  }

  async function handleNext() {
    if (isLast && questions) {
      const total = questions.length;
      localStorage.setItem("spiResult", JSON.stringify({ score, total }));

      const rawHistory = localStorage.getItem("spiResultHistory");
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      history.push({ score, total, date: new Date().toISOString() });
      localStorage.setItem("spiResultHistory", JSON.stringify(history.slice(-20)));

      const categoryScores: Record<string, { correct: number; total: number }> = {};
      for (const r of results) {
        const entry = categoryScores[r.category] ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (r.correct) entry.correct += 1;
        categoryScores[r.category] = entry;
      }

      try {
        const rawUser = localStorage.getItem("spiUser");
        const email = rawUser ? (JSON.parse(rawUser) as { email?: string }).email : undefined;
        if (email) {
          const answers = results.map((r) => ({ questionId: r.questionId, correct: r.correct }));
          await fetch("/api/exam-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, testType: "spi", score, total, categoryScores, answers }),
          });
        }
      } catch {
        // D1保存に失敗してもlocalStorageには結果があるため、結果表示自体は継続する
      }

      router.push("/result");
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  if (!authChecked) {
    return null;
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
      </main>
    );
  }

  if (!question || !questions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
      </main>
    );
  }

  const isCorrect = selected === question.answer;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          第{currentIndex + 1}問 / 全{questions.length}問
        </span>
        <span
          className={`font-mono text-lg font-bold ${
            timeLeft <= 10 ? "text-red-600" : "text-gray-800"
          }`}
        >
          残り {timeLeft} 秒
        </span>
      </div>

      {question.title && (
        <p className="text-sm font-semibold text-blue-700">
          {question.title}
        </p>
      )}

      <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">
        {question.text}
      </p>

      {question.tables && (
        <div className="flex flex-col gap-4">
          {question.tables.map((table, ti) => (
            <div key={ti} className="overflow-x-auto">
              {table.title && (
                <p className="mb-1 text-sm font-semibold text-gray-700">
                  {table.title}
                </p>
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

      <div className="flex flex-col gap-3">
        {question.choices.map((choice) => {
          const isChosen = selected === choice.label;
          const isAnswerLabel = choice.label === question.answer;
          let style = "border-gray-300 bg-white hover:bg-gray-50";
          if (answered) {
            if (isAnswerLabel) {
              style = "border-green-600 bg-green-50";
            } else if (isChosen) {
              style = "border-red-600 bg-red-50";
            }
          }
          return (
            <button
              key={choice.label}
              disabled={answered}
              onClick={() => handleSelect(choice.label)}
              className={`rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${style}`}
            >
              <span className="mr-2 font-bold">{choice.label}.</span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p
            className={`mb-2 font-bold ${
              isCorrect ? "text-green-700" : "text-red-700"
            }`}
          >
            {selected === null
              ? "時間切れ"
              : isCorrect
              ? "正解！"
              : "不正解"}
            （正解: {question.answer}）
          </p>
          <p className="mb-1 font-semibold text-gray-800">解説</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
            {question.explanation.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <button
            onClick={handleNext}
            className="mt-4 w-full rounded-full bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
          >
            {isLast ? "結果を見る" : "次の問題へ"}
          </button>
        </div>
      )}
    </main>
  );
}
