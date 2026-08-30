// D1のquestions行を、クライアント側のQuestion形状（選択肢A〜Eラベル付き）に変換する共通ロジック。
// functions/api/questions.ts と functions/api/review.ts の両方から使う。
export type QuestionRow = {
  id: number;
  category: string;
  sub_category: string;
  title: string | null;
  question_text: string;
  tables_json: string | null;
  options: string;
  correct_answer: number;
  explanation: string;
  image_data_uri?: string | null;
  seq?: number;
};

// A〜Zの26択まで対応（構造的把握力のP・Q分類等でA〜Jの10択を使うケースがあるため、
// SPI/玉手箱の通常問題で使うA〜E固定の5択より広く確保しておく）。
const CHOICE_LABELS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

// questions.category（大分類）ごとの表示用コード接頭辞。「問ID: #SPI-NV-001」のような形式で
// 全テスト・全単元の問題に共通の識別ラベルを表示するために使う（新しいtest_type列を追加せず、
// 既存のcategory値から導出する）。新しいテスト種別・大分類を追加した際はここにも追記すること。
const CATEGORY_CODE: Record<string, { test: string; unit: string }> = {
  non_verbal: { test: "SPI", unit: "NV" },
  verbal: { test: "SPI", unit: "L" },
  structural: { test: "SPI", unit: "S" },
  english: { test: "SPI", unit: "E" },
  tamatebako_math: { test: "TAM", unit: "M" },
  tamatebako_verbal: { test: "TAM", unit: "L" },
  tamatebako_english: { test: "TAM", unit: "E" },
  scoa_language: { test: "SCOA", unit: "L" },
  scoa_math: { test: "SCOA", unit: "M" },
  scoa_logic: { test: "SCOA", unit: "LG" },
  scoa_common_sense: { test: "SCOA", unit: "CS" },
  scoa_english: { test: "SCOA", unit: "E" },
  tgweb_traditional_verbal: { test: "TGW", unit: "TL" },
  tgweb_traditional_math: { test: "TGW", unit: "TM" },
  tgweb_new_verbal: { test: "TGW", unit: "NL" },
  tgweb_new_math: { test: "TGW", unit: "NM" },
  tgweb_english: { test: "TGW", unit: "E" },
  tgweb_verbal_reading: { test: "TGW", unit: "R" },
};

function buildQuestionCode(category: string, seq: number | undefined): string | undefined {
  const mapping = CATEGORY_CODE[category];
  if (!mapping || seq === undefined) return undefined;
  return `#${mapping.test}-${mapping.unit}-${String(seq).padStart(3, "0")}`;
}

export function toClientQuestion(row: QuestionRow) {
  let options: string[] = [];
  try {
    options = JSON.parse(row.options);
  } catch {
    options = [];
  }
  let explanation: string[] = [];
  try {
    explanation = JSON.parse(row.explanation);
  } catch {
    explanation = [row.explanation];
  }
  let tables: unknown = undefined;
  if (row.tables_json) {
    try {
      tables = JSON.parse(row.tables_json);
    } catch {
      tables = undefined;
    }
  }

  return {
    id: row.id,
    category: row.sub_category,
    rawCategory: row.category,
    questionCode: buildQuestionCode(row.category, row.seq),
    title: row.title ?? undefined,
    text: row.question_text,
    tables,
    imageDataUri: row.image_data_uri ?? undefined,
    choices: options.map((text, i) => ({ label: CHOICE_LABELS[i] ?? String(i), text })),
    answer: CHOICE_LABELS[row.correct_answer] ?? String(row.correct_answer),
    explanation,
  };
}
