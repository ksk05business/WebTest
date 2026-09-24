import { TEST_TYPES } from "./testTypes";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "./practiceUnits";
import { INDUSTRY_GROUPS } from "./formOptions";

// ブログ記事（/blog）のタグ管理を、自由入力ではなく4階層のタクソノミー（分類体系）に固定するための
// マスターデータ。管理画面のタグ選択UI（src/components/admin/TagTaxonomyPicker.tsx）が参照する。
//
// 階層構造:
//   第1階層: "Webテスト対策" | "企業" | "その他"
//   第2階層（Webテスト対策配下）: テスト種類（SPI3・玉手箱・TG-WEB等）
//   第3階層（テスト種類配下）: 科目（言語・非言語・英語等）
//   第4階層（科目配下）: 単元・問題形式（推論・語句の用法等）
//   第2階層（企業配下）: 業界（コンサル・M&A、金融等）
//   第3階層（業界配下）: 企業名
//
// "Webテスト対策"配下は、テスト種類・科目・単元の一覧を独自に持たず
// src/data/testTypes.ts（TEST_TYPES）とsrc/data/practiceUnits.ts（PRACTICE_UNIT_GROUPS_BY_TEST）
// からそのまま構築する。これらのマスターデータが変更・追加された場合、タグの選択肢も
// 自動的に追従する（別々に保守すると単元名などがドリフトする恐れがあるため、二重管理を避ける）。
export type TagNode = {
  label: string;
  children?: TagNode[];
};

const WEBTEST_BRANCH: TagNode = {
  label: "Webテスト対策",
  children: TEST_TYPES.map((testType) => {
    const groups = PRACTICE_UNIT_GROUPS_BY_TEST[testType.id] ?? [];
    return {
      label: testType.name,
      children:
        groups.length > 0
          ? groups.map((group) => ({
              label: group.groupLabel,
              children: group.units.map((unit) => ({ label: unit.label })),
            }))
          : undefined,
    };
  }),
};

// 業界配下の企業名一覧。src/data/formOptions.tsのINDUSTRY_GROUPS（学生の志望業界選択肢、
// より細かい38業種）とは異なり、タグとして選ぶ「業界」はブログ記事のテーマとして扱いやすい
// 粒度（INDUSTRY_GROUPSのgroup単位、10分類）に合わせている。企業名は各業界を代表する
// 知名度の高い企業を中心に、キリの良い数だけ例示的に列挙したものであり、網羅的な企業一覧
// （company_bordersテーブルの掲載企業）とは独立した別データである。
const COMPANIES_BY_INDUSTRY_GROUP: Record<string, string[]> = {
  "コンサル・M&A": [
    "マッキンゼー・アンド・カンパニー",
    "ボストンコンサルティンググループ",
    "ベイン・アンド・カンパニー",
    "PwCコンサルティング",
    "デロイト トーマツ コンサルティング",
    "アクセンチュア",
    "野村総合研究所",
  ],
  金融: [
    "三菱UFJ銀行",
    "三井住友銀行",
    "みずほ銀行",
    "野村證券",
    "大和証券",
    "東京海上日動火災保険",
    "第一生命保険",
  ],
  商社: ["三菱商事", "伊藤忠商事", "三井物産", "住友商事", "丸紅"],
  外資系企業: ["P&Gジャパン", "ユニリーバ・ジャパン", "グーグル", "マイクロソフト", "アマゾンジャパン"],
  日系メーカー: ["トヨタ自動車", "本田技研工業", "日産自動車", "資生堂", "パナソニック ホールディングス", "ソニーグループ"],
  "日系IT・通信": ["楽天グループ", "サイバーエージェント", "LINEヤフー", "NTTデータ", "富士通"],
  "日系サービス・インフラ": ["JR東日本", "ANAホールディングス", "リクルート", "イオン", "東京電力ホールディングス"],
  "不動産・建設": ["三井不動産", "三菱地所", "住友不動産", "大林組"],
  "マスコミ・広告": ["電通", "博報堂", "朝日新聞社", "日本テレビ放送網"],
  "公的機関・その他": ["日本銀行", "国際協力機構"],
};

const COMPANY_BRANCH: TagNode = {
  label: "企業",
  children: INDUSTRY_GROUPS.map((group) => ({
    label: group.group,
    children: (COMPANIES_BY_INDUSTRY_GROUP[group.group] ?? []).map((name) => ({ label: name })),
  })),
};

export const TAG_TAXONOMY: TagNode[] = [WEBTEST_BRANCH, COMPANY_BRANCH, { label: "その他" }];

// /blog（一般向け）・/admin/dashboard「ブログ記事管理」タブ共通の2階層フィルター用。
// 第1階層は固定9カテゴリー（すべて＋テスト種類8区分）で、TAG_TAXONOMYの第1階層
// （Webテスト対策/企業/その他）だけでは記事のほぼ全てが「Webテスト対策」に一括りにされて
// 絞り込みの意味をなさないため、こちらを使う。記事のtagsフロントマターは過去に自由入力で
// 付けられてきた経緯があり、"SPI"と"SPI3"、"GAB"と"C-GAB"のように表記揺れがある
// （TEST_TYPES.nameと厳密一致しない）ため、カテゴリーごとに別名（エイリアス）を吸収する。
// 新記事を書くたびに過去記事のtagsを一括修正するリスクを避けるための対応。
const BLOG_CATEGORY_ALIASES: { label: string; aliases: string[] }[] = [
  { label: "SPI", aliases: ["SPI", "SPI3"] },
  { label: "玉手箱", aliases: ["玉手箱"] },
  { label: "TG-WEB", aliases: ["TG-WEB"] },
  { label: "GAB", aliases: ["GAB", "C-GAB", "GAB / C-GAB"] },
  { label: "CAB", aliases: ["CAB", "Web-CAB"] },
  { label: "SCOA", aliases: ["SCOA"] },
  { label: "企業", aliases: ["企業"] },
];

// 第1階層チップの固定の並び順（"すべて"はUI側で別途先頭に足す）。
export const BLOG_CATEGORY_ORDER: string[] = [...BLOG_CATEGORY_ALIASES.map((c) => c.label), "その他"];

// 記事のtagsから、フィルターの第1階層チップに表示する1つのラベルを決める。
// いずれのエイリアスにも一致しなければ「その他」に倒す。
export function getBlogCategoryLabel(tags: string[]): string {
  const match = BLOG_CATEGORY_ALIASES.find((c) => c.aliases.some((alias) => tags.includes(alias)));
  return match?.label ?? "その他";
}

// 第2階層（サブタグ）のチップから除外する、どのカテゴリーにも属さない汎用タグ。
// これらは記事の中身を区別する情報を持たない（ほぼ全記事に付いている）ため、
// サブタグとして出しても絞り込みの役に立たない。
const BLOG_SUBTAG_NOISE = new Set(["Webテスト対策", "無料", "非言語", "言語", "従来型", "新型"]);

// 指定カテゴリー配下の記事群から、第2階層（サブタグ）の候補を使用頻度順に集計する。
// カテゴリー自身を表すタグ（"TG-WEB"や、そのエイリアスである"SPI3"等）は、選んでも
// 絞り込みが変化せず無意味なので候補から除く。"すべて"のときは全カテゴリー名も含めて
// 汎用ノイズタグだけを除外する（テスト種類の判別に使えるタグとして残す）。
export function getBlogSubtags(
  posts: { tags: string[] }[],
  category: string,
): { tag: string; count: number }[] {
  const excludeAsCategorySelf =
    category === "すべて" ? new Set<string>() : new Set(BLOG_CATEGORY_ALIASES.find((c) => c.label === category)?.aliases ?? [category]);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (BLOG_SUBTAG_NOISE.has(tag) || excludeAsCategorySelf.has(tag)) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
