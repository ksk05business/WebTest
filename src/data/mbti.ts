// MBTI（16タイプ性格診断）関連の定義。
// DB（users.mbti）にはコード文字列（例: "ENTJ"）のみを保存し、画面表示時は本ファイルの
// マッピングを介して「ENTJ (指揮官)」のような通称和名付き表記へ変換する。
// フロント・Cloudflare Pages Functions（functions/api/*）の双方から参照する。

export type MbtiGroupId = "analyst" | "diplomat" | "sentinel" | "explorer";

export type MbtiType = {
  code: string;
  nickname: string;
  group: MbtiGroupId;
};

export const MBTI_GROUP_LABELS: Record<MbtiGroupId, string> = {
  analyst: "分析家",
  diplomat: "外交官",
  sentinel: "管理者",
  explorer: "探検家",
};

export const MBTI_GROUP_ORDER: MbtiGroupId[] = ["analyst", "diplomat", "sentinel", "explorer"];

export const MBTI_TYPES: MbtiType[] = [
  { code: "INTJ", nickname: "建築家", group: "analyst" },
  { code: "INTP", nickname: "論理学者", group: "analyst" },
  { code: "ENTJ", nickname: "指揮官", group: "analyst" },
  { code: "ENTP", nickname: "討論者", group: "analyst" },
  { code: "INFJ", nickname: "提唱者", group: "diplomat" },
  { code: "INFP", nickname: "仲介者", group: "diplomat" },
  { code: "ENFJ", nickname: "主人公", group: "diplomat" },
  { code: "ENFP", nickname: "運動家", group: "diplomat" },
  { code: "ISTJ", nickname: "管理者", group: "sentinel" },
  { code: "ISFJ", nickname: "擁護者", group: "sentinel" },
  { code: "ESTJ", nickname: "幹部", group: "sentinel" },
  { code: "ESFJ", nickname: "領事", group: "sentinel" },
  { code: "ISTP", nickname: "巨匠", group: "explorer" },
  { code: "ISFP", nickname: "冒険家", group: "explorer" },
  { code: "ESTP", nickname: "起業家", group: "explorer" },
  { code: "ESFP", nickname: "エンターテイナー", group: "explorer" },
];

const MBTI_MAP: Record<string, MbtiType> = Object.fromEntries(MBTI_TYPES.map((t) => [t.code, t]));

export function isValidMbtiCode(value: string): boolean {
  return value in MBTI_MAP;
}

// "ENTJ (指揮官)" 形式のラベルを返す。未登録・不正な値・null/undefinedの場合はnullを返す。
export function getMbtiLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const t = MBTI_MAP[code];
  return t ? `${t.code} (${t.nickname})` : null;
}

export function getMbtiGroup(code: string | null | undefined): MbtiGroupId | null {
  if (!code) return null;
  return MBTI_MAP[code]?.group ?? null;
}

export function getMbtiGroupLabel(code: string | null | undefined): string | null {
  const group = getMbtiGroup(code);
  return group ? MBTI_GROUP_LABELS[group] : null;
}

// MBTIグループ系統ごとに、一般的なキャリア適性の傾向として親和性が高いとされる業界
// （src/data/formOptions.tsのINDUSTRIESに準拠）。企業側の候補者検索で、検索対象の業界と
// 親和性のあるMBTIグループの候補者を上位表示する「マッチング補正」に用いる。
// ※あくまで一般的な性格類型論に基づく傾向であり、個人の適性を断定するものではない。
// 2026-09-03の志望業界細分化（src/data/formOptions.tsのINDUSTRY_GROUPS、大分類10グループ・
// 計38業種）に合わせ、各MBTIグループと親和性のある業界を葉ノード単位で列挙する
// （旧: 大分類10種類のフラット値を直接列挙していたが、細分化後の値と一致しなくなるため更新）。
export const MBTI_GROUP_INDUSTRY_AFFINITY: Record<MbtiGroupId, string[]> = {
  analyst: [
    "戦略コンサル",
    "外資系総合コンサル",
    "日系総合コンサル",
    "インターネット",
    "情報システム・通信・その他IT",
    "外資系金融",
    "日系投資運用",
  ],
  diplomat: [
    "広告代理店",
    "テレビ局",
    "新聞・出版・通信社",
    "その他メディア",
    "人材・教育",
    "旅行代理店",
    "国家公務員",
    "地方公務員",
    "公的機関・公益法人",
  ],
  sentinel: [
    "メガバンク",
    "日系証券・保険",
    "公的金融",
    "国家公務員",
    "地方公務員",
    "不動産（デベロッパー）",
    "建設",
  ],
  explorer: ["総合商社", "専門商社", "自動車", "食品", "アパレル", "運輸", "小売・サービス"],
};

// 指定した業界群のいずれかと親和性のあるMBTIグループに属するコード一覧を返す。
// 企業側検索で業界フィルターが指定された際に、マッチング補正の対象コードを求めるために使う。
export function getAffinityMbtiCodes(industries: string[]): string[] {
  if (industries.length === 0) return [];
  const groups = MBTI_GROUP_ORDER.filter((group) =>
    MBTI_GROUP_INDUSTRY_AFFINITY[group].some((industry) => industries.includes(industry))
  );
  return MBTI_TYPES.filter((t) => groups.includes(t.group)).map((t) => t.code);
}
