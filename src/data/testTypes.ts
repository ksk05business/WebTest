export type TestType = {
  id: string;
  name: string;
  href: string;
  available: boolean;
};

export const TEST_TYPES: TestType[] = [
  { id: "spi", name: "SPI", href: "/test", available: true },
  { id: "tamatebako", name: "玉手箱", href: "/test", available: false },
  { id: "tgweb", name: "TG-WEB", href: "/test", available: false },
  { id: "gab", name: "GAB", href: "/test", available: false },
  { id: "cgab", name: "C-GAB", href: "/test", available: false },
  { id: "cab", name: "CAB", href: "/test", available: false },
];
