"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExamReviewEntry, Question } from "@/src/data/questions";
import { formatJapaneseDate } from "@/src/lib/formatDate";

const TIME_PER_QUESTION = 60; // spi_english / spi_structural（1問ごとの制限時間）

// 基礎能力試験（言語・非言語）は35分間のタイムボックス制、問題数の上限なし。
// 前半17分は言語、後半18分は非言語から連続的に出題する。実際のSPIテストセンター形式に合わせ、
// 1問ごとの制限時間・即時の正誤表示は行わず、正誤・解説は試験終了後に/resultで一覧確認する。
const BASIC_EXAM_TOTAL_SEC = 35 * 60;
const BASIC_EXAM_VERBAL_SEC = 17 * 60;
// 各フェーズで事前に取得しておく問題プールの件数。35分間で通常使い切らない余裕を持たせている
// （不足した場合は末尾に達し次第、プール内で先頭から繰り返す）。
const BASIC_EXAM_POOL_LIMIT = 150;

const EXAM_PARTS = {
  spi_basic: { categories: ["verbal", "non_verbal"], label: "基礎能力試験（言語・非言語）" },
  spi_english: { categories: ["english"], label: "英語" },
  spi_structural: { categories: ["structural"], label: "構造把握" },
} as const;

type ExamPartId = keyof typeof EXAM_PARTS;

function resolvePartId(raw: string | null): ExamPartId {
  if (raw && Object.prototype.hasOwnProperty.call(EXAM_PARTS, raw)) {
    return raw as ExamPartId;
  }
  return "spi_basic";
}

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TestPage() {
  return (
    <Suspense fallback={null}>
      <TestPageInner />
    </Suspense>
  );
}

function TestPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partId = resolvePartId(searchParams.get("part"));
  const part = EXAM_PARTS[partId];

  const [authChecked, setAuthChecked] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; nextResetAt: string } | null>(
    null
  );
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // テスト種別（パート）ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  useEffect(() => {
    if (!authChecked) return;
    setEligibility(null);
    setEligibilityError(null);
    fetch(`/api/exam-eligibility?testType=${partId}`)
      .then((res) => res.json())
      .then((data: { eligible?: boolean; nextResetAt?: string; error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") {
            router.replace("/login");
            return;
          }
          setEligibilityError(data.error);
          return;
        }
        setEligibility({ eligible: Boolean(data.eligible), nextResetAt: data.nextResetAt ?? "" });
      })
      .catch(() => setEligibilityError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [authChecked, router, partId]);

  if (!authChecked) {
    return null;
  }

  if (eligibilityError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm font-medium text-red-600">{eligibilityError}</p>
      </main>
    );
  }

  if (!eligibility) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">受験可否を確認しています...</p>
      </main>
    );
  }

  if (!eligibility.eligible) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-base font-semibold text-gray-900">
          このテストは2ヶ月に1回のみ受験可能です
        </p>
        <p className="text-sm text-gray-600">
          次回一斉リセット: {formatJapaneseDate(eligibility.nextResetAt)}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          ダッシュボードへ戻る
        </button>
      </main>
    );
  }

  if (partId === "spi_basic") {
    return <BasicExamFlow />;
  }
  return <StandardExamFlow partId={partId} categories={part.categories} label={part.label} />;
}

// 基礎能力試験（言語・非言語）: 35分のタイムボックス制。前半17分は言語、後半18分は非言語から
// プール内をランダムな出題順のまま連続して出題する。1問ごとの制限時間・即時の正誤表示は行わず、
// 選択肢をクリックした瞬間に次の問題へ進む。時間切れで自動終了し、全問の解答一覧を/resultへ引き渡す。
function BasicExamFlow() {
  const router = useRouter();
  const [pools, setPools] = useState<{ verbal: Question[]; non_verbal: Question[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(BASIC_EXAM_TOTAL_SEC);
  const [phase, setPhase] = useState<"verbal" | "non_verbal">("verbal");
  const [verbalIndex, setVerbalIndex] = useState(0);
  const [nonVerbalIndex, setNonVerbalIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const resultsRef = useRef<ExamReviewEntry[]>([]);

  useEffect(() => {
    const verbalParams = new URLSearchParams({ category: "verbal", limit: String(BASIC_EXAM_POOL_LIMIT) });
    const nonVerbalParams = new URLSearchParams({
      category: "non_verbal",
      limit: String(BASIC_EXAM_POOL_LIMIT),
    });
    Promise.all([
      fetch(`/api/questions?${verbalParams.toString()}`).then((r) => r.json()),
      fetch(`/api/questions?${nonVerbalParams.toString()}`).then((r) => r.json()),
    ])
      .then(
        ([verbalData, nonVerbalData]: [
          { questions?: Question[]; error?: string },
          { questions?: Question[]; error?: string }
        ]) => {
          if (!verbalData.questions?.length || !nonVerbalData.questions?.length) {
            setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
            return;
          }
          setPools({ verbal: verbalData.questions, non_verbal: nonVerbalData.questions });
          setCurrentQuestion(verbalData.questions[0]);
        }
      )
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, []);

  const finalize = useCallback(async () => {
    setFinishing(true);
    const results = resultsRef.current;
    const score = results.filter((r) => r.correct).length;
    const total = results.length;

    localStorage.setItem("spiResult", JSON.stringify({ score, total, part: "spi_basic" }));
    localStorage.setItem("spiResultReview", JSON.stringify(results));

    const rawHistory = localStorage.getItem("spiResultHistory");
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    history.push({ score, total, date: new Date().toISOString(), part: "spi_basic" });
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
      if (email && total > 0) {
        const answers = results.map((r) => ({ questionId: r.questionId, correct: r.correct }));
        await fetch("/api/exam-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            testType: "spi_basic",
            score,
            total,
            categoryScores,
            answers,
          }),
        });
        await fetch("/api/practice/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, testType: "spi_basic", answers, isPractice: false }),
        });
      }
    } catch {
      // D1保存に失敗してもlocalStorageには結果があるため、結果表示自体は継続する
    }

    router.push("/result");
  }, [router]);

  // 全体35分のカウントダウン。0になった時点で自動終了する。
  useEffect(() => {
    if (!pools || finishing) return;
    if (timeLeft <= 0) {
      void finalize();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [pools, timeLeft, finishing, finalize]);

  function handleSelect(label: string) {
    if (!pools || !currentQuestion || finishing || timeLeft <= 0) return;

    const isCorrectAnswer = label === currentQuestion.answer;
    resultsRef.current.push({
      questionId: currentQuestion.id,
      questionCode: currentQuestion.questionCode,
      title: currentQuestion.title,
      text: currentQuestion.text,
      choices: currentQuestion.choices,
      correctLabel: currentQuestion.answer,
      selectedLabel: label,
      correct: isCorrectAnswer,
      explanation: currentQuestion.explanation,
      category: currentQuestion.category,
    });
    setAnsweredCount((c) => c + 1);

    const elapsed = BASIC_EXAM_TOTAL_SEC - timeLeft;
    const nextPhase: "verbal" | "non_verbal" = elapsed < BASIC_EXAM_VERBAL_SEC ? "verbal" : "non_verbal";
    setPhase(nextPhase);

    if (nextPhase === "verbal") {
      const nextIndex = verbalIndex + 1;
      setVerbalIndex(nextIndex);
      setCurrentQuestion(pools.verbal[nextIndex % pools.verbal.length]);
    } else {
      const nextIndex = nonVerbalIndex + 1;
      setNonVerbalIndex(nextIndex);
      setCurrentQuestion(pools.non_verbal[nextIndex % pools.non_verbal.length]);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
      </main>
    );
  }

  if (finishing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">試験結果を集計しています...</p>
      </main>
    );
  }

  if (!pools || !currentQuestion) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
      </main>
    );
  }

  const phaseLabel = phase === "verbal" ? "言語" : "非言語";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            基礎能力試験（{phaseLabel}）
          </span>
          問題 {answeredCount + 1}
        </span>
        <span
          className={`font-mono text-lg font-bold ${
            timeLeft <= 300 ? "text-red-600" : "text-gray-800"
          }`}
        >
          残り {formatMmSs(timeLeft)}
        </span>
      </div>

      {currentQuestion.questionCode && (
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
          問ID: {currentQuestion.questionCode}
        </span>
      )}

      {currentQuestion.title && (
        <p className="text-sm font-semibold text-blue-700">{currentQuestion.title}</p>
      )}

      <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">{currentQuestion.text}</p>

      {currentQuestion.imageDataUri && (
        <div className="overflow-x-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentQuestion.imageDataUri}
            alt="設問のグラフ"
            className="mx-auto max-w-full rounded-lg border border-gray-200"
          />
        </div>
      )}

      {currentQuestion.tables && (
        <div className="flex flex-col gap-4">
          {currentQuestion.tables.map((table, ti) => (
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
        {currentQuestion.choices.map((choice) => (
          <button
            key={choice.label}
            onClick={() => handleSelect(choice.label)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="mr-2 font-bold">{choice.label}.</span>
            {choice.text}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
      </p>
    </main>
  );
}

// 英語・構造把握: 従来通り1問ごとに60秒の制限時間、固定問題数、回答直後に正誤・解説を表示する形式。
function StandardExamFlow({
  partId,
  categories,
  label,
}: {
  partId: ExamPartId;
  categories: readonly string[];
  label: string;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<
    { questionId: number; category: string; correct: boolean }[]
  >([]);

  const question = questions?.[currentIndex];
  const isLast = questions !== null && currentIndex === questions.length - 1;

  useEffect(() => {
    const params = new URLSearchParams();
    categories.forEach((c) => params.append("category", c));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset timer whenever we move to a new question
  useEffect(() => {
    setTimeLeft(TIME_PER_QUESTION);
  }, [currentIndex]);

  // countdown
  useEffect(() => {
    if (answered || !question) return;
    if (timeLeft <= 0) {
      setAnswered(true);
      setResults((r) => [...r, { questionId: question.id, category: question.category, correct: false }]);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, question]);

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
      localStorage.setItem("spiResult", JSON.stringify({ score, total, part: partId }));
      localStorage.removeItem("spiResultReview");

      const rawHistory = localStorage.getItem("spiResultHistory");
      const history = rawHistory ? JSON.parse(rawHistory) : [];
      history.push({ score, total, date: new Date().toISOString(), part: partId });
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
            body: JSON.stringify({ email, testType: partId, score, total, categoryScores, answers }),
          });
          await fetch("/api/practice/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, testType: partId, answers, isPractice: false }),
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
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {label}
          </span>
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

      {question.questionCode && (
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
          問ID: {question.questionCode}
        </span>
      )}

      {question.title && (
        <p className="text-sm font-semibold text-blue-700">
          {question.title}
        </p>
      )}

      <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">
        {question.text}
      </p>

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
