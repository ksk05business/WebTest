export type TestType = {
  id: string;
  name: string;
  href: string;
  available: boolean;
};

export const TEST_TYPES: TestType[] = [
  { id: "spi", name: "SPI3", href: "/test", available: true },
  // 玉手箱・TG-WEB・GAB/C-GABはいずれも形式・セクションごとに個別選択して受験する複数パート方式
  // （SPIと同様、hrefは使わずExamModeSelectModal.tsxのisMultiPart分岐でMULTI_PART_EXAM_PARTSを
  // 参照してルーティングする。app/test/page.tsxのEXAM_PARTS参照）。
  { id: "tamatebako", name: "玉手箱", href: "/test", available: true },
  { id: "tgweb", name: "TG-WEB", href: "/test", available: true },
  { id: "gab_cgab", name: "GAB / C-GAB", href: "/test", available: true },
  { id: "cab", name: "Web-CAB", href: "/test", available: false },
  // SCOAの本番模試は、言語・数理・論理・常識・英語の全分野を横断する単一の統合模試として提供する
  // （app/test/page.tsxのEXAM_PARTS.scoa参照、全120問・60分）。出題対象は練習問題プールとは別に
  // 確保した本番模試専用の問題プール（questions.is_mock_only=1）のみで、各分野からランダム抽出済み。
  { id: "scoa", name: "SCOA", href: "/test?part=scoa", available: true },
];

export type ExamPartInfo = { id: string; label: string };

// SPI・玉手箱・TG-WEB・GAB/C-GABは単一のtest_typeではなく、形式・セクションごとに独立した
// 受験可否（2ヶ月に1回リセット）とタイマーを持つ複数のtest_type（app/test/page.tsxのEXAM_PARTS
// 参照）に分かれている。ExamModeSelectModal.tsx（各パートの個別ボタン表示）とapp/dashboard/page.tsx
// （試験カードの受験状況サマリー表示）の両方から参照するため、ここに一本化する
// （分散定義するとドリフトの原因になるため）。
export const SPI_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "spi_basic", label: "基礎能力試験（言語・非言語）" },
  { id: "spi_english", label: "英語" },
  { id: "spi_structural", label: "構造把握" },
];

export const TAMATEBAKO_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "tamatebako_math_arithmetic", label: "計数・四則計算（50問/9分）" },
  { id: "tamatebako_math_graph", label: "計数・図表読取（29問/15分）" },
  { id: "tamatebako_math_table", label: "計数・表推測（20問/20分）" },
  { id: "tamatebako_verbal_gab", label: "言語・論理的読解 GAB形式（32問/15分）" },
  { id: "tamatebako_verbal_images", label: "言語・趣旨判定 IMAGES形式（32問/10分）" },
  { id: "tamatebako_verbal_summary", label: "言語・趣旨把握（10問/12分）" },
  { id: "tamatebako_english_gab", label: "英語・論理的読解 GAB形式（24問/10分）" },
  { id: "tamatebako_english_images", label: "英語・長文読解 IMAGES形式（24問/10分）" },
];

export const TGWEB_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "tgweb_traditional_verbal", label: "従来型・言語（12問/12分）" },
  { id: "tgweb_traditional_nonverbal", label: "従来型・非言語（9問/18分）" },
  { id: "tgweb_new_verbal", label: "新型・言語（34問/7分）" },
  { id: "tgweb_new_nonverbal", label: "新型・非言語（36問/8分）" },
  { id: "tgweb_english", label: "英語（従来型・新型共通、10問/15分）" },
];

export const GAB_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "gab_verbal_exam", label: "言語理解（32問/15分）" },
  { id: "gab_quantitative_exam", label: "計数理解（29問/15分、電卓使用不可）" },
  { id: "gab_english_exam", label: "英語（24問/10分）" },
];

// TestType.id → その複数パートのtest_type一覧。単一パートのテスト種別（scoa等）はここに含まれず、
// TestType.idそのものがtest_typeとして扱われる。
export const MULTI_PART_EXAM_PARTS: Record<string, readonly ExamPartInfo[]> = {
  spi: SPI_EXAM_PARTS,
  tamatebako: TAMATEBAKO_EXAM_PARTS,
  tgweb: TGWEB_EXAM_PARTS,
  gab_cgab: GAB_EXAM_PARTS,
};
