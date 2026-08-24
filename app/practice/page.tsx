"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Question } from "@/src/data/questions";
import { PracticeUnitSelector } from "@/src/components/PracticeUnitSelector";
import { DEFAULT_TEST_ID } from "@/src/data/practiceUnits";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getUserEmail(): string | null {
  const raw = localStorage.getItem("spiUser");
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { email?: string }).email ?? null;
  } catch {
    return null;
  }
}

function BackToUnitsLink({ testId }: { testId: string }) {
  return (
    <Link
      href={`/practice?testType=${testId}`}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-700"
    >
      <ArrowLeft className="h-4 w-4" />
      単元一覧に戻る
    </Link>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticePageInner />
    </Suspense>
  );
}

function PracticePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const testId = searchParams.get("testType") ?? DEFAULT_TEST_ID;
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [finished, setFinished] = useState(false);
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

  function loadQuestions() {
    const params = new URLSearchParams({ limit: "20" });
    if (category) {
      params.set("category", category);
      if (subCategory) params.set("subCategory", subCategory);
    }
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
  }

  useEffect(() => {
    if (!authChecked || !category) return;
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, category, subCategory]);

  function handleRestart() {
    setQuestions(null);
    setLoadError(null);
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setElapsed(0);
    setScore(0);
    setFinished(false);
    setResults([]);
    loadQuestions();
  }

  // 経過時間のカウントアップ（制限時間による自動送りは行わない）
  useEffect(() => {
    if (!authChecked || finished) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [authChecked, finished]);

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
      const categoryScores: Record<string, { correct: number; total: number }> = {};
      for (const r of results) {
        const entry = categoryScores[r.category] ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (r.correct) entry.correct += 1;
        categoryScores[r.category] = entry;
      }

      try {
        const email = getUserEmail();
        if (email) {
          const answers = results.map((r) => ({ questionId: r.questionId, correct: r.correct }));
          await fetch("/api/exam-results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              testType: testId,
              score,
              total,
              categoryScores,
              answers,
              isPractice: true,
            }),
          });
          await fetch("/api/practice/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, testType: testId, answers, isPractice: true }),
          });
        }
      } catch {
        // 保存に失敗しても練習の完了画面自体は表示する
      }

      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  if (!authChecked) {
    return null;
  }

  if (!category) {
    return <PracticeUnitSelector testId={testId} />;
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-10">
        <BackToUnitsLink testId={testId} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
        </div>
      </main>
    );
  }

  if (finished && questions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-10">
        <BackToUnitsLink testId={testId} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-gray-900">練習お疲れ様でした！</p>
          <p className="text-sm text-gray-700">
            {questions.length}問中 {score}問正解（経過時間 {formatElapsed(elapsed)}）
          </p>
          <p className="text-xs text-gray-500">
            この練習の結果は偏差値には反映されません。間違えた言語問題は忘却曲線の復習キューに追加されました。
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-full border border-blue-300 px-6 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              もう一度練習する
            </button>
            <Link
              href="/dashboard"
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!question || !questions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-10">
        <BackToUnitsLink testId={testId} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
        </div>
      </main>
    );
  }

  const isCorrect = selected === question.answer;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <BackToUnitsLink testId={testId} />

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            練習モード
          </span>
          {subCategory && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {question.category}
            </span>
          )}
          第{currentIndex + 1}問 / 全{questions.length}問
        </span>
        <span className="font-mono text-lg font-bold text-gray-500">
          経過 {formatElapsed(elapsed)}
        </span>
      </div>

      {question.questionCode && (
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
          問ID: {question.questionCode}
        </span>
      )}

      {question.title && (
        <p className="text-sm font-semibold text-blue-700">{question.title}</p>
      )}

      <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">{question.text}</p>

      {question.imageDataUri && (
        <div className="overflow-x-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageDataUri}
            alt="設問のグラフ"
            className="mx-auto max-w-full rounded-lg border border-gray-200"
          />
        </div>
      )}

      {question.tables && (
        <div className="flex flex-col gap-4">
          {question.tables.map((table, ti) => (
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
          <p className={`mb-2 font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
            {isCorrect ? "正解！" : "不正解"}（正解: {question.answer}）
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
            {isLast ? "練習を終える" : "次の問題へ"}
          </button>
        </div>
      )}
    </main>
  );
}
