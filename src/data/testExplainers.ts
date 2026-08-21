// 試験モード選択モーダル（ExamModeSelectModal）内の「〜とは？」アコーディオンに表示する解説。
// テスト種別id（src/data/testTypes.tsのTestType.id）ごとに定義する。未定義のテストはアコーディオンを表示しない。
export type TestExplainerSection = {
  title: string;
  body: string;
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
        body: "自宅受検型のWebテスティング（電卓の持ち込み可）と、テストセンターで受検するC-GAB（画面上の電卓のみ使用可）が中心です。実施形式は企業により異なります。",
      },
      {
        title: "出題領域",
        body: "能力検査（計数・言語・英語）。※性格検査は当アプリの対象外です。",
      },
      {
        title: "対策ポイント",
        body: "同一形式の問題が連続して出題され、1問あたりの回答時間が非常に短いのが特徴です。形式ごとの解き方パターンを覚え、スピード重視で対策しましょう。",
      },
    ],
  },
};
