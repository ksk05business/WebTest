import type { Question } from "@/src/data/questions";
import { fetchWithRetry } from "@/src/lib/fetchWithRetry";

// app/test/page.tsxが肥大化していたため、模試（本番モード）のパート・セクション構成データを
// こちらへ切り出した。ロジック（BasicExamFlow・SectionedExamFlow等）は元のapp/test/page.tsxに
// 残し、このファイルは「どのテスト種別・パートが、どの小分類から何問ずつ出題されるか」という
// 設定データと、それを取得するfetchSubPartsPoolのみを持つ（他のsrc/data/*.tsと同じ役割分担）。

// 基礎能力試験（言語・非言語）は「言語39問＋非言語30問＝計69問の固定ロースター」を、35分間
// （2100秒）のタイムボックス内で解く方式（言語は本来40問が目安だが、長文読解が3問1組の
// passage_group_id単位でしか選出できないため39問に調整している。詳細はSPI_VERBAL_SUBPARTSの
// コメント参照）。src/data/targetTimes.tsのSUBCATEGORY_OVERRIDE_SECONDS（verbal::* /
// non_verbal::*）は、この69問すべてを目標ペースちょうどで解いた場合の合計が言語900秒＋
// 非言語1200秒＝2100秒（35分）にぴったり一致するよう逆算済みなので、出題数（各SubPartの
// limit値）を変更する場合は必ずtargetTimes.ts側の秒数も再計算すること。
// 69問すべてに解答し終えた場合はタイマー残りに関わらずその時点で試験終了。35分経過時点で69問に
// 到達していない場合は、そこまでに実際に解答した分のみを/resultの解答一覧に表示する
// （未到達分はプレースホルダー表示せず、単に一覧に含めない）。
export const BASIC_EXAM_TOTAL_SEC = 35 * 60;

export type ExamSubPart = { category: string; subCategory: string; limit: number };

// セクション単位で独立した制限時間を持つ模試（TG-WEB等）の1セクション分の定義。
// 複数の小分類から決まった問数ずつ出題される構成のため、小分類ごとの出題数をsubPartsで指定する。
export type ExamSection = { label: string; timeLimitSec: number; subParts: readonly ExamSubPart[] };

export type ExamPartConfig = {
  label: string;
  mockOnly: boolean;
  // spi_basic（BasicExamFlowが個別に扱う固定ロースター方式）を除き、全パートがこちらを使う。
  // 1セクションのみ（例: SPI英語・構造把握）の場合もsections配列の要素数を1にして表現する。
  sections?: readonly ExamSection[];
};

// SPI: 2026-09-02改修。言語39問＋非言語30問＋英語29問＋構造把握20問＝計118問/回
// （src/data/examStockTargets.tsのSPIエントリと完全に一致させること）。同日中に他テスト
// （GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行し、EXAM_PARTSのmockOnlyを
// trueにしたため、以下のsubPartsはis_mock_only=1（模試専用に振り替え済みの問題）のみを
// 対象に出題する。
// 言語「長文読解」はlimit=6（本来の目安は7だが、長文読解は1つの長文につき3問1組
// （passage_group_id）で構成されており、/api/questions側は長文の途中で問い合わせを打ち切らず
// 「3問1組を丸ごと含むか、丸ごと除外するか」でしか選出しないため、7を指定しても実際には常に
// 6問（2組）しか返らない。それに合わせてlimitを6に設定し、src/data/targetTimes.tsの
// verbal::長文読解の目安秒数もこの6問前提で35分ちょうどになるよう逆算している）。
export const SPI_VERBAL_SUBPARTS: readonly ExamSubPart[] = [
  { category: "verbal", subCategory: "語彙", limit: 12 },
  { category: "verbal", subCategory: "二語の関係", limit: 6 },
  { category: "verbal", subCategory: "熟語の成り立ち", limit: 5 },
  { category: "verbal", subCategory: "語句の用法", limit: 5 },
  { category: "verbal", subCategory: "文の並べ替え", limit: 5 },
  { category: "verbal", subCategory: "長文読解", limit: 6 },
];
export const SPI_NON_VERBAL_SUBPARTS: readonly ExamSubPart[] = [
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
  // 長文読解（英語）もverbal::長文読解と同じ理由（3問1組のpassage_group_id単位でしか
  // 選出されない）でlimitを6にしている。
  { category: "english", subCategory: "長文読解（英語）", limit: 6 },
];
const SPI_STRUCTURAL_SUBPARTS: readonly ExamSubPart[] = [
  { category: "structural", subCategory: "文章の構造化", limit: 10 },
  { category: "structural", subCategory: "分類・グループ化", limit: 10 },
];

// 英語・構造把握は、以前は1問ごとに60秒の制限時間を設けていたが、SPI本番の実際の形式
// （セクション全体で持ち時間が決まっており、問題間で残り時間がリセットされない）に合わせて、
// セクション全体で20分（1200秒）の通し時間制へ変更した（2026-09-11改修）。
const SPI_ENGLISH_SECTION: ExamSection = { label: "英語", timeLimitSec: 20 * 60, subParts: SPI_ENGLISH_SUBPARTS };
const SPI_STRUCTURAL_SECTION: ExamSection = {
  label: "構造把握",
  timeLimitSec: 20 * 60,
  subParts: SPI_STRUCTURAL_SUBPARTS,
};

// subPartsで指定した小分類ごとにlimit×multiplier件ずつ並行取得する。同じ小分類（出題形式）の
// 問題が連続して出題されるよう、取得結果はsubPartsの宣言順のまま連結し、配列全体を横断する
// シャッフルは行わない。
// 例: SPI言語で「語句の用法」が5問選出された場合、他の形式が間に挟まらず5問連続で出題されてから
// 次の形式へ移行する。
// 【重要】各小分類内の並び順は、APIが返す順序をそのまま尊重すること（ここで独自にシャッフルし
// 直してはいけない）。/api/questions は長文読解のような同一passage_group_id（1つの長文に対する
// 複数設問）を常に連続させたうえでグループ単位のみをシャッフルして返す。この応答をクライアント側で
// さらに一様シャッフルすると、passage_group_idの情報がクライアントのQuestion型に含まれていない
// ため再グループ化できず、同じ長文の設問がバラバラに分散してしまう不具合が実際に発生した
// （このコメントの直前まで、ここで再シャッフルしてしまっていた）。
export async function fetchSubPartsPool(
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
      return fetchWithRetry(`/api/questions?${params.toString()}`).then((r) => r.json());
    })
  );
  return (results as { questions?: Question[] }[]).flatMap((r) => r.questions ?? []);
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
// TG-WEB英語: 従来型・新型で共有する長文問題10問＋空欄補充5問の計15問（単独で受験可能な1セクション）。
// 空欄補充は2026-09-21に練習問題プールから15問（3回分）を模試専用へ振り替えて追加した
// （制限時間はセクション全体の持ち時間制のため、出題数を10→15に増やしても15分のまま変更していない）。
const TGWEB_ENGLISH_SECTION: ExamSection = {
  label: "英語（従来型・新型共通）",
  timeLimitSec: 15 * 60,
  subParts: [
    { category: "tgweb_english", subCategory: "長文問題", limit: 10 },
    { category: "tgweb_english", subCategory: "空欄補充", limit: 5 },
  ],
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

export const EXAM_PARTS = {
  // 2026-09-02に他テスト（GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行した
  // （旧: 練習問題と同一のis_mock_only=0プールから出題。src/data/examStockTargets.tsの
  // sharesPoolWithPractice: trueは移行前の名残であり、この変更に合わせて撤去済み）。
  spi_basic: { label: "基礎能力試験（言語・非言語）", mockOnly: true },
  spi_english: { sections: [SPI_ENGLISH_SECTION], label: "英語", mockOnly: true },
  spi_structural: { sections: [SPI_STRUCTURAL_SECTION], label: "構造把握", mockOnly: true },
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

export type ExamPartId = keyof typeof EXAM_PARTS;

export function resolvePartId(raw: string | null): ExamPartId {
  if (raw && Object.prototype.hasOwnProperty.call(EXAM_PARTS, raw)) {
    return raw as ExamPartId;
  }
  return "spi_basic";
}
