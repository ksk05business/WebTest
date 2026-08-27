// 練習問題モードの「分野・単元選択」画面に表示する単元一覧（性格検査は対象外）。
// subCategory は questions.sub_category と完全一致する値を指定する（DBに実データが無い単元は0問として表示される）。
// id は単元を一意に識別するための内部キー（React key・将来の問題作成ツール等での参照用。DBには保存しない）。
// category はテスト種別ごとに専用のプレフィックス付き文字列を使う（例: SPIの"non_verbal"、玉手箱の"tamatebako_math"）。
// 同じ大分類名（"言語"等）でもテストごとに出題内容が異なるため、カテゴリ別分析等で混同しないよう分けている。
export type PracticeUnit = {
  id: string;
  subCategory: string;
  label: string;
};

export type PracticeUnitGroup = {
  category: string;
  groupLabel: string;
  units: PracticeUnit[];
};

const SPI_PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "non_verbal",
    groupLabel: "非言語（能力）",
    units: [
      { id: "inference", subCategory: "推論", label: "推論" },
      { id: "profit_loss", subCategory: "損益算", label: "損益計算" },
      { id: "sets", subCategory: "集合", label: "集合" },
      { id: "ratio", subCategory: "割合・比", label: "割合・比" },
      { id: "prob_probability", subCategory: "場合の数・確率", label: "場合の数・確率" },
      { id: "speed", subCategory: "速さ・時間・距離", label: "速さ・時間・距離" },
      { id: "table_reading", subCategory: "資料の読み取り", label: "表の読み取り" },
      { id: "work_rate", subCategory: "仕事算", label: "仕事算" },
      { id: "installment", subCategory: "分割払い", label: "分割払い" },
      { id: "concentration", subCategory: "濃度算", label: "濃度算" },
    ],
  },
  {
    category: "verbal",
    groupLabel: "言語（能力）",
    units: [
      { id: "word_relation", subCategory: "二語の関係", label: "二語の関係" },
      { id: "idiom_structure", subCategory: "熟語の成り立ち", label: "熟語の成り立ち" },
      { id: "vocabulary", subCategory: "語彙", label: "語彙・意味" },
      { id: "word_usage", subCategory: "語句の用法", label: "語句の用法" },
      { id: "sentence_reorder", subCategory: "文の並べ替え", label: "文の並べ替え" },
      { id: "reading_comprehension", subCategory: "長文読解", label: "長文読解" },
    ],
  },
  {
    category: "structural",
    groupLabel: "構造的把握力",
    units: [
      { id: "text_structure", subCategory: "文章の構造化", label: "文章の構造化" },
      { id: "classification", subCategory: "分類・グループ化", label: "分類・グループ化" },
    ],
  },
  {
    category: "english",
    groupLabel: "英語（能力）",
    units: [
      { id: "english_vocab", subCategory: "語意（同意語・反意語）", label: "語意（同意語・反意語）" },
      { id: "english_dictionary", subCategory: "英英辞典", label: "英英辞典" },
      { id: "english_fill_blank", subCategory: "空欄補充", label: "空欄補充" },
      { id: "english_reading", subCategory: "長文読解（英語）", label: "長文読解（英語）" },
    ],
  },
];

const TAMATEBAKO_PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "tamatebako_math",
    groupLabel: "計数",
    units: [
      { id: "math_arithmetic", subCategory: "四則逆算", label: "四則逆算" },
      { id: "math_graphics", subCategory: "図表の読み取り", label: "図表の読み取り" },
      { id: "math_estimation", subCategory: "表の空欄推測", label: "表の空欄推測" },
    ],
  },
  {
    category: "tamatebako_verbal",
    groupLabel: "言語",
    units: [
      { id: "verbal_logic", subCategory: "論理的読解（GAB形式）", label: "論理的読解（GAB形式）" },
      { id: "verbal_judge", subCategory: "趣旨判定（IMAGES形式）", label: "趣旨判定（IMAGES形式）" },
      { id: "verbal_summary", subCategory: "趣旨把握", label: "趣旨把握" },
    ],
  },
  {
    category: "tamatebako_english",
    groupLabel: "英語",
    units: [
      { id: "english_logic", subCategory: "論理的読解（GAB形式）", label: "論理的読解（GAB形式）" },
      { id: "english_summary", subCategory: "長文読解（IMAGES形式）", label: "長文読解（IMAGES形式）" },
    ],
  },
];

const TGWEB_PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "tgweb_verbal",
    groupLabel: "言語",
    units: [
      { id: "tgweb_fill_blank", subCategory: "空欄補充", label: "空欄補充" },
      { id: "tgweb_reorder", subCategory: "並べ替え", label: "並べ替え" },
      { id: "tgweb_reading", subCategory: "長文読解", label: "長文読解" },
    ],
  },
  {
    category: "tgweb_math",
    groupLabel: "計数",
    units: [
      { id: "tgweb_cipher", subCategory: "暗号", label: "暗号" },
      { id: "tgweb_one_stroke", subCategory: "一筆書き", label: "一筆書き" },
      { id: "tgweb_origami", subCategory: "折り紙", label: "折り紙" },
      { id: "tgweb_dice", subCategory: "サイコロ", label: "サイコロ" },
      { id: "tgweb_inference", subCategory: "推論", label: "推論" },
    ],
  },
  {
    category: "tgweb_english",
    groupLabel: "英語",
    units: [
      { id: "tgweb_reading_en", subCategory: "長文読解", label: "長文読解" },
      { id: "tgweb_grammar", subCategory: "文法", label: "文法" },
    ],
  },
];

const SCOA_PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "scoa_language",
    groupLabel: "言語",
    units: [
      {
        id: "scoa_idiom",
        subCategory: "熟語・ことわざ・慣用句・故事成語",
        label: "熟語・ことわざ・慣用句・故事成語",
      },
      { id: "scoa_reading", subCategory: "長文読解", label: "長文読解" },
    ],
  },
  {
    category: "scoa_math",
    groupLabel: "数理",
    units: [
      { id: "scoa_arithmetic", subCategory: "四則計算", label: "四則計算" },
      { id: "scoa_equation", subCategory: "方程式・数列", label: "方程式・数列" },
    ],
  },
  {
    category: "scoa_logic",
    groupLabel: "論理",
    units: [
      { id: "scoa_dice", subCategory: "サイコロ・場合の数", label: "サイコロ・場合の数" },
      { id: "scoa_inference", subCategory: "推論", label: "推論" },
      { id: "scoa_figure", subCategory: "図形", label: "図形" },
    ],
  },
  {
    category: "scoa_common_sense",
    groupLabel: "常識",
    units: [
      { id: "scoa_science", subCategory: "理科", label: "理科" },
      { id: "scoa_social", subCategory: "社会", label: "社会" },
    ],
  },
  {
    category: "scoa_english",
    groupLabel: "英語",
    units: [
      { id: "scoa_word", subCategory: "単語・文法・イディオム", label: "単語・文法・イディオム" },
      { id: "scoa_fill_blank", subCategory: "穴埋め", label: "穴埋め" },
    ],
  },
];

// テスト種別id（src/data/testTypes.tsのTestType.id）ごとの単元グループ。
// 未定義のテスト種別（GAB/C-GAB・CAB）は分野・単元一覧自体をまだ用意していない。
export const PRACTICE_UNIT_GROUPS_BY_TEST: Record<string, PracticeUnitGroup[]> = {
  spi: SPI_PRACTICE_UNIT_GROUPS,
  tamatebako: TAMATEBAKO_PRACTICE_UNIT_GROUPS,
  tgweb: TGWEB_PRACTICE_UNIT_GROUPS,
  scoa: SCOA_PRACTICE_UNIT_GROUPS,
};

export const DEFAULT_TEST_ID = "spi";
