export type TestType = {
  id: string;
  name: string;
  href: string;
  available: boolean;
};

export const TEST_TYPES: TestType[] = [
  { id: "spi", name: "SPI3", href: "/test", available: true },
  // 玉手箱の本番模試は、言語（論理的読解GAB形式15分32問）・計数（四則逆算9分50問＋図表の読み取り
  // 15分29問）・英語（論理的読解GAB形式10分24問）の4セクション（app/test/page.tsxの
  // EXAM_PARTS.tamatebako参照）。GAB/C-GABと同様の単一test_type・SectionedExamFlow構成。
  { id: "tamatebako", name: "玉手箱", href: "/test?part=tamatebako", available: true },
  // TG-WEBの本番模試は「従来型」「新型」の2パートに分けて受験する仕様のため、SPIと同様に
  // hrefは直接使わずExamModeSelectModal.tsxのisTgweb分岐（TGWEB_EXAM_PARTS）でルーティングする
  // （app/test/page.tsxのEXAM_PARTS.tgweb_traditional / tgweb_new参照）。
  { id: "tgweb", name: "TG-WEB", href: "/test", available: true },
  // GAB/C-GABの本番模試は、言語理解15分32問・計数理解15分29問・英語10分24問の3セクション
  // （app/test/page.tsxのEXAM_PARTS.gab_cgab参照）。SCOAと同様、出題対象は練習問題プールとは別に
  // 確保した本番模試専用の問題プール（questions.is_mock_only=1）のみ。
  { id: "gab_cgab", name: "GAB / C-GAB", href: "/test?part=gab_cgab", available: true },
  { id: "cab", name: "CAB", href: "/test", available: false },
  // SCOAの本番模試は、言語・数理・論理・常識・英語の全分野を対象にした単一パートとして提供する
  // （app/test/page.tsxのEXAM_PARTS.scoa参照）。出題対象は練習問題プールとは別に確保した
  // 本番模試専用の問題プール（questions.is_mock_only=1）のみで、各分野からランダム抽出済み。
  { id: "scoa", name: "SCOA", href: "/test?part=scoa", available: true },
];

export type ExamPartInfo = { id: string; label: string };

// SPI・TG-WEBは単一のtest_typeではなく、パートごとに独立した受験可否（2ヶ月に1回リセット）を
// 持つ複数のtest_type（app/test/page.tsxのEXAM_PARTS参照）に分かれている。ExamModeSelectModal.tsx
// （各パートの個別ボタン表示）とapp/dashboard/page.tsx（試験カードの受験状況サマリー表示）の
// 両方から参照するため、ここに一本化する（分散定義するとドリフトの原因になるため）。
export const SPI_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "spi_basic", label: "基礎能力試験（言語・非言語）" },
  { id: "spi_english", label: "英語" },
  { id: "spi_structural", label: "構造把握" },
];

export const TGWEB_EXAM_PARTS: readonly ExamPartInfo[] = [
  { id: "tgweb_traditional", label: "従来型" },
  { id: "tgweb_new", label: "新型" },
];

// TestType.id → その複数パートのtest_type一覧。単一パートのテスト種別（gab_cgab, scoa,
// tamatebako等）はここに含まれず、TestType.idそのものがtest_typeとして扱われる。
export const MULTI_PART_EXAM_PARTS: Record<string, readonly ExamPartInfo[]> = {
  spi: SPI_EXAM_PARTS,
  tgweb: TGWEB_EXAM_PARTS,
};
