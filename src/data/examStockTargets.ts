// 模試専用プール（questions.is_mock_only=1）の「3回分」在庫目標を、テスト種別・単元ごとに定義する。
// 値はapp/test/page.tsxのEXAM_PARTS（ExamSection.subParts[].limit、1回の模試で実際に出題される件数）
// と完全に一致させること。同じcategory/subCategoryが複数のEXAM_PARTSエントリから参照される場合
// （例: tgweb_verbal_readingは従来型・新型の両方の言語セクションから出題される）はperCycleを合算する。
// 管理画面の在庫集計ダッシュボード（functions/api/admin/question-stats.ts）専用の参照データであり、
// 出題ロジック自体はこのファイルを参照しない（page.tsx側の変更時はこちらも手動で同期すること）。
export type ExamStockTarget = {
  category: string;
  subCategory: string;
  sectionLabel: string;
  // 2ヶ月に1回のリセット周期内に、独立して受験可能な模試（複数選択可能な場合は合算）が
  // 1回あたり出題する件数の合計。
  perCycle: number;
};

export const EXAM_STOCK_TARGETS: readonly ExamStockTarget[] = [
  // 玉手箱
  { category: "tamatebako_math", subCategory: "四則逆算", sectionLabel: "計数・四則計算", perCycle: 50 },
  { category: "tamatebako_math", subCategory: "図表の読み取り", sectionLabel: "計数・図表読取", perCycle: 29 },
  { category: "tamatebako_math", subCategory: "表の空欄推測", sectionLabel: "計数・表推測", perCycle: 20 },
  { category: "tamatebako_verbal", subCategory: "論理的読解（GAB形式）", sectionLabel: "言語・論理的読解", perCycle: 32 },
  { category: "tamatebako_verbal", subCategory: "趣旨判定（IMAGES形式）", sectionLabel: "言語・趣旨判定", perCycle: 32 },
  { category: "tamatebako_verbal", subCategory: "趣旨把握", sectionLabel: "言語・趣旨把握", perCycle: 10 },
  { category: "tamatebako_english", subCategory: "論理的読解（GAB形式）", sectionLabel: "英語・論理的読解", perCycle: 24 },
  { category: "tamatebako_english", subCategory: "長文読解（IMAGES形式）", sectionLabel: "英語・長文読解", perCycle: 24 },

  // TG-WEB
  { category: "tgweb_traditional_verbal", subCategory: "空欄補充", sectionLabel: "従来型・言語", perCycle: 5 },
  { category: "tgweb_traditional_verbal", subCategory: "並べ替え", sectionLabel: "従来型・言語", perCycle: 4 },
  // 従来型・言語(3問)＋新型・言語(4問)の両方から出題されるため合算。
  { category: "tgweb_verbal_reading", subCategory: "長文読解", sectionLabel: "従来型・新型 言語（共通）", perCycle: 3 + 4 },
  { category: "tgweb_traditional_math", subCategory: "推論", sectionLabel: "従来型・非言語", perCycle: 4 },
  { category: "tgweb_traditional_math", subCategory: "図形問題", sectionLabel: "従来型・非言語", perCycle: 3 },
  { category: "tgweb_traditional_math", subCategory: "暗号", sectionLabel: "従来型・非言語", perCycle: 2 },
  { category: "tgweb_new_verbal", subCategory: "同義語・対義語", sectionLabel: "新型・言語", perCycle: 8 },
  { category: "tgweb_new_verbal", subCategory: "ことわざ", sectionLabel: "新型・言語", perCycle: 8 },
  { category: "tgweb_new_verbal", subCategory: "慣用句", sectionLabel: "新型・言語", perCycle: 7 },
  { category: "tgweb_new_verbal", subCategory: "四字熟語", sectionLabel: "新型・言語", perCycle: 7 },
  { category: "tgweb_new_math", subCategory: "四則演算", sectionLabel: "新型・非言語", perCycle: 30 },
  { category: "tgweb_new_math", subCategory: "図表の読み取り", sectionLabel: "新型・非言語", perCycle: 6 },
  { category: "tgweb_english", subCategory: "長文問題", sectionLabel: "英語（共通）", perCycle: 10 },
  { category: "tgweb_english", subCategory: "空欄補充", sectionLabel: "英語（共通）", perCycle: 5 },

  // GAB/C-GAB
  { category: "gab_verbal", subCategory: "論理的読解", sectionLabel: "言語理解", perCycle: 32 },
  { category: "gab_quantitative", subCategory: "資料の読み取り", sectionLabel: "計数理解", perCycle: 29 },
  { category: "gab_english", subCategory: "長文読解", sectionLabel: "英語", perCycle: 24 },

  // SCOA（全13単元が同じ1つの統合模試を構成する。2026-09-02に5科目18単元構成へ改修、
  // 既存問題データもDB上でこの構成へ再振り分け済み。同日中に言語の「漢字・語句の意味」と
  // 「熟語・ことわざ・慣用句」を1単元へ統合し17単元に、さらに同日中に「類義語・対義語」
  // （既存問題0件のまま）を廃止し16単元に、続けて論理の「推論・命題」「ベン図」「暗号・法則性」
  // 「順序・位置関係」を1単元へ統合し13単元に。sectionLabelは科目名とし、
  // 「長文読解」など単元名が科目間で重複するケースを区別できるようにしている）。
  // 言語（計20問/回）。2026-09-02に「漢字・語句の意味」と「熟語・ことわざ・慣用句」を
  // 「漢字・語句・熟語・ことわざ・慣用句」1単元へ統合後、同日中に「類義語・対義語」を廃止し
  // その分の出題数（4問/回）を吸収する形で12問/回に引き上げた。
  { category: "scoa_language", subCategory: "漢字・語句・熟語・ことわざ・慣用句", sectionLabel: "言語", perCycle: 12 },
  { category: "scoa_language", subCategory: "長文読解", sectionLabel: "言語", perCycle: 8 },
  // 数理（計25問/回）
  { category: "scoa_math", subCategory: "四則計算", sectionLabel: "数理", perCycle: 5 },
  { category: "scoa_math", subCategory: "方程式・不等式", sectionLabel: "数理", perCycle: 5 },
  { category: "scoa_math", subCategory: "数列・規則性", sectionLabel: "数理", perCycle: 4 },
  { category: "scoa_math", subCategory: "文章題（割合・確率・濃度など）", sectionLabel: "数理", perCycle: 11 },
  // 論理（計25問/回）。2026-09-02に「推論・命題」「ベン図」「暗号・法則性」「順序・位置関係」の
  // 4単元を「論理（推論・命題・ベン図・暗号・順序）」1単元へ統合（旧4単元の合計6+4+5+5=20問/回）。
  // 「サイコロ・空間図形」は統合対象外で単独単元のまま維持。
  { category: "scoa_logic", subCategory: "論理（推論・命題・ベン図・暗号・順序）", sectionLabel: "論理", perCycle: 20 },
  { category: "scoa_logic", subCategory: "サイコロ・空間図形", sectionLabel: "論理", perCycle: 5 },
  // 英語（計25問/回）
  { category: "scoa_english", subCategory: "単語・熟語・アクセント", sectionLabel: "英語", perCycle: 10 },
  { category: "scoa_english", subCategory: "英文法・語法", sectionLabel: "英語", perCycle: 5 },
  // 2026-09-02に「長文読解」から改称。既存問題（和文英訳・英文和訳・英会話の3タグ、計30問）が
  // そのままこの単元名と完全一致する内容だったため、内容変更を伴わない改称のみで対応した。
  { category: "scoa_english", subCategory: "和文英訳・英文和訳・英会話", sectionLabel: "英語", perCycle: 10 },
  // 常識（計25問/回）
  { category: "scoa_common_sense", subCategory: "社会", sectionLabel: "常識", perCycle: 13 },
  { category: "scoa_common_sense", subCategory: "理科", sectionLabel: "常識", perCycle: 12 },

  // SPI3（2026-09-02改修。言語39問＋非言語30問＋英語29問＋構造把握20問＝計118問/回。
  // 同日中に他テスト（GAB/TG-WEB等）と同じ「模試専用プール分離」方式へ完全移行したため、
  // sharesPoolWithPracticeフラグは撤去済み＝他テストと同じmockCount基準で在庫判定される）。
  // 言語（計39問/回。長文読解は3問1組のpassage_group_id単位でしか選出されないため、本来の
  // 目安7問ではなく実際に配信可能な6問をperCycleとしている。app/test/page.tsxの
  // SPI_VERBAL_SUBPARTSのコメント参照）
  { category: "verbal", subCategory: "語彙", sectionLabel: "言語", perCycle: 12 },
  { category: "verbal", subCategory: "二語の関係", sectionLabel: "言語", perCycle: 6 },
  { category: "verbal", subCategory: "熟語の成り立ち", sectionLabel: "言語", perCycle: 5 },
  { category: "verbal", subCategory: "語句の用法", sectionLabel: "言語", perCycle: 5 },
  { category: "verbal", subCategory: "文の並べ替え", sectionLabel: "言語", perCycle: 5 },
  { category: "verbal", subCategory: "長文読解", sectionLabel: "言語", perCycle: 6 },
  // 非言語（計30問/回）。「濃度算」「分割払い」はユーザー仕様上「濃度算 / 分割払い: 3問/回」と
  // 1行にまとめて示されていたため、既存の2つの独立単元のまま2:1で按分した（濃度算のほうが
  // 出題頻度の高い定番論点のため多めに配分）。
  { category: "non_verbal", subCategory: "推論", sectionLabel: "非言語", perCycle: 9 },
  { category: "non_verbal", subCategory: "損益算", sectionLabel: "非言語", perCycle: 3 },
  { category: "non_verbal", subCategory: "場合の数・確率", sectionLabel: "非言語", perCycle: 4 },
  { category: "non_verbal", subCategory: "資料の読み取り", sectionLabel: "非言語", perCycle: 3 },
  { category: "non_verbal", subCategory: "集合", sectionLabel: "非言語", perCycle: 2 },
  { category: "non_verbal", subCategory: "仕事算", sectionLabel: "非言語", perCycle: 2 },
  { category: "non_verbal", subCategory: "速さ・時間・距離", sectionLabel: "非言語", perCycle: 2 },
  { category: "non_verbal", subCategory: "割合・比", sectionLabel: "非言語", perCycle: 2 },
  { category: "non_verbal", subCategory: "濃度算", sectionLabel: "非言語", perCycle: 2 },
  { category: "non_verbal", subCategory: "分割払い", sectionLabel: "非言語", perCycle: 1 },
  // 英語（計29問/回。長文読解（英語）も3問1組のため本来の目安7問ではなく6問で計上）
  { category: "english", subCategory: "語意（同意語・反意語）", sectionLabel: "英語", perCycle: 9 },
  { category: "english", subCategory: "空欄補充", sectionLabel: "英語", perCycle: 9 },
  { category: "english", subCategory: "英英辞典", sectionLabel: "英語", perCycle: 5 },
  { category: "english", subCategory: "長文読解（英語）", sectionLabel: "英語", perCycle: 6 },
  // 構造的把握力（計20問/回）
  { category: "structural", subCategory: "文章の構造化", sectionLabel: "構造把握", perCycle: 10 },
  { category: "structural", subCategory: "分類・グループ化", sectionLabel: "構造把握", perCycle: 10 },
];

// 「3回分」を在庫目標の基準とする（複数サイクルにわたり出題が重複しにくくするための目安）。
export const STOCK_CYCLES = 3;

export function findStockTarget(category: string, subCategory: string): ExamStockTarget | undefined {
  return EXAM_STOCK_TARGETS.find((t) => t.category === category && t.subCategory === subCategory);
}
