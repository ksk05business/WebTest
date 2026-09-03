// 問題ごとの「目標解答時間（目安）」。questionsテーブル自体にはカラムを追加せず、
// テスト形式・単元（category/sub_category）ごとの定数マップとして定義する
// （既存の全問題データにマイグレーション不要で適用できるため）。
// 優先順位: sub_category単位の個別指定 > category単位のデフォルト > グローバルデフォルト。
// 数値はいずれも一般的な体感目安の仮の秒数（知識再生系は短め、計算・読解系は長め）。

const CATEGORY_DEFAULT_SECONDS: Record<string, number> = {
  // SPI3
  verbal: 20,
  non_verbal: 60,
  english: 20,
  structural: 60,
  // 玉手箱
  tamatebako_math: 60,
  tamatebako_verbal: 90,
  tamatebako_english: 90,
  // TG-WEB
  tgweb_traditional_verbal: 20,
  tgweb_verbal_reading: 90,
  tgweb_traditional_math: 60,
  tgweb_new_verbal: 15,
  tgweb_new_math: 45,
  tgweb_english: 90,
  // GAB/C-GAB
  gab_verbal: 90,
  gab_quantitative: 60,
  gab_english: 90,
  // SCOA
  scoa_language: 30,
  scoa_math: 60,
  scoa_logic: 60,
  scoa_english: 30,
  scoa_common_sense: 20,
};

// "category::sub_category" 単位の個別指定。同じcategory内でも単元の性質が大きく異なる場合に使う。
const SUBCATEGORY_OVERRIDE_SECONDS: Record<string, number> = {
  // SPI3 言語（語彙等の知識再生は短め、長文読解は長め）
  "verbal::語彙": 15,
  "verbal::二語の関係": 15,
  "verbal::熟語の成り立ち": 20,
  "verbal::語句の用法": 20,
  "verbal::文の並べ替え": 45,
  "verbal::長文読解": 90,
  // SPI3 非言語
  "non_verbal::推論": 60,
  "non_verbal::損益算": 60,
  "non_verbal::場合の数・確率": 60,
  "non_verbal::資料の読み取り": 60,
  "non_verbal::集合": 45,
  "non_verbal::仕事算": 60,
  "non_verbal::速さ・時間・距離": 60,
  "non_verbal::割合・比": 45,
  "non_verbal::濃度算": 60,
  "non_verbal::分割払い": 45,
  // SPI3 英語
  "english::語意（同意語・反意語）": 15,
  "english::空欄補充": 20,
  "english::英英辞典": 20,
  "english::長文読解（英語）": 90,
  // TG-WEB
  "tgweb_traditional_math::暗号": 90,
  "tgweb_traditional_math::図形問題": 60,
  // GAB/C-GAB
  "gab_verbal::論理的読解": 90,
  "gab_quantitative::資料の読み取り": 60,
  "gab_english::長文読解": 90,
  // 玉手箱
  "tamatebako_math::四則逆算": 20,
  "tamatebako_math::図表の読み取り": 60,
  "tamatebako_math::表の空欄推測": 45,
  "tamatebako_verbal::論理的読解（GAB形式）": 90,
  "tamatebako_verbal::趣旨判定（IMAGES形式）": 90,
  "tamatebako_verbal::趣旨把握": 60,
  "tamatebako_english::論理的読解（GAB形式）": 90,
  "tamatebako_english::長文読解（IMAGES形式）": 90,
  // SCOA
  "scoa_language::漢字・語句・熟語・ことわざ・慣用句": 20,
  "scoa_language::長文読解": 60,
  "scoa_math::四則計算": 30,
  "scoa_logic::論理（推論・命題・ベン図・暗号・順序）": 60,
  "scoa_logic::サイコロ・空間図形": 45,
  "scoa_common_sense::社会": 15,
  "scoa_common_sense::理科": 15,
};

export const DEFAULT_TARGET_TIME_SECONDS = 60;

export function getTargetTimeSeconds(category: string | undefined, subCategory: string | undefined): number {
  if (category && subCategory) {
    const key = `${category}::${subCategory}`;
    if (key in SUBCATEGORY_OVERRIDE_SECONDS) return SUBCATEGORY_OVERRIDE_SECONDS[key];
  }
  if (category && category in CATEGORY_DEFAULT_SECONDS) return CATEGORY_DEFAULT_SECONDS[category];
  return DEFAULT_TARGET_TIME_SECONDS;
}
