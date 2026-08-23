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
export const MBTI_GROUP_INDUSTRY_AFFINITY: Record<MbtiGroupId, string[]> = {
  analyst: ["コンサル・シンクタンク", "IT・通信・Web", "金融（銀行・証券・保険・投資）"],
  diplomat: ["マスコミ・広告・出版", "サービス・インフラ（運輸・エネルギー・人材・旅行等）", "公的機関・公務員"],
  sentinel: ["金融（銀行・証券・保険・投資）", "公的機関・公務員", "不動産・建設・デベロッパー"],
  explorer: [
    "商社（総合・専門）",
    "メーカー（自動車・食品・化学・製薬等）",
    "サービス・インフラ（運輸・エネルギー・人材・旅行等）",
  ],
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
