// 模試の偏差値計算を適正化するためのダミー受験結果（exam_results）シードスクリプト。
// ダミーの学生ユーザー（demo-student-01〜15@example.com、functions/api/exam-results.tsの
// 母集団計算対象）に対し、各ユーザーの第一志望業界（industry_first）のボーダーライン偏差値
// （src/data/industryBorderlines.ts）に連動した正答率で、ほぼ全テスト種別の受験結果を生成する。
//
// 実行方法: node scripts/seed-mock-results.mts <users.jsonのパス> <出力sqlファイル名>
//   <users.jsonのパス> は `wrangler d1 execute ... --command "SELECT id, email, industry_first
//   FROM users WHERE email LIKE 'demo-student-%'"` の出力をそのままファイルに保存したもの。
//   ローカルD1と本番D1でuser.idが異なる場合があるため、環境ごとに別々のusers.jsonを渡して
//   2回実行し、それぞれの出力sqlを対応する環境に投入すること。
//
// deviation_scoreはfunctions/api/exam-results.tsのcalculateDeviationScore()と全く同じ計算式を
// ここでも再現し、生成した受験結果を taken_at の昇順（test_typeごと）に1件ずつ処理しながら、
// 「その時点までに記録されている同じtest_typeの正答率」を母集団として算出する
// （本番で実際にリクエストが来た場合と同じロジックで、後から本物のユーザーが受験したときも
// このダミー母集団を含めて正しく偏差値が計算される）。

import { readFileSync, writeFileSync } from "node:fs";

// src/data/industryBorderlines.tsのINDUSTRY_BORDERLINE_DEVIATION/getBorderlineDeviationと
// 同じ内容をここに複製している。industryBorderlines.tsは拡張子省略のrelative import
// （from "./formOptions"）を使っており、Next.js/webpackのビルドでは解決できるが、
// このスクリプトをNode ESMで直接実行する場合は拡張子省略のimportを解決できずエラーになるため、
// スクリプト単体で完結させる目的で複製した（値を変更した場合は両ファイルを同期させること）。
const INDUSTRY_BORDERLINE_DEVIATION: Record<string, number> = {
  戦略コンサル: 65,
  外資系総合コンサル: 63,
  日系総合コンサル: 58,
  "M&A": 64,
  外資系金融: 64,
  メガバンク: 58,
  "日系証券・保険": 55,
  日系投資運用: 60,
  公的金融: 56,
  その他日系金融: 53,
  総合商社: 62,
  専門商社: 55,
  外資メーカー: 60,
  外資サービス: 58,
  外資IT: 60,
  自動車: 55,
  食品: 54,
  化学: 54,
  製薬: 57,
  アパレル: 52,
  日系その他メーカー: 50,
  インターネット: 56,
  "情報システム・通信・その他IT": 52,
  運輸: 48,
  エネルギー: 52,
  "人材・教育": 50,
  旅行代理店: 48,
  "小売・サービス": 47,
  "不動産（デベロッパー）": 56,
  建設: 50,
  広告代理店: 58,
  テレビ局: 60,
  "新聞・出版・通信社": 57,
  その他メディア: 52,
  国家公務員: 58,
  地方公務員: 52,
  "公的機関・公益法人": 52,
  その他: 50,
};
const DEFAULT_BORDERLINE_DEVIATION = 50;
function getBorderlineDeviation(industry: string | null | undefined): number {
  if (!industry) return DEFAULT_BORDERLINE_DEVIATION;
  return INDUSTRY_BORDERLINE_DEVIATION[industry] ?? DEFAULT_BORDERLINE_DEVIATION;
}

type SubPart = { category: string; subCategories: string[] };

// テスト種別（exam_results.test_type、app/test/page.tsxのEXAM_PARTSキーと一致）ごとの
// 出題カテゴリ・小分類構成。src/data/practiceUnits.tsのPRACTICE_UNIT_GROUPS_BY_TESTと
// app/test/page.tsxのEXAM_PARTS定義に基づく。
const TEST_TYPE_STRUCTURE: Record<string, SubPart[]> = {
  spi_basic: [
    {
      category: "verbal",
      subCategories: ["語彙", "二語の関係", "熟語の成り立ち", "語句の用法", "文の並べ替え", "長文読解"],
    },
    {
      category: "non_verbal",
      subCategories: [
        "推論",
        "損益算",
        "場合の数・確率",
        "資料の読み取り",
        "集合",
        "仕事算",
        "速さ・時間・距離",
        "割合・比",
        "濃度算",
        "分割払い",
      ],
    },
  ],
  spi_english: [
    { category: "english", subCategories: ["語意（同意語・反意語）", "空欄補充", "英英辞典", "長文読解（英語）"] },
  ],
  spi_structural: [{ category: "structural", subCategories: ["文章の構造化", "分類・グループ化"] }],
  scoa: [
    { category: "scoa_language", subCategories: ["漢字・語句・熟語・ことわざ・慣用句", "長文読解"] },
    {
      category: "scoa_math",
      subCategories: ["四則計算", "方程式・不等式", "数列・規則性", "文章題（割合・確率・濃度など）"],
    },
    { category: "scoa_logic", subCategories: ["論理（推論・命題・ベン図・暗号・順序）", "サイコロ・空間図形"] },
    { category: "scoa_common_sense", subCategories: ["理科", "社会"] },
    { category: "scoa_english", subCategories: ["単語・熟語・アクセント", "英文法・語法", "和文英訳・英文和訳・英会話"] },
  ],
  tamatebako_math_arithmetic: [{ category: "tamatebako_math", subCategories: ["四則逆算"] }],
  tamatebako_math_graph: [{ category: "tamatebako_math", subCategories: ["図表の読み取り"] }],
  tamatebako_math_table: [{ category: "tamatebako_math", subCategories: ["表の空欄推測"] }],
  tamatebako_verbal_gab: [{ category: "tamatebako_verbal", subCategories: ["論理的読解（GAB形式）"] }],
  tamatebako_verbal_images: [{ category: "tamatebako_verbal", subCategories: ["趣旨判定（IMAGES形式）"] }],
  tamatebako_verbal_summary: [{ category: "tamatebako_verbal", subCategories: ["趣旨把握"] }],
  tamatebako_english_gab: [{ category: "tamatebako_english", subCategories: ["論理的読解（GAB形式）"] }],
  tamatebako_english_images: [{ category: "tamatebako_english", subCategories: ["長文読解（IMAGES形式）"] }],
  tgweb_traditional_verbal: [
    { category: "tgweb_traditional_verbal", subCategories: ["空欄補充", "並べ替え"] },
    { category: "tgweb_verbal_reading", subCategories: ["長文読解"] },
  ],
  tgweb_traditional_nonverbal: [{ category: "tgweb_traditional_math", subCategories: ["推論", "図形問題", "暗号"] }],
  tgweb_new_verbal: [{ category: "tgweb_new_verbal", subCategories: ["同義語・対義語", "ことわざ", "慣用句", "四字熟語"] }],
  tgweb_new_nonverbal: [{ category: "tgweb_new_math", subCategories: ["四則演算", "図表の読み取り"] }],
  tgweb_english: [{ category: "tgweb_english", subCategories: ["長文問題"] }],
  gab_verbal_exam: [{ category: "gab_verbal", subCategories: ["論理的読解"] }],
  gab_quantitative_exam: [{ category: "gab_quantitative", subCategories: ["資料の読み取り"] }],
  gab_english_exam: [{ category: "gab_english", subCategories: ["長文読解"] }],
};

// functions/api/exam-results.tsのcalculateDeviationScore()と同一の計算式。
function calculateDeviationScore(rate: number, priorRates: number[]): number {
  if (priorRates.length < 2) return 50;
  const mean = priorRates.reduce((sum, r) => sum + r, 0) / priorRates.length;
  const variance = priorRates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / priorRates.length;
  const stddev = Math.sqrt(variance);
  if (stddev === 0) return 50;
  return 50 + (10 * (rate - mean)) / stddev;
}

// Box-Muller法による標準正規乱数（実際の受験者集団らしい、単純な一様乱数より自然なばらつきを持たせるため）。
function gaussianNoise(stdDev: number): number {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// 志望業界のボーダーライン偏差値（50が母集団平均）を、狙いの正答率（0.35〜0.95）に変換する。
// 偏差値50→正答率60%、偏差値65（戦略コンサル等）→正答率90%、偏差値47（小売・サービス等）
// →正答率54%、という直線的なマッピング。ユーザー指定の目安
// （「戦略コンサル・総合商社志望は正答率90%前後、一般企業志望は60%前後」）に合わせて係数を調整済み。
function targetAccuracyForIndustry(industryFirst: string | null): number {
  const deviation = getBorderlineDeviation(industryFirst);
  return clamp(0.6 + ((deviation - 50) / 15) * 0.3, 0.35, 0.95);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 過去55日以内のランダムな日時（SQLite datetime形式）。2ヶ月に1回の受験サイクルの範囲内に収める。
function randomPastDatetime(): string {
  const daysAgo = randomInt(0, 55);
  const secondsOffset = randomInt(0, 86399);
  const d = new Date(Date.now() - daysAgo * 86400_000 - secondsOffset * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

type DummyUser = { id: number; industryFirst: string | null };

function loadUsers(path: string): DummyUser[] {
  const raw = readFileSync(path, "utf-8");
  const jsonStart = raw.indexOf("[");
  const parsed = JSON.parse(raw.slice(jsonStart));
  return parsed[0].results.map((r: { id: number; industry_first: string | null }) => ({
    id: r.id,
    industryFirst: r.industry_first,
  }));
}

type GeneratedAttempt = {
  userId: number;
  testType: string;
  score: number;
  total: number;
  accuracyRate: number;
  categoryScoresJson: string;
  takenAt: string;
};

function generateAttempts(users: DummyUser[]): GeneratedAttempt[] {
  const attempts: GeneratedAttempt[] = [];

  for (const user of users) {
    const targetAccuracy = targetAccuracyForIndustry(user.industryFirst);

    for (const [testType, subParts] of Object.entries(TEST_TYPE_STRUCTURE)) {
      const categoryScores: Record<string, { correct: number; total: number }> = {};
      let scoreSum = 0;
      let totalSum = 0;

      for (const part of subParts) {
        for (const subCategory of part.subCategories) {
          const total = randomInt(4, 12);
          // 単元ごとに±8%程度のばらつきを持たせつつ、全体としては志望業界のボーダーラインに収束させる。
          const rate = clamp(targetAccuracy + gaussianNoise(0.08), 0.05, 1);
          const correct = Math.min(total, Math.round(total * rate));
          categoryScores[subCategory] = { correct, total };
          scoreSum += correct;
          totalSum += total;
        }
      }

      attempts.push({
        userId: user.id,
        testType,
        score: scoreSum,
        total: totalSum,
        accuracyRate: scoreSum / totalSum,
        categoryScoresJson: JSON.stringify(categoryScores),
        takenAt: randomPastDatetime(),
      });
    }
  }

  return attempts;
}

function main() {
  const usersPath = process.argv[2];
  const outPath = process.argv[3];
  if (!usersPath || !outPath) {
    console.error("Usage: node scripts/seed-mock-results.mts <users.jsonのパス> <出力sqlファイル名>");
    process.exit(1);
  }

  const users = loadUsers(usersPath);
  console.log(`Loaded ${users.length} dummy users`);

  const attempts = generateAttempts(users);
  console.log(`Generated ${attempts.length} exam attempts across ${Object.keys(TEST_TYPE_STRUCTURE).length} test types`);

  // taken_atの昇順に並べ、test_typeごとに「その時点までのaccuracy_rate」を母集団として
  // deviation_scoreを逐次計算する（本番のAPIが実際のリクエスト到着順に処理するのと同じ順序性）。
  attempts.sort((a, b) => (a.takenAt < b.takenAt ? -1 : a.takenAt > b.takenAt ? 1 : 0));

  const priorRatesByTestType: Record<string, number[]> = {};
  const lines: string[] = [];

  for (const a of attempts) {
    const priorRates = priorRatesByTestType[a.testType] ?? [];
    const deviationScore = calculateDeviationScore(a.accuracyRate, priorRates);
    priorRatesByTestType[a.testType] = [...priorRates, a.accuracyRate];

    lines.push(
      `INSERT INTO exam_results (user_id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json, taken_at) VALUES (${a.userId}, '${escapeSql(
        a.testType
      )}', ${a.score}, ${a.total}, ${a.accuracyRate}, ${deviationScore}, '${escapeSql(a.categoryScoresJson)}', '${a.takenAt}');`
    );
  }

  writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
  console.log(`Wrote ${lines.length} INSERT statements to ${outPath}`);
}

main();
