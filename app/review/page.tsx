"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Question } from "@/src/data/questions";
import { getCategoryMeta } from "@/src/data/categoryMeta";
import { redirectToLogin } from "@/src/lib/authRedirect";
import { HighlightedText, extractBracketTargets } from "@/src/components/HighlightedText";
import { ExplanationStep } from "@/src/components/ExplanationStep";

type ReviewItem = {
  reviewId: number;
  reviewStage: number;
  status: string; // "active" | "mastered"
  nextReviewAt: string; // SQLiteのdatetime形式（"YYYY-MM-DD HH:MM:SS", UTC）
  question: Question;
};

type Tab = "today" | "all";

// SQLiteのdatetime('now')形式（UTC想定、タイムゾーン表記なし）をDateに変換する。
function parseSqliteUtc(value: string): Date {
  return new Date(`${value.replace(" ", "T")}Z`);
}

function isDueToday(item: ReviewItem): boolean {
  return item.status === "active" && parseSqliteUtc(item.nextReviewAt).getTime() <= Date.now();
}

function formatRelativeStatus(item: ReviewItem): string {
  if (item.status === "mastered") return "習得済み";
  const diffMs = parseSqliteUtc(item.nextReviewAt).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "今日";
  return `${diffDays}日後`;
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

// テスト種別 > 科目（単元グループ） > 個々の問題、の階層でグルーピングする。
function groupReviews(items: ReviewItem[]) {
  const byTest = new Map<string, Map<string, ReviewItem[]>>();
  for (const item of items) {
    const meta = getCategoryMeta(item.question.rawCategory);
    const byGroup = byTest.get(meta.testLabel) ?? new Map<string, ReviewItem[]>();
    const list = byGroup.get(meta.groupLabel) ?? [];
    list.push(item);
    byGroup.set(meta.groupLabel, list);
    byTest.set(meta.testLabel, byGroup);
  }
  return byTest;
}

export default function ReviewPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [allReviews, setAllReviews] = useState<ReviewItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("today");

  // 復習セッション（今日分をまとめて出題する一問一答フロー）用の状態。
  const [quizQuestions, setQuizQuestions] = useState<ReviewItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { email?: string };
    if (!user.email) {
      router.replace("/login");
      return;
    }
    setEmail(user.email);
    setAuthChecked(true);
  }, [router]);

  function loadReviews() {
    fetch("/api/review?scope=all")
      .then((res) => res.json())
      .then((data: { reviews?: ReviewItem[]; error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") {
            redirectToLogin(router);
            return;
          }
          setLoadError(data.error);
          return;
        }
        setAllReviews(data.reviews ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }

  useEffect(() => {
    if (!authChecked || !email) return;
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, email]);

  const dueToday = useMemo(() => (allReviews ?? []).filter(isDueToday), [allReviews]);
  const groupedAll = useMemo(() => groupReviews(allReviews ?? []), [allReviews]);
  const groupedDueToday = useMemo(() => groupReviews(dueToday), [dueToday]);

  function startQuiz() {
    setQuizQuestions(dueToday);
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
  }

  const current = quizQuestions?.[currentIndex];
  const isLast = quizQuestions !== null && currentIndex === quizQuestions.length - 1;

  async function handleSelect(label: string) {
    if (answered || !current || submitting) return;
    setSelected(label);
    setAnswered(true);
    const isCorrectAnswer = label === current.question.answer;
    if (isCorrectAnswer) setCorrectCount((c) => c + 1);

    setSubmitting(true);
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reviewId: current.reviewId,
          result: isCorrectAnswer ? "correct" : "incorrect",
        }),
      });
    } catch {
      // 送信に失敗しても復習セッション自体は継続する（次回アクセス時にまた出題対象になる）
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
      loadReviews(); // ステータス・次回復習日が変わったため一覧を再取得する
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  function backToOverview() {
    setQuizQuestions(null);
    setFinished(false);
  }

  if (!authChecked) {
    return null;
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
        <Link href="/mypage" className="text-sm text-blue-600 underline">
          マイページに戻る
        </Link>
      </main>
    );
  }

  if (allReviews === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">復習ノートを読み込んでいます...</p>
      </main>
    );
  }

  // ---- 復習セッション完了画面 ----
  if (finished && quizQuestions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-gray-900">復習お疲れ様でした！</p>
        <p className="text-sm text-gray-700">
          {quizQuestions.length}問中 {correctCount}問正解しました。
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={backToOverview}
            className="rounded-full border border-blue-300 px-6 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            復習ノートに戻る
          </button>
          <Link
            href="/mypage"
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            マイページに戻る
          </Link>
        </div>
      </main>
    );
  }

  // ---- 復習セッション中（一問一答） ----
  if (quizQuestions && current) {
    const { question } = current;
    const isCorrect = selected === question.answer;
    const meta = getCategoryMeta(question.rawCategory);
    const highlightTargets = extractBracketTargets(question.text);

    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            復習 {currentIndex + 1} / {quizQuestions.length}問
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {meta.testLabel} › {meta.groupLabel} › {question.category}
          </span>
        </div>

        {question.questionCode && (
          <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
            問ID: {question.questionCode}
          </span>
        )}

        {question.title && <p className="text-sm font-semibold text-blue-700">{question.title}</p>}

        <p className="whitespace-pre-wrap text-lg font-medium text-gray-900">
          <HighlightedText text={question.text} targets={highlightTargets} />
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
                <HighlightedText text={choice.text} targets={highlightTargets} />
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
                <li key={i}>
                  <ExplanationStep step={step} />
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-gray-500">
              {isCorrect ? "次回の復習日を延長しました。" : "次回は1日後に再度復習に出題されます。"}
            </p>
            <button
              onClick={handleNext}
              className="mt-4 w-full rounded-full bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
            >
              {isLast ? "復習を終える" : "次の問題へ"}
            </button>
          </div>
        )}
      </main>
    );
  }

  // ---- 復習ノート トップ（タブ切り替え + 一覧） ----
  const groups = tab === "today" ? groupedDueToday : groupedAll;
  const testLabels = Array.from(groups.keys());

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900">復習ノート</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("today")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === "today" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          今日復習すべき問題（{dueToday.length}）
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            tab === "all" ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          すべて（{(allReviews ?? []).length}）
        </button>
      </div>

      {tab === "today" && dueToday.length > 0 && (
        <button
          type="button"
          onClick={startQuiz}
          className="rounded-full bg-blue-600 py-3 text-center text-sm font-bold text-white hover:bg-blue-700"
        >
          今日の復習を始める（{dueToday.length}問）
        </button>
      )}

      {testLabels.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-gray-900">
            {tab === "today" ? "今日復習すべき問題はありません" : "復習ノートに登録された問題はまだありません"}
          </p>
          <p className="text-xs text-gray-500">
            言語・英語（語彙・語句の意味等）の練習問題や模試で間違えると、忘却曲線に基づいて自動的にここへ追加されます。
            非言語などの問題は各単元の練習画面から復習できます。
          </p>
          <Link href="/mypage" className="text-sm text-blue-600 underline">
            マイページに戻る
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {testLabels.map((testLabel) => {
            const byGroup = groups.get(testLabel)!;
            return (
              <section key={testLabel} className="flex flex-col gap-3">
                <h2 className="text-sm font-bold text-gray-900">{testLabel}</h2>
                {Array.from(byGroup.entries()).map(([groupLabel, items]) => (
                  <div key={groupLabel} className="rounded-xl border border-gray-200 bg-white">
                    <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
                      {groupLabel}（{items.length}問）
                    </p>
                    <ul className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <li
                          key={item.reviewId}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                        >
                          <span className="flex items-center gap-2 text-gray-700">
                            {item.question.questionCode && (
                              <span className="font-mono text-xs text-gray-400">{item.question.questionCode}</span>
                            )}
                            {item.question.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.status === "mastered"
                                ? "bg-gray-100 text-gray-500"
                                : isDueToday(item)
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {formatRelativeStatus(item)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      <Link href="/mypage" className="mt-2 text-center text-sm text-gray-500 hover:text-gray-700">
        マイページに戻る
      </Link>
    </main>
  );
}
