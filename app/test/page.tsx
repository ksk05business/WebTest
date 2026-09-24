"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ExamReviewEntry, Question } from "@/src/data/questions";
import { formatDurationMmSs as formatMmSs, formatJapaneseDate } from "@/src/lib/formatDate";
import { fetchWithRetry } from "@/src/lib/fetchWithRetry";
import { ProfileRequiredModal } from "@/src/components/ProfileRequiredModal";
import { HighlightedText, extractBracketTargets } from "@/src/components/HighlightedText";
import { QuestionHeader } from "@/src/components/exam/QuestionHeader";
import {
  BASIC_EXAM_TOTAL_SEC,
  EXAM_PARTS,
  SPI_NON_VERBAL_SUBPARTS,
  SPI_VERBAL_SUBPARTS,
  fetchSubPartsPool,
  resolvePartId,
  type ExamPartConfig,
  type ExamPartId,
  type ExamSection,
} from "@/src/data/examParts";

// 中断・再開機能（exam_sessionsテーブル）で保存・復元するスナップショットの形。
// BasicExamFlow（単一セクション扱い）・SectionedExamFlow（複数セクション）のどちらも、
// questionsは常に「セクションごとの配列の配列」として統一的に保存する。
type ResumeSession = {
  testType: string;
  sectionIndex: number;
  questionIndex: number;
  timeLeftSeconds: number;
  questions: Question[][];
  answers: ExamReviewEntry[];
};

// ログイン中のユーザーについて、指定test_typeの中断データが存在すればそれを返す（無ければnull）。
// 通信エラー時もnullを返し、呼び出し側は「新規に受験を開始する」フォールバックとして扱えるようにする。
async function fetchResumeSession(testType: string): Promise<ResumeSession | null> {
  try {
    const res = await fetchWithRetry(`/api/exam-session?testType=${encodeURIComponent(testType)}`);
    const data: { session?: ResumeSession | null } = await res.json();
    return data.session ?? null;
  } catch {
    return null;
  }
}

// 模試の受験中、中断ボタン以外でのページ離脱（ブラウザの戻る/進む・スワイプバック・リロード・
// タブを閉じる）を防ぐ。activeがtrueの間だけ監視し、中断・終了などの意図した遷移の直前には
// 呼び出し側でactiveをfalseにしてから画面遷移すること（router.pushはbeforeunload/popstateの
// どちらも発火させないため、これらの意図した遷移自体がブロックされることはない）。
function useBlockUnintendedLeave(active: boolean) {
  useEffect(() => {
    if (!active) return;

    // 戻る/進む・スワイプバック対策: 履歴に1件積んでおき、popstateが発生するたびに
    // 同じ状態を積み直すことで、実質的にページ遷移をキャンセルする
    // （popstate自体をpreventDefaultする手段はブラウザに存在しないため、この方式で代替する）。
    window.history.pushState(null, "", window.location.href);
    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      window.alert("模試の途中です。ページを離れる場合は「中断して戻る」ボタンを使用してください。");
    }
    window.addEventListener("popstate", handlePopState);

    // リロード・タブを閉じる・URL直接入力等の対策。確認ダイアログの文言は
    // 主要ブラウザの仕様によりカスタマイズできず、ブラウザ標準の文言で表示される。
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active]);
}

// 「中断して戻る」ボタン。両フロー（BasicExamFlow / SectionedExamFlow）で共通の見た目にする。
function PauseButton({ onPause, disabled }: { onPause: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onPause}
      disabled={disabled}
      className="w-fit rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50"
    >
      中断して戻る
    </button>
  );
}

// 試験終了後にまとめて送信する結果を localStorage・D1（exam-results / practice/history）へ
// 反映してから /result へ遷移する共通処理。BasicExamFlow・SectionedExamFlowの
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
      const answers = results.map((r) => ({
        questionId: r.questionId,
        correct: r.correct,
        selectedLabel: r.selectedLabel,
        answerTimeSeconds: r.answerTimeSeconds,
      }));
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

  // 完走したので中断データが残っていれば削除する（残したままだと次回開始時に誤って
  // 「前回の続きから再開」の対象として扱われてしまう）。
  fetch(`/api/exam-session?testType=${encodeURIComponent(partId)}`, { method: "DELETE" }).catch(() => {});

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
  const highlightTargets = extractBracketTargets(question.text);
  return (
    <>
      <QuestionHeader question={question} highlightTargets={highlightTargets} />

      <div className="flex flex-col gap-3">
        {question.choices.map((choice) => (
          <button
            key={choice.label}
            onClick={() => onSelect(choice.label)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="mr-2 font-bold">{choice.label}.</span>
            <HighlightedText text={choice.text} targets={highlightTargets} />
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
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    nextResetAt: string;
    profileCompleted: boolean;
  } | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("spiUser")) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // テスト種別（パート）ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  // 一時的な通信エラーはfetchWithRetryが自動で再試行するため、ここでエラー画面になるのは
  // 再試行を使い果たしてもなお失敗した場合のみ。loadEligibilityは「再試行」ボタンからも
  // 呼べるようにし、ページ全体のリロードなしで復帰できるようにする。
  const loadEligibility = useCallback(() => {
    setEligibility(null);
    setEligibilityError(null);
    fetchWithRetry(`/api/exam-eligibility?testType=${partId}`)
      .then((res) => res.json())
      .then((data: { eligible?: boolean; nextResetAt?: string; profileCompleted?: boolean; error?: string }) => {
        if (data.error) {
          if (data.error === "ログインが必要です") {
            router.replace("/login");
            return;
          }
          setEligibilityError(data.error);
          return;
        }
        setEligibility({
          eligible: Boolean(data.eligible),
          nextResetAt: data.nextResetAt ?? "",
          profileCompleted: data.profileCompleted ?? true,
        });
      })
      .catch(() => setEligibilityError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, [router, partId]);

  useEffect(() => {
    if (!authChecked) return;
    loadEligibility();
  }, [authChecked, loadEligibility]);

  if (!authChecked) {
    return null;
  }

  if (eligibilityError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-600">{eligibilityError}</p>
        <button
          type="button"
          onClick={loadEligibility}
          className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          再試行
        </button>
      </main>
    );
  }

  if (!eligibility) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          受験可否を確認しています...
        </p>
      </main>
    );
  }

  if (!eligibility.profileCompleted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10">
        <ProfileRequiredModal onClose={() => router.push("/dashboard")} />
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
  if (!part.sections) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm font-medium text-red-600">設定エラーが発生しました。</p>
      </main>
    );
  }
  return <SectionedExamFlow partId={partId} sections={part.sections} mockOnly={part.mockOnly} />;
}

// 基礎能力試験（言語・非言語）: 言語39問＋非言語30問＝計69問の固定ロースターを、35分の
// タイムボックス内で解く。ロースターは小分類（出題形式）ごとに連続するグループ順のまま
// （fetchSubPartsPoolの仕様通り）、言語39問→非言語30問の順で並ぶ。1問ごとの制限時間・即時の
// 正誤表示は行わず、選択肢をクリックした瞬間に次の問題へ進む。69問すべてに解答し終えた場合は
// 残り時間に関わらずその時点で試験終了、35分経過時点で69問に届いていない場合はそこまでの
// 解答のみを結果に反映する（未到達分は結果一覧に含めない）。
function BasicExamFlow() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(BASIC_EXAM_TOTAL_SEC);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [pausing, setPausing] = useState(false);

  const resultsRef = useRef<ExamReviewEntry[]>([]);
  const questionStartedAtRef = useRef<number>(Date.now());

  // fetchSubPartsPool内のfetchWithRetryが一時的な通信エラーは自動で再試行するため、
  // ここに来るのは再試行を使い果たしてもなお失敗した場合のみ。「再試行」ボタンから
  // ページ全体のリロードなしで再取得できるよう、関数として切り出しておく。
  const loadQuestions = useCallback(() => {
    setLoadError(null);
    fetchResumeSession("spi_basic").then((session) => {
      if (session) {
        // 中断データがあればそのまま復元して再開する（新規取得はしない）。
        resultsRef.current = session.answers;
        setQuestions(session.questions.flat());
        setCurrentIndex(session.questionIndex);
        setTimeLeft(session.timeLeftSeconds);
        return;
      }
      Promise.all([
        fetchSubPartsPool(SPI_VERBAL_SUBPARTS, 1, true),
        fetchSubPartsPool(SPI_NON_VERBAL_SUBPARTS, 1, true),
      ])
        .then(([verbalQuestions, nonVerbalQuestions]) => {
          if (!verbalQuestions.length || !nonVerbalQuestions.length) {
            setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
            return;
          }
          setQuestions([...verbalQuestions, ...nonVerbalQuestions]);
        })
        .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
    });
  }, []);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = questions?.[currentIndex] ?? null;

  // 現在の問題が表示された時点を計測開始とする（解答時間の計測用、試験中はUI非表示）。
  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentQuestion]);

  const finalize = useCallback(async () => {
    setFinishing(true);
    await finalizeExam(router, "spi_basic", resultsRef.current);
  }, [router]);

  // 中断ボタン: 現在の状態（残り時間・現在の問題インデックス・出題済みの問題・解答済み結果）を
  // まるごと保存してからダッシュボードへ戻る。
  async function handlePause() {
    if (!questions) return;
    setPausing(true);
    try {
      await fetch("/api/exam-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "spi_basic",
          sectionIndex: 0,
          questionIndex: currentIndex,
          timeLeftSeconds: timeLeft,
          questions: [questions],
          answers: resultsRef.current,
        }),
      });
    } catch {
      // 保存に失敗しても中断操作自体は継続する（次回開始時は最初からのやり直しになる）
    }
    router.push("/dashboard");
  }

  useBlockUnintendedLeave(Boolean(questions) && !finishing && !pausing);

  // 全体35分のカウントダウン。0になった時点で自動終了する。
  useEffect(() => {
    if (!questions || finishing || pausing) return;
    if (timeLeft <= 0) {
      void finalize();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [questions, timeLeft, finishing, pausing, finalize]);

  function handleSelect(label: string) {
    if (!questions || !currentQuestion || finishing || pausing || timeLeft <= 0) return;

    const isCorrectAnswer = label === currentQuestion.answer;
    const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    resultsRef.current.push({
      questionId: currentQuestion.id,
      questionCode: currentQuestion.questionCode,
      title: currentQuestion.title,
      text: currentQuestion.text,
      tables: currentQuestion.tables,
      imageDataUri: currentQuestion.imageDataUri,
      choices: currentQuestion.choices,
      correctLabel: currentQuestion.answer,
      selectedLabel: label,
      correct: isCorrectAnswer,
      explanation: currentQuestion.explanation,
      category: currentQuestion.category,
      rawCategory: currentQuestion.rawCategory,
      answerTimeSeconds: timeTaken,
    });

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // 70問（固定ロースター全問）に到達したら、残り時間があっても即座に終了する。
      void finalize();
      return;
    }
    setCurrentIndex(nextIndex);
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={loadQuestions}
          className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          再試行
        </button>
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

  if (pausing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">中断内容を保存しています...</p>
      </main>
    );
  }

  if (!questions || !currentQuestion) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          問題を読み込んでいます...
        </p>
      </main>
    );
  }

  const phaseLabel = currentIndex < SPI_VERBAL_SUBPARTS.reduce((s, sp) => s + sp.limit, 0) ? "言語" : "非言語";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            基礎能力試験（{phaseLabel}）
          </span>
          問題 {currentIndex + 1} / {questions.length}
        </span>
        <span
          className={`font-mono text-lg font-bold ${
            timeLeft <= 300 ? "text-red-600" : "text-gray-800"
          }`}
        >
          残り {formatMmSs(timeLeft)}
        </span>
      </div>

      <PauseButton onPause={() => void handlePause()} disabled={pausing} />

      <QuestionCard question={currentQuestion} onSelect={handleSelect} />

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
      </p>
    </main>
  );
}

// TG-WEB・SPI英語・SPI構造把握等: 言語・非言語・英語のセクションごとに独立した制限時間を持つ模試。
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
  const [pausing, setPausing] = useState(false);

  const resultsRef = useRef<ExamReviewEntry[]>([]);
  const questionStartedAtRef = useRef<number>(Date.now());

  // 現在の問題が表示された時点を計測開始とする（セクション単位の残り時間とは別に、問題ごとの
  // 解答時間を計測する。試験中はUIに表示しない）。
  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [sectionIndex, questionIndex]);

  // fetchWithRetryが一時的な通信エラーは自動で再試行するため、ここに来るのは再試行を
  // 使い果たしてもなお失敗した場合のみ。「再試行」ボタンからページ全体のリロードなしで
  // 再取得できるよう、関数として切り出しておく。
  const loadQuestions = useCallback(() => {
    setLoadError(null);
    fetchResumeSession(partId).then((session) => {
      if (session) {
        // 中断データがあればそのまま復元して再開する（新規取得はしない）。
        resultsRef.current = session.answers;
        setSectionQuestions(session.questions);
        setSectionIndex(session.sectionIndex);
        setQuestionIndex(session.questionIndex);
        setTimeLeft(session.timeLeftSeconds);
        return;
      }
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
              return fetchWithRetry(`/api/questions?${params.toString()}`).then((r) => r.json());
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId, mockOnly]);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = useCallback(async () => {
    setFinishing(true);
    await finalizeExam(router, partId, resultsRef.current);
  }, [router, partId]);

  // 中断ボタン: 現在の状態（セクション・問題インデックス・残り時間・出題済みの問題・
  // 解答済み結果）をまるごと保存してからダッシュボードへ戻る。
  async function handlePause() {
    if (!sectionQuestions) return;
    setPausing(true);
    try {
      await fetch("/api/exam-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: partId,
          sectionIndex,
          questionIndex,
          timeLeftSeconds: timeLeft,
          questions: sectionQuestions,
          answers: resultsRef.current,
        }),
      });
    } catch {
      // 保存に失敗しても中断操作自体は継続する（次回開始時は最初からのやり直しになる）
    }
    router.push("/dashboard");
  }

  useBlockUnintendedLeave(Boolean(sectionQuestions) && !finishing && !pausing);

  function pushResult(q: Question, selectedLabel: string | null, answerTimeSeconds: number | null) {
    resultsRef.current.push({
      questionId: q.id,
      questionCode: q.questionCode,
      title: q.title,
      text: q.text,
      tables: q.tables,
      imageDataUri: q.imageDataUri,
      choices: q.choices,
      correctLabel: q.answer,
      selectedLabel,
      correct: selectedLabel === q.answer,
      explanation: q.explanation,
      category: q.category,
      rawCategory: q.rawCategory,
      answerTimeSeconds,
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
          pushResult(currentQuestions[i], null, null);
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
    if (!sectionQuestions || finishing || pausing) return;
    if (timeLeft <= 0) {
      advanceSection(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [sectionQuestions, timeLeft, finishing, pausing, advanceSection]);

  function handleSelect(label: string) {
    if (!sectionQuestions || finishing || pausing) return;
    const currentQuestions = sectionQuestions[sectionIndex];
    const q = currentQuestions[questionIndex];
    const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
    pushResult(q, label, timeTaken);

    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex >= currentQuestions.length) {
      advanceSection(false);
      return;
    }
    setQuestionIndex(nextQuestionIndex);
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <p className="text-sm font-medium text-red-600">{loadError}</p>
        <button
          type="button"
          onClick={loadQuestions}
          className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          再試行
        </button>
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

  if (pausing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="text-sm text-gray-500">中断内容を保存しています...</p>
      </main>
    );
  }

  if (!sectionQuestions) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 py-10">
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          問題を読み込んでいます...
        </p>
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

      <PauseButton onPause={() => void handlePause()} disabled={pausing} />

      <QuestionCard question={question} onSelect={handleSelect} />

      <p className="text-center text-xs text-gray-400">
        回答するとすぐに次の問題に進みます。正誤・解説は試験終了後にまとめて確認できます。
        セクションの制限時間が終了すると、残りの問題は未回答として自動的に次のセクションへ進みます。
      </p>
    </main>
  );
}
