export type TestType = {
  id: string;
  name: string;
  href: string;
  available: boolean;
};

export const TEST_TYPES: TestType[] = [
  { id: "spi", name: "SPI3", href: "/test", available: true },
  { id: "tamatebako", name: "玉手箱", href: "/test", available: false },
  { id: "tgweb", name: "TG-WEB", href: "/test", available: false },
  { id: "gab_cgab", name: "GAB / C-GAB", href: "/test", available: false },
  { id: "cab", name: "CAB", href: "/test", available: false },
  // SCOAの本番模試は、実データがある言語分野（scoa_language: 熟語・ことわざ・慣用句・故事成語＋長文読解）
  // のみの単一パートとして提供する（app/test/page.tsxのEXAM_PARTS.scoa参照）。数理・論理・常識・英語は
  // 実データが無いため準備中のまま。
  { id: "scoa", name: "SCOA", href: "/test?part=scoa", available: true },
];
