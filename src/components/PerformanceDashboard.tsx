"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redirectToLogin } from "@/src/lib/authRedirect";
import { MULTI_PART_EXAM_PARTS, type ExamPartInfo } from "@/src/data/testTypes";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BaseTickContentProps,
  type TooltipContentProps,
} from "recharts";

// 科目（模試のパート、例: SPIの「基礎能力試験」「英語」「構造把握」）ごとに割り当てるテーマカラー。
// 正解率推移グラフの各ラインと、レーダーチャートの軸配色・ポリゴン塗り分け（colorForPart）の両方で共通して使う。
const SUBJECT_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#dc2626", "#0d9488", "#db2777", "#ca8a04"];

// questions.category（大分類、レーダーチャートの単元がどれに属するか）→ 模試パート（test_type）の対応表。
// SPIはcategoryとパートの対応が一意に定まる（例: non_verbal/verbalはどちらも「基礎能力試験」に統合されて
// 出題される）ため、レーダーチャートの軸色を正解率推移グラフのパート別カラーと連動させられる。
// TG-WEBも従来型・新型の言語/非言語＋英語の5パートにそれぞれcategoryが1対1で対応するため同様に定義する
// （tgweb_verbal_reading＝共通・言語の長文読解のみ、本番模試の独立パートが無いため対応表から除外し、
// デフォルト色のまま表示する）。GAB/C-GABも言語・計数・英語の3パートにそれぞれcategoryが1対1で
// 対応するため同様に定義する。玉手箱は1つのcategory（例: tamatebako_math）が複数パートにまたがり
// category単位では一意に定まらないため、こちらではなくSUBCATEGORY_TO_PART_ID（sub_category単位）で
// 対応させる。
const CATEGORY_TO_PART_ID: Record<string, Record<string, string>> = {
  spi: { non_verbal: "spi_basic", verbal: "spi_basic", structural: "spi_structural", english: "spi_english" },
  tgweb: {
    tgweb_traditional_verbal: "tgweb_traditional_verbal",
    tgweb_traditional_math: "tgweb_traditional_nonverbal",
    tgweb_new_verbal: "tgweb_new_verbal",
    tgweb_new_math: "tgweb_new_nonverbal",
    tgweb_english: "tgweb_english",
  },
  gab_cgab: {
    gab_verbal: "gab_verbal_exam",
    gab_quantitative: "gab_quantitative_exam",
    gab_english: "gab_english_exam",
  },
};

// "category::sub_category" 単位のパート対応表。玉手箱は同じcategory内でも単元（sub_category）ごとに
// 異なる本番模試パートに分かれており（例: tamatebako_math配下の「四則逆算」「図表の読み取り」
// 「表の空欄推測」はそれぞれ別パート）、CATEGORY_TO_PART_IDのcategory単位の対応表では表現できない。
// さらに「論理的読解（GAB形式）」のようにsub_category名だけでは言語/英語の科目を一意に決められない
// 単元もあるため、必ずcategoryと組み合わせたキーで引く。
const SUBCATEGORY_TO_PART_ID: Record<string, Record<string, string>> = {
  tamatebako: {
    "tamatebako_math::四則逆算": "tamatebako_math_arithmetic",
    "tamatebako_math::図表の読み取り": "tamatebako_math_graph",
    "tamatebako_math::表の空欄推測": "tamatebako_math_table",
    "tamatebako_verbal::論理的読解（GAB形式）": "tamatebako_verbal_gab",
    "tamatebako_verbal::趣旨判定（IMAGES形式）": "tamatebako_verbal_images",
    "tamatebako_verbal::趣旨把握": "tamatebako_verbal_summary",
    "tamatebako_english::論理的読解（GAB形式）": "tamatebako_english_gab",
    "tamatebako_english::長文読解（IMAGES形式）": "tamatebako_english_images",
  },
};

// レーダーチャート専用の単元統合グループ（現状SPIのみ）。「単元別・詳細分析」リストはここでは
// 統合せず全単元を個別表示するが、SPIは単元数が多く（22単元）レーダーチャートの軸として
// 全部表示すると見づらいため、意味の近い単元をまとめて8軸程度に統合する。
// subCategoriesはsrc/data/practiceUnits.tsのsubCategory（questions.sub_categoryの実値）と
// 完全一致させること（表示用labelとは異なる場合がある点に注意）。
const RADAR_GROUPS_BY_TEST: Record<
  string,
  { label: string; category: string; subCategories: string[] }[]
> = {
  spi: [
    { label: "推論・論理", category: "non_verbal", subCategories: ["推論", "集合"] },
    {
      label: "文章題・計算",
      category: "non_verbal",
      subCategories: ["損益算", "割合・比", "仕事算", "分割払い", "濃度算"],
    },
    {
      label: "図表・数理",
      category: "non_verbal",
      subCategories: ["資料の読み取り", "速さ・時間・距離", "場合の数・確率"],
    },
    {
      label: "語彙・文法",
      category: "verbal",
      subCategories: ["二語の関係", "語彙", "語句の用法", "熟語の成り立ち"],
    },
    { label: "文章・読解", category: "verbal", subCategories: ["文の並べ替え", "長文読解"] },
    {
      label: "語彙・文法",
      category: "english",
      subCategories: ["語意（同意語・反意語）", "英英辞典", "空欄補充"],
    },
    { label: "読解", category: "english", subCategories: ["長文読解（英語）"] },
    {
      label: "構造・分類",
      category: "structural",
      subCategories: ["文章の構造化", "分類・グループ化"],
    },
  ],
};

const RADAR_SUBJECT_SHORT_LABEL: Record<string, string> = {
  non_verbal: "非言語",
  verbal: "言語",
  english: "英語",
  structural: "構造把握",
};

type CategoryBreakdownItem = {
  category: string;
  label: string;
  correct: number;
  total: number;
  accuracyRate: number | null;
  deviationScore: number | null;
};

type SubCategoryBreakdownItem = {
  category: string;
  subCategory: string;
  label: string;
  correct: number;
  total: number;
  accuracyRate: number | null;
  deviationScore: number | null;
};

type ExamHistoryItem = {
  id: number;
  testType: string;
  score: number;
  total: number;
  accuracyRate: number;
  deviationScore: number | null;
  takenAt: string;
};

type ExamData = {
  history: ExamHistoryItem[];
  attemptCount: number;
  latestDeviationScore: number | null;
  bestDeviationScore: number | null;
  bestAccuracyRate: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
  subCategoryBreakdown: SubCategoryBreakdownItem[];
  testTypeFamily: string;
};

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-blue-700">{value}</p>
    </div>
  );
}

// 特定のテスト種別（testType、例: "tamatebako"）に絞った成績サマリー（最高/直近正解率・
// 受検回数・正解率推移グラフ・カテゴリ別分析）を表示する。試験別専用ページ（/dashboard/[testId]）
// 専用のコンポーネントで、メインダッシュボードには表示しない（成績表示は各試験の専用ページに
// 一本化したため）。偏差値はAPI（GET /api/exam-results）が引き続き算出・返却しているが
// （企業側のスカウト機能等で利用するため）、学生向けのこの画面では表示しない。
export function PerformanceDashboard({ email, testType }: { email: string; testType: string }) {
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/exam-results?testType=${encodeURIComponent(testType)}`)
      .then((res) => res.json())
      .then((data: (ExamData & { error?: string }) | { error: string }) => {
        if ("error" in data) {
          if (data.error === "ログインが必要です") redirectToLogin(router);
          return;
        }
        setExamData(data);
      })
      .catch(() => {
        // 成績サマリーの取得に失敗してもページ自体は表示する
      });
  }, [email, testType, router]);

  return (
    <div className="flex flex-col gap-4">
      {!examData || examData.attemptCount === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          まだこのテストの模試を受験していません。模試を受けると成績推移・弱点分析がここに表示されます。
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="最高正解率"
              value={examData.bestAccuracyRate !== null ? `${Math.round(examData.bestAccuracyRate * 100)}%` : "-"}
            />
            <SummaryCard
              label="直近正解率"
              value={
                examData.history[0]
                  ? `${Math.round(examData.history[0].accuracyRate * 100)}%`
                  : "-"
              }
            />
            <SummaryCard label="受検回数" value={`${examData.attemptCount}回`} />
          </div>

          {(() => {
            // パート（test_type）ごとに独立したラインを描画するため、まずテスト種別（testTypeFamily）
            // が持つパート一覧を取得する（複数パート方式のテストのみ。SCOA等の単一パート方式は
            // 便宜上「正解率」という1本のラインとして扱う）。
            const parts: readonly ExamPartInfo[] = MULTI_PART_EXAM_PARTS[examData.testTypeFamily] ?? [
              { id: examData.testTypeFamily, label: "正解率" },
            ];
            const partColor = new Map(parts.map((p, i) => [p.id, SUBJECT_COLORS[i % SUBJECT_COLORS.length]]));

            // 月×パートごとに受験結果をグルーピングする。同月に複数回受験した場合は平均正解率を
            // ラインの値としてプロットし、個々の受験日・点数はentriesとして保持してツールチップで見せる
            // （平均値もここでパーセント・小数点第1位に丸めておく。DB保存値自体は変更しない）。
            const monthlyMap = new Map<
              string,
              Map<string, { sum: number; entries: { takenAt: string; score: number; total: number }[] }>
            >();
            for (const h of examData.history) {
              const d = new Date(h.takenAt);
              const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, new Map());
              const partsMap = monthlyMap.get(monthKey)!;
              if (!partsMap.has(h.testType)) partsMap.set(h.testType, { sum: 0, entries: [] });
              const bucket = partsMap.get(h.testType)!;
              bucket.sum += h.accuracyRate * 100;
              bucket.entries.push({ takenAt: h.takenAt, score: h.score, total: h.total });
            }

            const monthKeys = [...monthlyMap.keys()].sort();
            const chartData = monthKeys.map((monthKey) => {
              const row: Record<string, number | string> = {
                monthKey,
                monthLabel: `${Number(monthKey.split("-")[1])}月`,
              };
              const partsMap = monthlyMap.get(monthKey)!;
              for (const part of parts) {
                const bucket = partsMap.get(part.id);
                if (bucket) {
                  row[part.id] = Math.round((bucket.sum / bucket.entries.length) * 10) / 10;
                }
              }
              return row;
            });
            if (chartData.length === 0) return null;

            function ChartTooltip({ active, payload, label }: TooltipContentProps) {
              if (!active || !payload || payload.length === 0) return null;
              const monthKey = (payload[0]?.payload as { monthKey?: string } | undefined)?.monthKey;
              const partsMap = monthKey ? monthlyMap.get(monthKey) : undefined;
              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
                  <p className="mb-1 font-semibold text-gray-700">{label}</p>
                  {payload.map((entry) => {
                    const partId = String(entry.dataKey);
                    const partLabel = parts.find((p) => p.id === partId)?.label ?? partId;
                    const bucket = partsMap?.get(partId);
                    return (
                      <div key={partId} className="mt-1.5 first:mt-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-medium text-gray-800">{partLabel}</span>
                          <span className="text-gray-500">正解率 {Number(entry.value).toFixed(1)}%</span>
                        </div>
                        {bucket?.entries.map((e, i) => (
                          <p key={i} className="ml-3.5 text-gray-400">
                            {new Date(e.takenAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                            ：{e.score}/{e.total}問
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-gray-800">正解率推移（科目別）</p>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip content={ChartTooltip} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {parts.map((part) => (
                        <Line
                          key={part.id}
                          type="monotone"
                          dataKey={part.id}
                          name={part.label}
                          stroke={partColor.get(part.id)}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {(() => {
            const withId = examData.history.filter((h) => h.id);
            if (withId.length === 0) return null;
            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">受験履歴一覧</p>
                <div className="flex flex-col divide-y divide-gray-100">
                  {withId.map((h) => (
                    <Link
                      key={h.id}
                      href={`/result/history?id=${h.id}`}
                      className="flex items-center justify-between gap-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span className="text-gray-700">
                        {new Date(h.takenAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-gray-500">
                        {h.score}/{h.total}問　正解率 {Math.round(h.accuracyRate * 100)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}

          {(() => {
            const withData = examData.categoryBreakdown.filter((c) => c.total > 0);
            const strongest =
              withData.length > 0
                ? withData.reduce((a, b) => ((a.accuracyRate ?? 0) >= (b.accuracyRate ?? 0) ? a : b))
                : null;
            const weakest =
              withData.length > 0
                ? withData.reduce((a, b) => ((a.accuracyRate ?? 1) <= (b.accuracyRate ?? 1) ? a : b))
                : null;

            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">カテゴリ別分析</p>
                <div className="flex flex-col gap-3">
                  {examData.categoryBreakdown.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-medium text-gray-800">{c.label}</span>
                        <span>
                          {c.total > 0
                            ? `正解率 ${Math.round((c.accuracyRate ?? 0) * 100)}%`
                            : "データなし"}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.round((c.accuracyRate ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {(strongest || weakest) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {strongest && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        得意分野: {strongest.label}
                      </span>
                    )}
                    {weakest && weakest.category !== strongest?.category && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        克服すべき弱点: {weakest.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {(() => {
            const withData = examData.subCategoryBreakdown.filter((c) => c.total > 0);
            if (withData.length === 0) return null;

            // 大分類（category）ごとにグルーピングし、大分類の表示ラベルはcategoryBreakdownから引く。
            const labelByBroad = new Map(examData.categoryBreakdown.map((c) => [c.category, c.label]));
            const groups = new Map<string, SubCategoryBreakdownItem[]>();
            for (const item of examData.subCategoryBreakdown) {
              const list = groups.get(item.category) ?? [];
              list.push(item);
              groups.set(item.category, list);
            }

            // 正解率推移グラフと同じパート別カラーを、レーダーチャートの軸ラベル・データポイント・
            // ポリゴンの塗り分けにも適用する（CATEGORY_TO_PART_ID/SUBCATEGORY_TO_PART_IDに対応表が
            // ある場合のみ。無い場合は全軸を1つの"その他"パートとして扱い、従来通り単色の1ポリゴンで表示する）。
            const radarParts: readonly ExamPartInfo[] = MULTI_PART_EXAM_PARTS[examData.testTypeFamily] ?? [
              { id: examData.testTypeFamily, label: "正解率" },
            ];
            const radarPartColor = new Map(radarParts.map((p, i) => [p.id, SUBJECT_COLORS[i % SUBJECT_COLORS.length]]));
            const categoryToPart = CATEGORY_TO_PART_ID[examData.testTypeFamily];
            const subcategoryToPart = SUBCATEGORY_TO_PART_ID[examData.testTypeFamily];
            const hasPartMapping = Boolean(categoryToPart) || Boolean(subcategoryToPart);
            const OTHER_PART_ID = "__other__";
            const DEFAULT_RADAR_COLOR = "#2563eb";
            // sub_category単位の対応表（玉手箱等、同じcategory内でも単元ごとにパートが異なるテスト用）を
            // 優先し、無ければcategory単位の対応表（SPI/TG-WEB/GAB等）にフォールバックする。
            function partIdForItem(category: string, subCategory?: string): string {
              if (subCategory) {
                const subPart = subcategoryToPart?.[`${category}::${subCategory}`];
                if (subPart) return subPart;
              }
              return categoryToPart?.[category] ?? OTHER_PART_ID;
            }
            function colorForPart(partId: string): string {
              return radarPartColor.get(partId) ?? DEFAULT_RADAR_COLOR;
            }

            // レーダーチャートは軸が多すぎると読みにくくなるため、統合グループ定義がある
            // テスト種別（現状SPI）は意味の近い単元をまとめて8軸程度に統合する（グループの正答率は
            // 属する単元の正答数・出題数を合算してから算出＝加重平均）。定義が無いテスト種別は
            // 従来通り、データのある単元のうち出題数が多い（＝信頼度が高い）上位12件までに絞る。
            const radarGroups = RADAR_GROUPS_BY_TEST[examData.testTypeFamily];
            const radarPoints = radarGroups
              ? radarGroups.flatMap((g) => {
                  let correct = 0;
                  let total = 0;
                  for (const sub of g.subCategories) {
                    const item = examData!.subCategoryBreakdown.find((c) => c.subCategory === sub);
                    if (item) {
                      correct += item.correct;
                      total += item.total;
                    }
                  }
                  if (total === 0) return [];
                  const subjectShort = RADAR_SUBJECT_SHORT_LABEL[g.category] ?? g.category;
                  return [
                    {
                      subject: `【${subjectShort}】${g.label}`,
                      category: g.category,
                      partId: partIdForItem(g.category),
                      value: Math.round((correct / total) * 100),
                    },
                  ];
                })
              : (() => {
                  // パート対応表がある場合、同じパートの単元が円周上で隣り合うようパート順に
                  // グルーピングしてから並べる（複数のRadarを重ねて描画したとき、各パートの多角形が
                  // 分断されず1つのまとまった領域として見えるようにするため）。
                  const partOrder = new Map(radarParts.map((p, i) => [p.id, i]));
                  const orderOf = (item: SubCategoryBreakdownItem) =>
                    partOrder.get(partIdForItem(item.category, item.subCategory)) ?? radarParts.length;
                  const sorted = hasPartMapping
                    ? [...withData].sort((a, b) => orderOf(a) - orderOf(b) || b.total - a.total)
                    : [...withData].sort((a, b) => b.total - a.total);
                  return sorted.slice(0, 12).map((c) => ({
                    subject: c.label,
                    category: c.category,
                    partId: partIdForItem(c.category, c.subCategory),
                    value: Math.round((c.accuracyRate ?? 0) * 100),
                  }));
                })();

            // 全軸（8グループ）を1つのデータセットにまとめ、単一の<Radar dataKey="正答率">で
            // 1つの多角形として描画する（パートごとに別々の<Radar>へ分割すると、他パートの軸で
            // 値が欠けて多角形がいびつに分断されて見えるため、単一ポリゴンに戻した）。
            // 科目ごとの色分けは、ポリゴン自体ではなく軸ラベルの文字色（PolarAngleAxisのtick）で行う。
            const radarData = radarPoints.map((p) => ({
              subject: p.subject,
              category: p.category,
              正答率: p.value,
            }));

            function practiceHref(item: SubCategoryBreakdownItem) {
              const params = new URLSearchParams({
                testType: examData!.testTypeFamily,
                category: item.category,
                subCategory: item.subCategory,
              });
              return `/practice?${params.toString()}`;
            }

            return (
              <>
                {radarData.length >= 3 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="mb-2 text-sm font-semibold text-gray-800">単元別・正答率レーダーチャート</p>
                    {hasPartMapping && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {radarParts.map((part) => (
                          <span key={part.id} className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: radarPartColor.get(part.id) }}
                            />
                            {part.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <RadarChart data={radarData} outerRadius="75%">
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={(props: BaseTickContentProps) => {
                              const { x, y, textAnchor, payload } = props;
                              const point = radarPoints.find((d) => d.subject === payload.value);
                              const color = point ? colorForPart(point.partId) : "#374151";
                              return (
                                <text x={x} y={y} textAnchor={textAnchor} fontSize={10} fill={color}>
                                  {payload.value}
                                </text>
                              );
                            }}
                          />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar
                            name="正答率"
                            dataKey="正答率"
                            stroke={DEFAULT_RADAR_COLOR}
                            fill={DEFAULT_RADAR_COLOR}
                            fillOpacity={0.35}
                            dot={{ r: 3, fill: DEFAULT_RADAR_COLOR, stroke: DEFAULT_RADAR_COLOR }}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">単元別・詳細分析</p>
                  <div className="flex flex-col gap-4">
                    {[...groups.entries()].map(([broad, items]) => (
                      <div key={broad}>
                        <p className="mb-2 text-xs font-bold text-gray-500">{labelByBroad.get(broad) ?? broad}</p>
                        <div className="flex flex-col gap-2">
                          {items.map((item) => {
                            const hasData = item.total > 0;
                            const isWeak = hasData && (item.accuracyRate ?? 1) < 0.65;
                            return (
                              <div
                                key={item.subCategory}
                                className={`flex flex-col gap-1.5 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${
                                  isWeak ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50/50"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{item.label}</span>
                                    {isWeak && (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                        苦手単元
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {hasData
                                      ? `正解率 ${Math.round((item.accuracyRate ?? 0) * 100)}%（${item.correct}/${item.total}問）`
                                      : "データなし"}
                                  </p>
                                </div>
                                {hasData && (
                                  <a
                                    href={practiceHref(item)}
                                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
                                      isWeak
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    この単元を復習する
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
