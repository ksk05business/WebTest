// 練習問題モードの「分野・単元選択」画面に表示する単元一覧（性格検査は対象外）。
// subCategory は questions.sub_category と完全一致する値を指定する（DBに実データが無い単元は0問として表示される）。
export type PracticeUnit = {
  subCategory: string;
  label: string;
};

export type PracticeUnitGroup = {
  category: "non_verbal" | "verbal" | "structural";
  groupLabel: string;
  units: PracticeUnit[];
};

export const PRACTICE_UNIT_GROUPS: PracticeUnitGroup[] = [
  {
    category: "non_verbal",
    groupLabel: "非言語（能力）",
    units: [
      { subCategory: "推論", label: "推論" },
      { subCategory: "損益算", label: "損益計算" },
      { subCategory: "集合", label: "集合" },
      { subCategory: "割合・確率", label: "割合・確率" },
      { subCategory: "資料の読み取り", label: "表の読み取り" },
    ],
  },
  {
    category: "verbal",
    groupLabel: "言語（能力）",
    units: [
      { subCategory: "二語の関係", label: "二語の関係" },
      { subCategory: "熟語の成り立ち", label: "熟語の成り立ち" },
      { subCategory: "語彙", label: "語彙・意味" },
      { subCategory: "長文読解", label: "長文読解" },
    ],
  },
  {
    category: "structural",
    groupLabel: "構造的把握力",
    units: [
      { subCategory: "文章の構造化", label: "文章の構造化" },
      { subCategory: "分類・グループ化", label: "分類・グループ化" },
    ],
  },
];
