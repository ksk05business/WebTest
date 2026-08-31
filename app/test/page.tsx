"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExamReviewEntry, Question } from "@/src/data/questions";
import { formatJapaneseDate } from "@/src/lib/formatDate";

const TIME_PER_QUESTION = 60; // spi_english / spi_structural / scoa（1問ごとの制限時間）

// 基礎能力試験（言語・非言語）は35分間のタイムボックス制、問題数の上限なし。
// 前半17分は言語、後半18分は非言語から連続的に出題する。実際のSPIテストセンター形式に合わせ、
// 1問ごとの制限時間・即時の正誤表示は行わず、正誤・解説は試験終了後に/resultで一覧確認する。
const BASIC_EXAM_TOTAL_SEC = 35 * 60;
const BASIC_EXAM_VERBAL_SEC = 17 * 60;
// 各フェーズで事前に取得しておく問題プールの件数。35分間で通常使い切らない余裕を持たせている
// （不足した場合は末尾に達し次第、プール内で先頭から繰り返す）。
const BASIC_EXAM_POOL_LIMIT = 150;

type ExamSubPart = { category: string; subCategory: string; limit: number };

// セクション単位で独立した制限時間を持つ模試（TG-WEB等）の1セクション分の定義。
// 複数の小分類から決まった問数ずつ出題される構成のため、小分類ごとの出題数をsubPartsで指定する。
type ExamSection = { label: string; timeLimitSec: number; subParts: readonly ExamSubPart[] };

type ExamPartConfig = {
  label: string;
  mockOnly: boolean;
  // 単一時間制限で通しの問題リストから出題する場合（SPI英語・構造把握・SCOA等）はこちら。
  categories?: readonly string[];
  // セクション（言語・非言語・英語等）ごとに独立した制限時間を設ける場合（TG-WEB）はこちら。
  // 指定時はcategoriesより優先される。
  sections?: readonly ExamSection[];
};

// TG-WEB従来型模試: 言語12分12問（空欄補充5/並べ替え4/長文読解3）・非言語18分9問（推論4/図形3/暗号2）・
// 英語15分10問（共通、新型と共有のtgweb_english/長文問題プールから出題）。
// 長文読解は従来型・新型で共有のtgweb_verbal_readingカテゴリから出題する
// （src/data/practiceUnits.tsの「共通・言語」グループと同じ設計）。
const TGWEB_TRADITIONAL_SECTIONS: readonly ExamSection[] = [
  {
    label: "言語",
    timeLimitSec: 12 * 60,
    subParts: [
      { category: "tgweb_traditional_verbal", subCategory: "空欄補充", limit: 5 },
      { category: "tgweb_traditional_verbal", subCategory: "並べ替え", limit: 4 },
      { category: "tgweb_verbal_reading", subCategory: "長文読解", limit: 3 },
    ],
  },
  {
    label: "非言語",
    timeLimitSec: 18 * 60,
    subParts: [
      { category: "tgweb_traditional_math", subCategory: "推論", limit: 4 },
      { category: "tgweb_traditional_math", subCategory: "図形問題", limit: 3 },
      { category: "tgweb_traditional_math", subCategory: "暗号", limit: 2 },
    ],
  },
  {
    label: "英語",
    timeLimitSec: 15 * 60,
    subParts: [{ category: "tgweb_english", subCategory: "長文問題", limit: 10 }],
  },
];

// TG-WEB新型模試: 言語7分34問（同義語・対義語8/ことわざ8/慣用句7/四字熟語7/長文読解4）・
// 非言語8分36問（四則演算30/図表の読み取り6）・英語15分10問（共通、従来型と共有）。
const TGWEB_NEW_SECTIONS: readonly ExamSection[] = [
  {
    label: "言語",
    timeLimitSec: 7 * 60,
    subParts: [
      { category: "tgweb_new_verbal", subCategory: "同義語・対義語", limit: 8 },
      { category: "tgweb_new_verbal", subCategory: "ことわざ", limit: 8 },
      { category: "tgweb_new_verbal", subCategory: "慣用句", limit: 7 },
      { category: "tgweb_new_verbal", subCategory: "四字熟語", limit: 7 },
      { category: "tgweb_verbal_reading", subCategory: "長文読解", limit: 4 },
    ],
  },
  {
    label: "非言語",
    timeLimitSec: 8 * 60,
    subParts: [
      { category: "tgweb_new_math", subCategory: "四則演算", limit: 30 },
      { category: "tgweb_new_math", subCategory: "図表の読み取り", limit: 6 },
    ],
  },
  {
    label: "英語",
    timeLimitSec: 15 * 60,
    subParts: [{ category: "tgweb_english", subCategory: "長文問題", limit: 10 }],
  },
];

const EXAM_PARTS = {
  spi_basic: { categories: ["verbal", "non_verbal"], label: "基礎能力試験（言語・非言語）", mockOnly: false },
  spi_english: { categories: ["english"], label: "英語", mockOnly: false },
  spi_structural: { categories: ["structural"], label: "構造把握", mockOnly: false },
  // SCOAは言語・数理・論理・常識・英語の全分野に実データがあるため、単一パートの模試として
  // 全カテゴリを対象に出題する（src/data/testTypes.tsのSCOA hrefから遷移）。
  // mockOnly: true により、練習問題プール（is_mock_only=0）とは別に確保した本番模試専用の
  // 問題プール（is_mock_only=1、各分野からランダム抽出済み）からのみ出題する。
  scoa: {
    categories: ["scoa_language", "scoa_math", "scoa_logic", "scoa_common_sense", "scoa_english"],
    label: "SCOA",
    mockOnly: true,
  },
  // TG-WEBは「従来型」「新型」で出題内容がまったく異なるため、SPIの3パート方式と同様に
  // 独立した受験可否（2ヶ月に1回リセット）を持つ別々のtest_typeとして扱う
  // （src/components/ExamModeSelectModal.tsxのTGWEB_EXAM_PARTS参照）。
  // さらに言語・非言語・英語のセクションごとに独立した制限時間を持つ（SectionedExamFlow）。
  tgweb_traditional: { sections: TGWEB_TRADITIONAL_SECTIONS, label: "TG-WEB従来型", mockOnly: true },
  tgweb_new: { sections: TGWEB_NEW_SECTIONS, label: "TG-WEB新型", mockOnly: true },
} satisfies Record<string, ExamPartConfig>;

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

// 試験終了後にまとめて送信する結果を localStorage・D1（exam-results / practice/history）へ
// 反映してから /result へ遷移する共通処理。BasicExamFlow・StandardExamFlow・SectionedExamFlowの
// いずれも、試験中は一切正誤を表示せず、この関数を1回呼ぶことでのみ採点結果を確定させる。
async function finalizeExam(
  router: ReturnType<typeof useRouter>,
  partId: string,
  results: ExamReviewEntry[]
) {
  const score = results.filter((r) => r.correct).length;
  const total = results.length;

  localStorage.setItem("spiResult", JSON.stringify({ score, total, part: partId }));
  localStorage.setItem("spiResultReview", JSON.stringify(results));

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
    if (email && total > 0) {
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
}

// 出題1問分の共通レンダリング（問題ID・タイトル・本文・画像・表・選択肢）。
// 試験中は即時の正誤表示を一切行わないため、選択肢はどのフローでも常に同じ見た目・挙動になる
// （クリック時にonSelectを呼ぶだけで、正誤に応じた色分けやdisabled化は行わない）。
function QuestionCard({
  question,
  onSelect,
}: {
  question: Question;
  onSelect: (label: string) => void;
}) {
  return (
    <>
      {question.questionCode && (
        <span className="w-fit rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-400">
          問ID: {question.questionCode}
        </span>
      )}

      {question.title && <p className="text-sm font-semibold text-blue-700">{question.title}</p>}

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
        {question.choices.map((choice) => (
          <button
            key={choice.label}
            onClick={() => onSelect(choice.label)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="mr-2 font-bold">{choice.label}.</span>
            {choice.text}
          </button>
        ))}
      </div>
    </>
  );
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
  const part: ExamPartConfig = EXAM_PARTS[partId];

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
  if (part.sections) {
    return <SectionedExamFlow partId={partId} sections={part.sections} mockOnly={part.mockOnly} />;
  }
  return (
    <StandardExamFlow
      partId={partId}
      categories={part.categories ?? []}
      label={part.label}
      mockOnly={part.mockOnly}
    />
  );
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
    await finalizeExam(router, "spi_basic", resultsRef.current);
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

      <QuestionCard question={currentQuestion} onSelect={handleSelect} />

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
      </p>
    </main>
  );
}

// 英語・構造把握・SCOA: 1問ごとに60秒の制限時間があるが、即時の正誤表示は行わない。
// 選択肢をクリックした瞬間（または時間切れ時点）に次の問題へ進み、全問終了後にまとめて採点する。
function StandardExamFlow({
  partId,
  categories,
  label,
  mockOnly,
}: {
  partId: ExamPartId;
  categories: readonly string[];
  label: string;
  mockOnly: boolean;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [finishing, setFinishing] = useState(false);

  const resultsRef = useRef<ExamReviewEntry[]>([]);
  const question = questions?.[currentIndex];

  useEffect(() => {
    const params = new URLSearchParams();
    categories.forEach((c) => params.append("category", c));
    if (mockOnly) params.set("mockOnly", "1");
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

  const finalize = useCallback(async () => {
    setFinishing(true);
    await finalizeExam(router, partId, resultsRef.current);
  }, [router, partId]);

  function pushResult(q: Question, selectedLabel: string | null) {
    resultsRef.current.push({
      questionId: q.id,
      questionCode: q.questionCode,
      title: q.title,
      text: q.text,
      choices: q.choices,
      correctLabel: q.answer,
      selectedLabel,
      correct: selectedLabel === q.answer,
      explanation: q.explanation,
      category: q.category,
    });
  }

  function advance() {
    if (!questions) return;
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      void finalize();
      return;
    }
    setCurrentIndex((i) => i + 1);
  }

  // countdown
  useEffect(() => {
    if (!question || finishing) return;
    if (timeLeft <= 0) {
      pushResult(question, null);
      advance();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, finishing, question]);

  function handleSelect(label: string) {
    if (!question || finishing) return;
    pushResult(question, label);
    advance();
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

  if (!question || !questions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
      </main>
    );
  }

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

      <QuestionCard question={question} onSelect={handleSelect} />

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
      </p>
    </main>
  );
}

// TG-WEB等: 言語・非言語・英語のセクションごとに独立した制限時間を持つ模試。
// セクション内は選択肢をクリックした瞬間に次の問題へ進み（即時の正誤表示なし）、
// セクションの全問に回答し終える、またはそのセクションの制限時間が0になると、
// 残りの未回答分を自動的に「未回答」として記録したうえで次のセクションへ進む。
// 最終セクションが終わった時点でまとめて採点し、/resultへ遷移する。
function SectionedExamFlow({
  partId,
  sections,
  mockOnly,
}: {
  partId: ExamPartId;
  sections: readonly ExamSection[];
  mockOnly: boolean;
}) {
  const router = useRouter();
  const [sectionQuestions, setSectionQuestions] = useState<Question[][] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const resultsRef = useRef<ExamReviewEntry[]>([]);

  useEffect(() => {
    Promise.all(
      sections.map((section) =>
        Promise.all(
          section.subParts.map((sp) => {
            const params = new URLSearchParams({
              category: sp.category,
              subCategory: sp.subCategory,
              limit: String(sp.limit),
            });
            if (mockOnly) params.set("mockOnly", "1");
            return fetch(`/api/questions?${params.toString()}`).then((r) => r.json());
          })
        ).then((results: { questions?: Question[]; error?: string }[]) =>
          results.flatMap((r) => r.questions ?? [])
        )
      )
    )
      .then((perSection: Question[][]) => {
        if (perSection.some((qs) => qs.length === 0)) {
          setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
          return;
        }
        setSectionQuestions(perSection);
        setTimeLeft(sections[0].timeLimitSec);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = useCallback(async () => {
    setFinishing(true);
    await finalizeExam(router, partId, resultsRef.current);
  }, [router, partId]);

  function pushResult(q: Question, selectedLabel: string | null) {
    resultsRef.current.push({
      questionId: q.id,
      questionCode: q.questionCode,
      title: q.title,
      text: q.text,
      choices: q.choices,
      correctLabel: q.answer,
      selectedLabel,
      correct: selectedLabel === q.answer,
      explanation: q.explanation,
      category: q.category,
    });
  }

  // 現在のセクションの残り未回答問題を「未回答」として記録したうえで次のセクションへ進む
  // （最終セクションなら採点・結果表示へ）。全問回答済み・時間切れのどちらでも呼ばれる。
  const advanceSection = useCallback(
    (fillRemainingAsUnanswered: boolean) => {
      if (!sectionQuestions) return;
      if (fillRemainingAsUnanswered) {
        const currentQuestions = sectionQuestions[sectionIndex];
        for (let i = questionIndex; i < currentQuestions.length; i++) {
          pushResult(currentQuestions[i], null);
        }
      }
      const nextSectionIndex = sectionIndex + 1;
      if (nextSectionIndex >= sections.length) {
        void finalize();
        return;
      }
      setSectionIndex(nextSectionIndex);
      setQuestionIndex(0);
      setTimeLeft(sections[nextSectionIndex].timeLimitSec);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionQuestions, sectionIndex, questionIndex, sections, finalize]
  );

  // セクションごとの残り時間カウントダウン。0になったらそのセクションの残り問題を未回答として
  // 記録し、次のセクションへ自動遷移する（最終セクションなら採点へ）。
  useEffect(() => {
    if (!sectionQuestions || finishing) return;
    if (timeLeft <= 0) {
      advanceSection(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [sectionQuestions, timeLeft, finishing, advanceSection]);

  function handleSelect(label: string) {
    if (!sectionQuestions || finishing) return;
    const currentQuestions = sectionQuestions[sectionIndex];
    const q = currentQuestions[questionIndex];
    pushResult(q, label);

    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex >= currentQuestions.length) {
      advanceSection(false);
      return;
    }
    setQuestionIndex(nextQuestionIndex);
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

  if (!sectionQuestions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">問題を読み込んでいます...</p>
      </main>
    );
  }

  const section = sections[sectionIndex];
  const currentQuestions = sectionQuestions[sectionIndex];
  const question = currentQuestions[questionIndex];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {section.label}
          </span>
          第{questionIndex + 1}問 / 全{currentQuestions.length}問
        </span>
        <span
          className={`font-mono text-lg font-bold ${
            timeLeft <= 60 ? "text-red-600" : "text-gray-800"
          }`}
        >
          残り {formatMmSs(timeLeft)}
        </span>
      </div>

      <QuestionCard question={question} onSelect={handleSelect} />

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
        セクションの制限時間が終了すると、残りの問題は未回答として自動的に次のセクションへ進みます。
      </p>
    </main>
  );
}
