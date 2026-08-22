// 試験モード選択モーダル（ExamModeSelectModal）内の「〜とは？」アコーディオンに表示する解説。
// テスト種別id（src/data/testTypes.tsのTestType.id）ごとに定義する。未定義のテストはアコーディオンを表示しない。
export type TestExplainerListGroup = {
  label: string;
  items: string[];
};

export type TestExplainerSection = {
  title: string;
  body?: string;
  groups?: TestExplainerListGroup[];
};

export type TestExplainer = {
  heading: string;
  sections: TestExplainerSection[];
};

export const TEST_EXPLAINERS: Record<string, TestExplainer> = {
  spi: {
    heading: "SPI3とは？（特徴・形式の解説）",
    sections: [
      {
        title: "概要",
        body: "日本リクルートマネジメントソリューションズ社が提供する、就活で最もポピュラーな適性検査です。",
      },
      {
        title: "受験形式",
        body: "テストセンター、インハウスCBT、WEBテスティング、ペーパーテスト",
      },
      {
        title: "出題領域",
        body: "能力検査（非言語・言語・構造的把握・英語）。※性格検査は当アプリの対象外です。",
      },
      {
        title: "対策ポイント",
        body: "誤謬率（間違いの割合）は測定されないため、「解ける問題を確実に素早く解く」ことが重要です。",
      },
    ],
  },
  tamatebako: {
    heading: "玉手箱とは？（特徴・形式の解説）",
    sections: [
      {
        title: "概要",
        body: "日本SHL株式会社が提供するWebテストで、SPIと並んで多くの企業に採用されている代表的な適性検査です。",
      },
      {
        title: "受験形式",
        body: "自宅受検型のWebテスティング（電卓持ち込み可）と、専用会場のPCで受検するC-GAB（画面上電卓のみ可）が中心です。",
      },
      {
        title: "出題領域",
        body: "能力検査（計数・言語・英語）。※性格検査は当アプリの対象外です。",
      },
      {
        title: "各形式の問題数と制限時間",
        groups: [
          {
            label: "計数",
            items: ["四則計算: 50問 / 9分", "図表読取: 29問 / 15分", "表推測: 20問 / 20分"],
          },
          {
            label: "言語",
            items: [
              "論理的読解（GAB形式）: 32問 / 15分",
              "趣旨判定（IMAGES形式）: 32問 / 10分",
              "趣旨把握: 10問 / 12分",
            ],
          },
          {
            label: "英語",
            items: ["論理的読解（GAB形式）: 24問 / 10分", "長文読解（IMAGES形式）: 24問 / 10分"],
          },
        ],
      },
      {
        title: "対策ポイント",
        body: "いずれの形式も1問あたりの時間が非常に短く、同一形式が連続して出題されるのが特徴です。解き方パターンを事前に把握し、スピード重視で回答する処理能力を鍛えましょう。",
      },
    ],
  },
};
