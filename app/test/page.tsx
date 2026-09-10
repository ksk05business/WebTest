"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExamReviewEntry, Question } from "@/src/data/questions";
import { formatJapaneseDate } from "@/src/lib/formatDate";

const TIME_PER_QUESTION = 60; // spi_english / spi_structural（1問ごとの制限時間）

// 基礎能力試験（言語・非言語）は35分間のタイムボックス制、問題数の上限なし
// （標準的な出題数の目安は言語約30〜35問・非言語約20問だが、実際の問題数は回答速度で変動する）。
// 前半15分は言語、後半20分は非言語から連続的に出題する。実際のSPIテストセンター形式に合わせ、
// 1問ごとの制限時間・即時の正誤表示は行わず、正誤・解説は試験終了後に/resultで一覧確認する。
const BASIC_EXAM_TOTAL_SEC = 35 * 60;
const BASIC_EXAM_VERBAL_SEC = 15 * 60;
// 事前に取得しておく問題プールは、SPI_VERBAL_SUBPARTS/SPI_NON_VERBAL_SUBPARTSの単元別配分比率を
// 保ったまま、この倍率でスケールアップして深さを持たせる（不足した場合は末尾に達し次第、
// プール内で先頭から繰り返す）。fetchSubPartsPoolが小分類ごとにグループ化して連結する方式に
// なったため（同じ形式の問題が連続して出題される）、倍率を大きくしすぎると1つの小分類だけで
// 時間を使い切ってしまい、後半の小分類（長文読解等）に時間内でたどり着けなくなる。そのため
// 「快足の受験者が涸れないための最小限のバッファ」程度の低めの倍率に留めている。
const BASIC_EXAM_POOL_MULTIPLIER = 2;

type ExamSubPart = { category: string; subCategory: string; limit: number };

// セクション単位で独立した制限時間を持つ模試（TG-WEB等）の1セクション分の定義。
// 複数の小分類から決まった問数ずつ出題される構成のため、小分類ごとの出題数をsubPartsで指定する。
type ExamSection = { label: string; timeLimitSec: number; subParts: readonly ExamSubPart[] };

type ExamPartConfig = {
  label: string;
  mockOnly: boolean;
  // 単一時間制限で通しの問題リストから出題する場合（SPI英語・構造把握等）はこちら。
  // 小分類ごとの出題数配分を指定する（src/data/examStockTargets.tsのperCycleと一致させること）。
  subParts?: readonly ExamSubPart[];
  // セクション（言語・非言語・英語等）ごとに独立した制限時間を設ける場合（TG-WEB）はこちら。
  // 指定時はsubPartsより優先される。
  sections?: readonly ExamSection[];
};

// SPI3: 2026-09-02改修。言語40問＋非言語30問＋英語30問＋構造把握20問＝計120問/回
// （src/data/examStockTargets.tsのSPIエントリと完全に一致させること）。同日中に他テスト
// （GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行し、EXAM_PARTSのmockOnlyを
// trueにしたため、以下のsubPartsはis_mock_only=1（模試専用に振り替え済みの問題）のみを
// 対象に出題する。
const SPI_VERBAL_SUBPARTS: readonly ExamSubPart[] = [
  { category: "verbal", subCategory: "語彙", limit: 12 },
  { category: "verbal", subCategory: "二語の関係", limit: 6 },
  { category: "verbal", subCategory: "熟語の成り立ち", limit: 5 },
  { category: "verbal", subCategory: "語句の用法", limit: 5 },
  { category: "verbal", subCategory: "文の並べ替え", limit: 5 },
  { category: "verbal", subCategory: "長文読解", limit: 7 },
];
const SPI_NON_VERBAL_SUBPARTS: readonly ExamSubPart[] = [
  { category: "non_verbal", subCategory: "推論", limit: 9 },
  { category: "non_verbal", subCategory: "損益算", limit: 3 },
  { category: "non_verbal", subCategory: "場合の数・確率", limit: 4 },
  { category: "non_verbal", subCategory: "資料の読み取り", limit: 3 },
  { category: "non_verbal", subCategory: "集合", limit: 2 },
  { category: "non_verbal", subCategory: "仕事算", limit: 2 },
  { category: "non_verbal", subCategory: "速さ・時間・距離", limit: 2 },
  { category: "non_verbal", subCategory: "割合・比", limit: 2 },
  { category: "non_verbal", subCategory: "濃度算", limit: 2 },
  { category: "non_verbal", subCategory: "分割払い", limit: 1 },
];
const SPI_ENGLISH_SUBPARTS: readonly ExamSubPart[] = [
  { category: "english", subCategory: "語意（同意語・反意語）", limit: 9 },
  { category: "english", subCategory: "空欄補充", limit: 9 },
  { category: "english", subCategory: "英英辞典", limit: 5 },
  { category: "english", subCategory: "長文読解（英語）", limit: 7 },
];
const SPI_STRUCTURAL_SUBPARTS: readonly ExamSubPart[] = [
  { category: "structural", subCategory: "文章の構造化", limit: 10 },
  { category: "structural", subCategory: "分類・グループ化", limit: 10 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// subPartsで指定した小分類ごとにlimit×multiplier件ずつ並行取得する。同じ小分類（出題形式）の
// 問題が連続して出題されるよう、取得結果はsubPartsの宣言順のまま連結し、配列全体を横断する
// シャッフルは行わない（各小分類内の順序のみをシャッフルしてから平坦化＝連結する）。
// 例: SPI言語で「語句の用法」が5問選出された場合、他の形式が間に挟まらず5問連続で出題されてから
// 次の形式へ移行する。
async function fetchSubPartsPool(
  subParts: readonly ExamSubPart[],
  multiplier: number,
  mockOnly: boolean
): Promise<Question[]> {
  const results = await Promise.all(
    subParts.map((sp) => {
      const params = new URLSearchParams({
        category: sp.category,
        subCategory: sp.subCategory,
        limit: String(sp.limit * multiplier),
      });
      if (mockOnly) params.set("mockOnly", "1");
      return fetch(`/api/questions?${params.toString()}`).then((r) => r.json());
    })
  );
  return (results as { questions?: Question[] }[]).flatMap((r) => shuffleArray(r.questions ?? []));
}

// 玉手箱・TG-WEB・GAB/C-GABは2026-09-01以降、形式・セクションごとに独立して受験できる方式に変更した
// （旧: 1つのtest_typeで複数セクションを通しで受験する方式）。それぞれのセクションが単独で
// 独立した受験可否（2ヶ月に1回リセット）とタイマーを持つ、1セクションのみのSectionedExamFlowとして
// 扱う（src/data/testTypes.tsのMULTI_PART_EXAM_PARTSで各テスト種別の部品一覧を定義）。

// TG-WEB従来型・言語: 空欄補充5・並べ替え4・長文読解3（tgweb_verbal_readingは新型と共有）。
const TGWEB_TRADITIONAL_VERBAL_SECTION: ExamSection = {
  label: "従来型・言語",
  timeLimitSec: 12 * 60,
  subParts: [
    { category: "tgweb_traditional_verbal", subCategory: "空欄補充", limit: 5 },
    { category: "tgweb_traditional_verbal", subCategory: "並べ替え", limit: 4 },
    { category: "tgweb_verbal_reading", subCategory: "長文読解", limit: 3 },
  ],
};
// TG-WEB従来型・非言語: 推論4・図形問題3・暗号2。
const TGWEB_TRADITIONAL_NONVERBAL_SECTION: ExamSection = {
  label: "従来型・非言語",
  timeLimitSec: 18 * 60,
  subParts: [
    { category: "tgweb_traditional_math", subCategory: "推論", limit: 4 },
    { category: "tgweb_traditional_math", subCategory: "図形問題", limit: 3 },
    { category: "tgweb_traditional_math", subCategory: "暗号", limit: 2 },
  ],
};
// TG-WEB新型・言語: 同義語・対義語8・ことわざ8・慣用句7・四字熟語7・長文読解4。
const TGWEB_NEW_VERBAL_SECTION: ExamSection = {
  label: "新型・言語",
  timeLimitSec: 7 * 60,
  subParts: [
    { category: "tgweb_new_verbal", subCategory: "同義語・対義語", limit: 8 },
    { category: "tgweb_new_verbal", subCategory: "ことわざ", limit: 8 },
    { category: "tgweb_new_verbal", subCategory: "慣用句", limit: 7 },
    { category: "tgweb_new_verbal", subCategory: "四字熟語", limit: 7 },
    { category: "tgweb_verbal_reading", subCategory: "長文読解", limit: 4 },
  ],
};
// TG-WEB新型・非言語: 四則演算30・図表の読み取り6。
const TGWEB_NEW_NONVERBAL_SECTION: ExamSection = {
  label: "新型・非言語",
  timeLimitSec: 8 * 60,
  subParts: [
    { category: "tgweb_new_math", subCategory: "四則演算", limit: 30 },
    { category: "tgweb_new_math", subCategory: "図表の読み取り", limit: 6 },
  ],
};
// TG-WEB英語: 従来型・新型で共有する長文問題プールから出題（単独で受験可能な1セクション）。
const TGWEB_ENGLISH_SECTION: ExamSection = {
  label: "英語（従来型・新型共通）",
  timeLimitSec: 15 * 60,
  subParts: [{ category: "tgweb_english", subCategory: "長文問題", limit: 10 }],
};

// 玉手箱・計数: 四則計算50/9分・図表読取29/15分・表推測20/20分（各単独で受験可能な1セクション）。
const TAMATEBAKO_MATH_ARITHMETIC_SECTION: ExamSection = {
  label: "計数・四則計算",
  timeLimitSec: 9 * 60,
  subParts: [{ category: "tamatebako_math", subCategory: "四則逆算", limit: 50 }],
};
const TAMATEBAKO_MATH_GRAPH_SECTION: ExamSection = {
  label: "計数・図表読取",
  timeLimitSec: 15 * 60,
  subParts: [{ category: "tamatebako_math", subCategory: "図表の読み取り", limit: 29 }],
};
const TAMATEBAKO_MATH_TABLE_SECTION: ExamSection = {
  label: "計数・表推測",
  timeLimitSec: 20 * 60,
  subParts: [{ category: "tamatebako_math", subCategory: "表の空欄推測", limit: 20 }],
};
// 玉手箱・言語: 論理的読解（GAB形式）32/15分・趣旨判定（IMAGES形式）32/10分・趣旨把握10/12分。
const TAMATEBAKO_VERBAL_GAB_SECTION: ExamSection = {
  label: "言語・論理的読解（GAB形式）",
  timeLimitSec: 15 * 60,
  subParts: [{ category: "tamatebako_verbal", subCategory: "論理的読解（GAB形式）", limit: 32 }],
};
const TAMATEBAKO_VERBAL_IMAGES_SECTION: ExamSection = {
  label: "言語・趣旨判定（IMAGES形式）",
  timeLimitSec: 10 * 60,
  subParts: [{ category: "tamatebako_verbal", subCategory: "趣旨判定（IMAGES形式）", limit: 32 }],
};
const TAMATEBAKO_VERBAL_SUMMARY_SECTION: ExamSection = {
  label: "言語・趣旨把握",
  timeLimitSec: 12 * 60,
  subParts: [{ category: "tamatebako_verbal", subCategory: "趣旨把握", limit: 10 }],
};
// 玉手箱・英語: 論理的読解（GAB形式）24/10分・長文読解（IMAGES形式）24/10分。
const TAMATEBAKO_ENGLISH_GAB_SECTION: ExamSection = {
  label: "英語・論理的読解（GAB形式）",
  timeLimitSec: 10 * 60,
  subParts: [{ category: "tamatebako_english", subCategory: "論理的読解（GAB形式）", limit: 24 }],
};
const TAMATEBAKO_ENGLISH_IMAGES_SECTION: ExamSection = {
  label: "英語・長文読解（IMAGES形式）",
  timeLimitSec: 10 * 60,
  subParts: [{ category: "tamatebako_english", subCategory: "長文読解（IMAGES形式）", limit: 24 }],
};

// GAB/C-GAB: 言語理解32/15分・計数理解29/15分（電卓使用不可）・英語24/10分。
const GAB_VERBAL_SECTION: ExamSection = {
  label: "言語理解",
  timeLimitSec: 15 * 60,
  subParts: [{ category: "gab_verbal", subCategory: "論理的読解", limit: 32 }],
};
const GAB_QUANTITATIVE_SECTION: ExamSection = {
  label: "計数理解（電卓使用不可）",
  timeLimitSec: 15 * 60,
  subParts: [{ category: "gab_quantitative", subCategory: "資料の読み取り", limit: 29 }],
};
const GAB_ENGLISH_SECTION: ExamSection = {
  label: "英語",
  timeLimitSec: 10 * 60,
  subParts: [{ category: "gab_english", subCategory: "長文読解", limit: 24 }],
};

// SCOA: 言語・数理・論理・常識・英語の全分野を横断する単一の統合模試。
// 2026-09-02に5科目18単元構成へ改修（src/data/examStockTargets.ts参照）。ただし
// SectionedExamFlowは1つのsubPartでも0件だとセクション全体を「出題できる問題がありません」で
// 失敗させる仕様のため、新設単元でis_mock_only=1の在庫がまだ0件のもの（論理: サイコロ・空間図形）
// は、実問題データが投入されるまでこのsubPartsから除外している（在庫が揃い次第、
// examStockTargets.tsの全13単元と一致させること。除外中は満点が120問ではなく115問になる）。
// 英語・長文読解（現「和文英訳・英文和訳・英会話」に改称）は2026-09-02の練習問題→模試専用への
// 振り替えマイグレーションで在庫を確保できたため復帰済み。同日中に言語の「漢字・語句の意味」と
// 「熟語・ことわざ・慣用句」を「漢字・語句・熟語・ことわざ・慣用句」1単元へ統合し、さらに
// 「類義語・対義語」（既存問題0件のまま）を廃止してその出題数を吸収する形で12問/回に引き上げた
// （これにより言語は全単元が在庫を満たし除外無しで出題できるようになった）。続けて論理の
// 「推論・命題」「ベン図」「暗号・法則性」「順序・位置関係」を「論理（推論・命題・ベン図・暗号・順序）」
// 1単元（20問/回）へ統合した。
const SCOA_SECTION: ExamSection = {
  label: "SCOA",
  timeLimitSec: 60 * 60,
  subParts: [
    { category: "scoa_language", subCategory: "漢字・語句・熟語・ことわざ・慣用句", limit: 12 },
    { category: "scoa_language", subCategory: "長文読解", limit: 8 },
    { category: "scoa_math", subCategory: "四則計算", limit: 5 },
    { category: "scoa_math", subCategory: "方程式・不等式", limit: 5 },
    { category: "scoa_math", subCategory: "数列・規則性", limit: 4 },
    { category: "scoa_math", subCategory: "文章題（割合・確率・濃度など）", limit: 11 },
    { category: "scoa_logic", subCategory: "論理（推論・命題・ベン図・暗号・順序）", limit: 20 },
    { category: "scoa_english", subCategory: "単語・熟語・アクセント", limit: 10 },
    { category: "scoa_english", subCategory: "英文法・語法", limit: 5 },
    { category: "scoa_english", subCategory: "和文英訳・英文和訳・英会話", limit: 10 },
    { category: "scoa_common_sense", subCategory: "社会", limit: 13 },
    { category: "scoa_common_sense", subCategory: "理科", limit: 12 },
  ],
};

const EXAM_PARTS = {
  // 2026-09-02に他テスト（GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行した
  // （旧: 練習問題と同一のis_mock_only=0プールから出題。src/data/examStockTargets.tsの
  // sharesPoolWithPractice: trueは移行前の名残であり、この変更に合わせて撤去済み）。
  spi_basic: { label: "基礎能力試験（言語・非言語）", mockOnly: true },
  spi_english: { subParts: SPI_ENGLISH_SUBPARTS, label: "英語", mockOnly: true },
  spi_structural: { subParts: SPI_STRUCTURAL_SUBPARTS, label: "構造把握", mockOnly: true },
  scoa: { sections: [SCOA_SECTION], label: "SCOA", mockOnly: true },

  tgweb_traditional_verbal: { sections: [TGWEB_TRADITIONAL_VERBAL_SECTION], label: "TG-WEB従来型・言語", mockOnly: true },
  tgweb_traditional_nonverbal: { sections: [TGWEB_TRADITIONAL_NONVERBAL_SECTION], label: "TG-WEB従来型・非言語", mockOnly: true },
  tgweb_new_verbal: { sections: [TGWEB_NEW_VERBAL_SECTION], label: "TG-WEB新型・言語", mockOnly: true },
  tgweb_new_nonverbal: { sections: [TGWEB_NEW_NONVERBAL_SECTION], label: "TG-WEB新型・非言語", mockOnly: true },
  tgweb_english: { sections: [TGWEB_ENGLISH_SECTION], label: "TG-WEB英語（共通）", mockOnly: true },

  tamatebako_math_arithmetic: { sections: [TAMATEBAKO_MATH_ARITHMETIC_SECTION], label: "玉手箱・計数（四則計算）", mockOnly: true },
  tamatebako_math_graph: { sections: [TAMATEBAKO_MATH_GRAPH_SECTION], label: "玉手箱・計数（図表読取）", mockOnly: true },
  tamatebako_math_table: { sections: [TAMATEBAKO_MATH_TABLE_SECTION], label: "玉手箱・計数（表推測）", mockOnly: true },
  tamatebako_verbal_gab: { sections: [TAMATEBAKO_VERBAL_GAB_SECTION], label: "玉手箱・言語（論理的読解）", mockOnly: true },
  tamatebako_verbal_images: { sections: [TAMATEBAKO_VERBAL_IMAGES_SECTION], label: "玉手箱・言語（趣旨判定）", mockOnly: true },
  tamatebako_verbal_summary: { sections: [TAMATEBAKO_VERBAL_SUMMARY_SECTION], label: "玉手箱・言語（趣旨把握）", mockOnly: true },
  tamatebako_english_gab: { sections: [TAMATEBAKO_ENGLISH_GAB_SECTION], label: "玉手箱・英語（論理的読解）", mockOnly: true },
  tamatebako_english_images: { sections: [TAMATEBAKO_ENGLISH_IMAGES_SECTION], label: "玉手箱・英語（長文読解）", mockOnly: true },

  gab_verbal_exam: { sections: [GAB_VERBAL_SECTION], label: "GAB/C-GAB・言語理解", mockOnly: true },
  gab_quantitative_exam: { sections: [GAB_QUANTITATIVE_SECTION], label: "GAB/C-GAB・計数理解", mockOnly: true },
  gab_english_exam: { sections: [GAB_ENGLISH_SECTION], label: "GAB/C-GAB・英語", mockOnly: true },
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
      const answersWithTime = results.map((r) => ({
        questionId: r.questionId,
        correct: r.correct,
        answerTimeSeconds: r.answerTimeSeconds,
      }));
      await fetch("/api/practice/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, testType: partId, answers: answersWithTime, isPractice: false }),
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
      subParts={part.subParts ?? []}
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
  const questionStartedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    Promise.all([
      fetchSubPartsPool(SPI_VERBAL_SUBPARTS, BASIC_EXAM_POOL_MULTIPLIER, true),
      fetchSubPartsPool(SPI_NON_VERBAL_SUBPARTS, BASIC_EXAM_POOL_MULTIPLIER, true),
    ])
      .then(([verbalQuestions, nonVerbalQuestions]) => {
        if (!verbalQuestions.length || !nonVerbalQuestions.length) {
          setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
          return;
        }
        setPools({ verbal: verbalQuestions, non_verbal: nonVerbalQuestions });
        setCurrentQuestion(verbalQuestions[0]);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
  }, []);

  // 現在の問題が表示された時点を計測開始とする（解答時間の計測用、試験中はUI非表示）。
  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [currentQuestion]);

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
    const timeTaken = Math.max(0, Math.round((Date.now() - questionStartedAtRef.current) / 1000));
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
      rawCategory: currentQuestion.rawCategory,
      answerTimeSeconds: timeTaken,
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
  subParts,
  label,
  mockOnly,
}: {
  partId: ExamPartId;
  subParts: readonly ExamSubPart[];
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
    fetchSubPartsPool(subParts, 1, mockOnly)
      .then((qs) => {
        if (qs.length === 0) {
          setLoadError("出題できる問題がありません。時間をおいて再度お試しください。");
          return;
        }
        setQuestions(qs);
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

  function pushResult(q: Question, selectedLabel: string | null, answerTimeSeconds: number | null) {
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
      rawCategory: q.rawCategory,
      answerTimeSeconds,
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
      pushResult(question, null, null);
      advance();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, finishing, question]);

  function handleSelect(label: string) {
    if (!question || finishing) return;
    pushResult(question, label, TIME_PER_QUESTION - timeLeft);
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
  const questionStartedAtRef = useRef<number>(Date.now());

  // 現在の問題が表示された時点を計測開始とする（セクション単位の残り時間とは別に、問題ごとの
  // 解答時間を計測する。試験中はUIに表示しない）。
  useEffect(() => {
    questionStartedAtRef.current = Date.now();
  }, [sectionIndex, questionIndex]);

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

  function pushResult(q: Question, selectedLabel: string | null, answerTimeSeconds: number | null) {
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
