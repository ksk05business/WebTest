export type TestType = {
  id: string;
  name: string;
  href: string;
  available: boolean;
};

export const TEST_TYPES: TestType[] = [
  { id: "spi", name: "SPI3", href: "/test", available: true },
  { id: "tamatebako", name: "玉手箱", href: "/test", available: false },
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
