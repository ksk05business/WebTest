// 練習問題モードの「分野・単元選択」画面に表示する単元一覧（性格検査は対象外）。
// subCategory は questions.sub_category と完全一致する値を指定する（DBに実データが無い単元は0問として表示される）。
// id は単元を一意に識別するための内部キー（React key・将来の問題作成ツール等での参照用。DBには保存しない）。
export type PracticeUnit = {
  id: string;
  subCategory: string;
  label: string;
};

export type PracticeUnitGroup = {
  category: "non_verbal" | "verbal" | "structural" | "english";
  groupLabel: string;
  units: PracticeUnit[];
};

export const PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
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
      { id: "fill_blank_reorder", subCategory: "空欄補充・文の並べ替え", label: "空欄補充・文の並べ替え" },
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
