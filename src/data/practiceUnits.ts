// 練習問題モードの「分野・単元選択」画面に表示する単元一覧（性格検査は対象外）。
// subCategory は questions.sub_category と完全一致する値を指定する（DBに実データが無い単元は0問として表示される）。
// id は単元を一意に識別するための内部キー（React key・将来の問題作成ツール等での参照用。DBには保存しない）。
// category はテスト種別ごとに専用のプレフィックス付き文字列を使う（例: SPIの"non_verbal"、玉手箱の"tamatebako_math"）。
// 同じ大分類名（"言語"等）でもテストごとに出題内容が異なるため、カテゴリ別分析等で混同しないよう分けている。
export type PracticeUnit = {
  id: string;
  subCategory: string;
  label: string;
  // trueの単元は「スキマ暗記復習」（ダッシュボードの全テスト横断カード）の対象になる。
  // 判定基準は「スマホの移動中に1問単位でサクッと解ける暗記・知識系単元」で、長文読解など
  // まとまった文章を読む必要がある単元（同じ言語・英語カテゴリでも）は対象外とする。
  memorization?: boolean;
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
      { id: "word_relation", subCategory: "二語の関係", label: "二語の関係", memorization: true },
      {
        id: "idiom_structure",
        subCategory: "熟語の成り立ち",
        label: "熟語の成り立ち",
        memorization: true,
      },
      { id: "vocabulary", subCategory: "語彙", label: "語彙・意味", memorization: true },
      { id: "word_usage", subCategory: "語句の用法", label: "語句の用法", memorization: true },
      {
        id: "sentence_reorder",
        subCategory: "文の並べ替え",
        label: "文の並べ替え",
        memorization: true,
      },
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
      {
        id: "english_vocab",
        subCategory: "語意（同意語・反意語）",
        label: "語意（同意語・反意語）",
        memorization: true,
      },
      { id: "english_dictionary", subCategory: "英英辞典", label: "英英辞典", memorization: true },
      { id: "english_fill_blank", subCategory: "空欄補充", label: "空欄補充", memorization: true },
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

// TG-WEBは「従来型」（高難易度・パズル的思考）と「新型」（スピード重視）で出題内容が
// まったく異なるため、単元選択もこの2形式＋共通の言語・英語の系統に分けて構成する
// （src/data/testExplainers.tsの「各形式の問題数と制限時間」解説と対応）。
// 「長文読解」は従来型・新型どちらの言語問題でも実質同じ形式（内容真偽判定）のため、
// 英語（共通・英語）と同様に両形式で分けず、独立した「共通・言語」グループの1単元として管理する。
const TGWEB_PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "tgweb_traditional_verbal",
    groupLabel: "従来型・言語",
    units: [
      { id: "tgweb_trad_fill_blank", subCategory: "空欄補充", label: "空欄補充", memorization: true },
      { id: "tgweb_trad_reorder", subCategory: "並べ替え", label: "並べ替え", memorization: true },
    ],
  },
  {
    category: "tgweb_traditional_math",
    groupLabel: "従来型・非言語",
    units: [
      { id: "tgweb_trad_cipher", subCategory: "暗号", label: "暗号" },
      { id: "tgweb_trad_figure", subCategory: "図形問題", label: "図形問題" },
      { id: "tgweb_trad_inference", subCategory: "推論", label: "推論" },
    ],
  },
  {
    category: "tgweb_new_verbal",
    groupLabel: "新型・言語",
    units: [
      { id: "tgweb_new_synonym", subCategory: "同義語・対義語", label: "同義語・対義語", memorization: true },
      { id: "tgweb_new_proverb", subCategory: "ことわざ・慣用句", label: "ことわざ・慣用句", memorization: true },
      { id: "tgweb_new_yoji", subCategory: "四字熟語", label: "四字熟語", memorization: true },
    ],
  },
  {
    category: "tgweb_new_math",
    groupLabel: "新型・非言語",
    units: [
      { id: "tgweb_new_arithmetic", subCategory: "四則演算", label: "四則演算" },
      { id: "tgweb_new_graphics", subCategory: "図表の読み取り", label: "図表の読み取り" },
    ],
  },
  {
    category: "tgweb_verbal_reading",
    groupLabel: "共通・言語",
    units: [{ id: "tgweb_common_reading_ja", subCategory: "長文読解", label: "長文読解" }],
  },
  {
    category: "tgweb_english",
    groupLabel: "共通・英語",
    units: [{ id: "tgweb_common_reading_en", subCategory: "長文問題", label: "長文問題" }],
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
        memorization: true,
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
      {
        id: "scoa_pattern_concentration",
        subCategory: "規則性・濃度算",
        label: "規則性・濃度算",
      },
    ],
  },
  {
    category: "scoa_logic",
    groupLabel: "論理",
    units: [
      { id: "scoa_dice", subCategory: "場合の数確率", label: "場合の数確率" },
      { id: "scoa_inference", subCategory: "推論", label: "推論" },
    ],
  },
  {
    category: "scoa_common_sense",
    groupLabel: "常識",
    units: [
      { id: "scoa_science", subCategory: "理科", label: "理科", memorization: true },
      { id: "scoa_social", subCategory: "社会", label: "社会", memorization: true },
    ],
  },
  {
    category: "scoa_english",
    groupLabel: "英語",
    units: [
      {
        id: "scoa_word",
        subCategory: "文法・語彙・イディオム・アクセント",
        label: "文法・語彙・イディオム・アクセント",
        memorization: true,
      },
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

// category（大分類）→ テスト種別id の逆引きマップ。practice/page.tsxで、問題のrawCategoryから
// 実際にどのテストの回答として記録すべきかを判定するために使う
// （スキマ暗記復習は複数テストの問題が混在するため、テストごとに分けて保存する必要がある）。
export const CATEGORY_TO_TEST_ID: Record<string, string> = Object.fromEntries(
  Object.entries(PRACTICE_UNIT_GROUPS_BY_TEST).flatMap(([testId, groups]) =>
    groups.map((group) => [group.category, testId])
  )
);

// 「スキマ暗記復習」（ダッシュボードの全テスト横断カード）の対象単元一覧を
// {category, subCategory} のペアで返す。バックエンド（functions/api/practice/history.ts）から
// SQLのWHERE条件を組み立てるために使う。
export function getMemorizationUnitKeys(): { category: string; subCategory: string }[] {
  return Object.values(PRACTICE_UNIT_GROUPS_BY_TEST).flatMap((groups) =>
    groups.flatMap((group) =>
      group.units
        .filter((unit) => unit.memorization)
        .map((unit) => ({ category: group.category, subCategory: unit.subCategory }))
    )
  );
}
