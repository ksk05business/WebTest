"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Question } from "@/src/data/questions";
import { redirectToLogin } from "@/src/lib/authRedirect";

type ReviewItem = {
  reviewId: number;
  reviewStage: number;
  question: Question;
};

export default function ReviewPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!authChecked || !email) return;
    fetch(`/api/review?email=${encodeURIComponent(email)}`)
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
        setReviews(data.reviews ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [authChecked, email]);

  const current = reviews?.[currentIndex];
  const isLast = reviews !== null && currentIndex === reviews.length - 1;

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
        <Link href="/mypage" className="text-sm text-blue-600 underline">
          マイページに戻る
        </Link>
      </main>
    );
  }

  if (reviews === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">復習問題を読み込んでいます...</p>
      </main>
    );
  }

  if (reviews.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-gray-900">今日復習すべき問題はありません</p>
        <p className="text-sm text-gray-500">
          模試で言語系の問題を間違えると、忘却曲線に基づいて自動的にここへ追加されます。
        </p>
        <Link
          href="/mypage"
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          マイページに戻る
        </Link>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-gray-900">復習お疲れ様でした！</p>
        <p className="text-sm text-gray-700">
          {reviews.length}問中 {correctCount}問正解しました。
        </p>
        <Link
          href="/mypage"
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          マイページに戻る
        </Link>
      </main>
    );
  }

  if (!current) {
    return null;
  }

  const { question } = current;
  const isCorrect = selected === question.answer;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          復習 {currentIndex + 1} / {reviews.length}問
        </span>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {question.category}
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
          <p className="mt-2 text-xs text-gray-500">
            {isCorrect
              ? "次回の復習日を延長しました。"
              : "次回は明日また復習に出題されます。"}
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
