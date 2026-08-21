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
  { id: "scoa", name: "SCOA", href: "/test", available: false },
];
