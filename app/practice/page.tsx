"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { Question } from "@/src/data/questions";
import { PracticeUnitSelector } from "@/src/components/PracticeUnitSelector";
import { CATEGORY_TO_TEST_ID, DEFAULT_TEST_ID } from "@/src/data/practiceUnits";
import { getTargetTimeSeconds } from "@/src/data/targetTimes";
import { redirectToLogin } from "@/src/lib/authRedirect";

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

function BackToUnitsLink({ testId, scope }: { testId: string; scope: string | null }) {
  if (scope === "memorization") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>
    );
  }
  return (
    <Link
      href={`/practice?testType=${testId}`}
      className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-700"
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
  const statusFilter = searchParams.get("statusFilter"); // 'wrong_uncertain' | 'unanswered' | null
  // scope: 'wrong'（このテストの復習ノート、testTypeで絞り込み）
  //      | 'memorization'（ダッシュボードのスキマ暗記復習、全テスト横断）
  const scope = searchParams.get("scope");
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<
    {
      questionId: number;
      category: string;
      rawCategory?: string;
      correct: boolean;
      answerTimeSeconds: number | null;
    }[]
  >([]);
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState<number | null>(null);
  const questionStartedAtRef = useRef<number>(Date.now());

  const question = questions?.[currentIndex];
  const isLast = questions !== null && currentIndex === questions.length - 1;

  // 現在の問題が表示された時点を計測開始とする（解答済みで再表示された場合は計測し直さない）。
  useEffect(() => {
    if (!answered) {
      questionStartedAtRef.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions]);

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  function loadQuestions() {
    const fetchUrl =
      scope === "memorization"
        ? `/api/practice/history?scope=memorization&limit=20${category ? `&category=${encodeURIComponent(category)}` : ""}`
        : scope === "wrong"
          ? `/api/practice/history?testType=${encodeURIComponent(testId)}&limit=20`
          : (() => {
              // statusFilter（未回答のみ/×＋△のみ復習）指定時は該当する全問題を出題するため、上限を大きく取る。
              const params = new URLSearchParams({ limit: statusFilter ? "300" : "20" });
              if (category) {
                params.set("category", category);
                if (subCategory) params.set("subCategory", subCategory);
              }
              if (statusFilter) params.set("statusFilter", statusFilter);
              return `/api/questions?${params.toString()}`;
            })();
    fetch(fetchUrl)
      .then((res) => {
        if (res.status === 401) {
          redirectToLogin(router);
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((data: { questions?: Question[]; error?: string }) => {
        if (!data.questions || data.questions.length === 0) {
          setLoadError(
            scope === "wrong"
              ? "現在復習する問題はありません（全問正解中）。"
              : statusFilter || scope
                ? "対象の問題がありません。すべて解答済みか、該当する問題がまだありません。"
                : "出題できる問題がありません。時間をおいて再度お試しください。"
          );
          return;
        }
        setQuestions(data.questions);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  useEffect(() => {
    if (!authChecked || !(category || scope)) return;
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, category, subCategory, statusFilter, scope]);

  function handleRestart() {
    setQuestions(null);
    setLoadError(null);
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setElapsed(0);
    setTimerRunning(true);
    setScore(0);
    setFinished(false);
    setResults([]);
    setAnswerTimeSeconds(null);
    loadQuestions();
  }

  // 経過時間のカウントアップ（制限時間による自動送りは行わない）。
  // 解答済み（解説エリア表示中）はカウントを停止し、次の問題に進むと自動的に再開する。
  useEffect(() => {
    if (!authChecked || finished || !timerRunning) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [authChecked, finished, timerRunning]);

  function handleTimerReset() {
    setElapsed(0);
    setTimerRunning(true);
  }

  // 練習問題の自己評価ステータス（〇known/△uncertain/×wrong）をupsertする。
  // 失敗しても練習の進行自体は継続する（fire-and-forget）。
  async function postQuestionStatus(questionId: number, status: "known" | "uncertain" | "wrong") {
    try {
      await fetch("/api/question-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, status }),
      });
    } catch {
      // 失敗しても練習の進行自体は継続する
    }
  }

  function handleSelect(label: string) {
    if (answered || !question) return;
    const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    setSelected(label);
    setAnswered(true);
    setTimerRunning(false);
    setAnswerTimeSeconds(timeTaken);
    const isCorrectAnswer = label === question.answer;
    setResults((r) => [
      ...r,
      {
        questionId: question.id,
        category: question.category,
        rawCategory: question.rawCategory,
        correct: isCorrectAnswer,
        answerTimeSeconds: timeTaken,
      },
    ]);
    if (isCorrectAnswer) {
      setScore((s) => s + 1);
    } else {
      // 不正解は自動的に×（wrong）へ分類する
      void postQuestionStatus(question.id, "wrong");
    }
  }

  async function handleAssessment(status: "known" | "uncertain") {
    if (question) {
      await postQuestionStatus(question.id, status);
    }
    handleNext();
  }

  async function handleNext() {
    if (isLast && questions) {
      // rawCategoryから実際のテストIDを解決し、テストごとにグルーピングして送信する
      // （scope=memorization時は複数テストの問題が混在しうるため、テストごとに分けてPOSTし、
      // 各テストの復習ノート・成績データが正しく更新されるようにする）。
      const groups = new Map<
        string,
        { questionId: number; category: string; correct: boolean; answerTimeSeconds: number | null }[]
      >();
      for (const r of results) {
        const groupTestId = (r.rawCategory && CATEGORY_TO_TEST_ID[r.rawCategory]) || testId;
        const list = groups.get(groupTestId) ?? [];
        list.push({
          questionId: r.questionId,
          category: r.category,
          correct: r.correct,
          answerTimeSeconds: r.answerTimeSeconds,
        });
        groups.set(groupTestId, list);
      }

      try {
        const email = getUserEmail();
        if (email) {
          for (const [groupTestId, groupResults] of groups) {
            const groupCategoryScores: Record<string, { correct: number; total: number }> = {};
            for (const r of groupResults) {
              const entry = groupCategoryScores[r.category] ?? { correct: 0, total: 0 };
              entry.total += 1;
              if (r.correct) entry.correct += 1;
              groupCategoryScores[r.category] = entry;
            }
            const groupAnswers = groupResults.map((r) => ({
              questionId: r.questionId,
              correct: r.correct,
            }));
            await fetch("/api/exam-results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                testType: groupTestId,
                score: groupResults.filter((r) => r.correct).length,
                total: groupResults.length,
                categoryScores: groupCategoryScores,
                answers: groupAnswers,
                isPractice: true,
              }),
            });
            const groupAnswersWithTime = groupResults.map((r) => ({
              questionId: r.questionId,
              correct: r.correct,
              answerTimeSeconds: r.answerTimeSeconds,
            }));
            await fetch("/api/practice/history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                testType: groupTestId,
                answers: groupAnswersWithTime,
                isPractice: true,
              }),
            });
          }
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
    setTimerRunning(true);
    setAnswerTimeSeconds(null);
  }

  if (!authChecked) {
    return null;
  }

  if (!category && !scope) {
    return <PracticeUnitSelector testId={testId} />;
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-10">
        <BackToUnitsLink testId={testId} scope={scope} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-red-600">{loadError}</p>
        </div>
      </main>
    );
  }

  if (finished && questions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-10">
        <BackToUnitsLink testId={testId} scope={scope} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-gray-900">練習お疲れ様でした！</p>
          <p className="text-sm text-gray-700">
            {questions.length}問中 {score}問正解（経過時間 {formatElapsed(elapsed)}）
          </p>
          <p className="text-xs text-gray-500">
            この練習の結果は偏差値には反映されません。間違えた言語・英語の問題は忘却曲線の復習キューに追加されました。
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="flex min-h-12 items-center rounded-full border border-blue-300 px-6 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              もう一度練習する
            </button>
            <Link
              href="/dashboard"
              className="flex min-h-12 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
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
        <BackToUnitsLink testId={testId} scope={scope} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
        </div>
      </main>
    );
  }

  const isCorrect = selected === question.answer;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <BackToUnitsLink testId={testId} scope={scope} />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            練習モード
          </span>
          {(subCategory || scope) && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {question.category}
            </span>
          )}
          {statusFilter === "wrong_uncertain" && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              復習モード（×＋△）
            </span>
          )}
          {statusFilter === "unanswered" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              未回答のみ
            </span>
          )}
          {scope === "wrong" && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              🔥 復習ノート
            </span>
          )}
          {scope === "memorization" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              スキマ暗記復習
            </span>
          )}
          <span className="whitespace-nowrap">
            第{currentIndex + 1}問 / 全{questions.length}問
          </span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono text-lg font-bold text-gray-500">経過 {formatElapsed(elapsed)}</span>
          <button
            type="button"
            onClick={handleTimerReset}
            title="タイマーをリセットして再スタート"
            aria-label="タイマーをリセットして再スタート"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
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
              className={`flex min-h-12 items-center rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${style}`}
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

          {answerTimeSeconds !== null &&
            (() => {
              const targetSeconds = getTargetTimeSeconds(question.rawCategory, question.category);
              const overTarget = answerTimeSeconds > targetSeconds;
              return (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500">
                  <span>目標時間: {targetSeconds}秒</span>
                  <span>
                    あなたの解答時間:{" "}
                    <span className={`font-bold ${overTarget ? "text-red-500" : "text-green-600"}`}>
                      {answerTimeSeconds}秒
                    </span>
                  </span>
                </p>
              );
            })()}

          {isCorrect ? (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">今回の正解の感触を選択してください</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button
                  onClick={() => handleAssessment("known")}
                  className="min-h-12 rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 sm:flex-1 sm:text-base"
                >
                  🟢 理解して解けた（〇）
                </button>
                <button
                  onClick={() => handleAssessment("uncertain")}
                  className="min-h-12 rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 sm:flex-1 sm:text-base"
                >
                  🟡 自信がない・勘で正解（△）
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="mt-4 min-h-12 w-full rounded-full bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
            >
              {isLast ? "練習を終える" : "次の問題へ"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
