// 企業・エージェント向けデモ画面のクオリティ向上のため、リアリティのあるダミー学生15名分を
// D1へシードするための一度きりのスクリプト。Node上で直接実行し（scripts/generate-seed-questions.mts
// と同じ方式）、INSERT文一式を seed_demo_students.sql に書き出す。実際のD1への反映は
//   npx wrangler d1 execute webtest-db --local --file=seed_demo_students.sql
//   npx wrangler d1 execute webtest-db --remote --file=seed_demo_students.sql
// を別途実行して行う（このスクリプト自体はSQLファイルを生成するだけで、D1には接続しない）。
//
// メールアドレスは全員 demo-student-XX@example.com とし、実在の学生データと混同しないようにしている。
// パスワードはダミー値をPBKDF2でハッシュ化するのみで、実際にこの認証情報でログインする想定はない
// （企業デモ用の「検索対象として見える学生」を用意することが目的のため）。
import { writeFileSync } from "node:fs";
import { hashPassword } from "../functions/_lib/password.ts";

// src/data/universityCategories.ts の CATEGORY_MAP から該当大学の区分を事前に確認して直接指定している
// （そのファイルの内部importが拡張子無しでNodeのESM直接実行と相性が悪いため、依存を避けた）。
type StudentSeed = {
  lastName: string;
  firstName: string;
  lastNameRomaji: string;
  firstNameRomaji: string;
  university: string;
  universityCategory: string;
  facultyType: string;
  industries: [string, string, string];
  desiredOccupations: string[];
  graduationYear: number;
};

const STUDENTS: StudentSeed[] = [
  { lastName: "佐藤", firstName: "陽菜", lastNameRomaji: "Sato", firstNameRomaji: "Hina",
    university: "東京大学", universityCategory: "旧帝一科", facultyType: "文系学部",
    industries: ["コンサル・シンクタンク", "金融（銀行・証券・保険・投資）", "商社（総合・専門）"],
    desiredOccupations: ["コンサルタント・アナリスト", "企画・マーケティング・事業開発"], graduationYear: 2026 },
  { lastName: "鈴木", firstName: "大輝", lastNameRomaji: "Suzuki", firstNameRomaji: "Daiki",
    university: "京都大学", universityCategory: "旧帝一科", facultyType: "理系学部",
    industries: ["メーカー（自動車・食品・化学・製薬等）", "IT・通信・Web", "商社（総合・専門）"],
    desiredOccupations: ["研究・開発・技術職"], graduationYear: 2027 },
  { lastName: "高橋", firstName: "美咲", lastNameRomaji: "Takahashi", firstNameRomaji: "Misaki",
    university: "早稲田大学", universityCategory: "早慶上理", facultyType: "文系学部",
    industries: ["マスコミ・広告・出版", "IT・通信・Web", "サービス・インフラ（運輸・エネルギー・人材・旅行等）"],
    desiredOccupations: ["クリエイティブ・編集・デザイン", "企画・マーケティング・事業開発"], graduationYear: 2026 },
  { lastName: "田中", firstName: "翔太", lastNameRomaji: "Tanaka", firstNameRomaji: "Shota",
    university: "慶應義塾大学", universityCategory: "早慶上理", facultyType: "文系学部",
    industries: ["金融（銀行・証券・保険・投資）", "コンサル・シンクタンク", "商社（総合・専門）"],
    desiredOccupations: ["コンサルタント・アナリスト"], graduationYear: 2027 },
  { lastName: "伊藤", firstName: "結衣", lastNameRomaji: "Ito", firstNameRomaji: "Yui",
    university: "明治大学", universityCategory: "GMARCH", facultyType: "リベラルアーツ学部",
    industries: ["サービス・インフラ（運輸・エネルギー・人材・旅行等）", "マスコミ・広告・出版", "その他"],
    desiredOccupations: ["こだわりなし・幅広く検討したい"], graduationYear: 2026 },
  { lastName: "渡辺", firstName: "健太", lastNameRomaji: "Watanabe", firstNameRomaji: "Kenta",
    university: "同志社大学", universityCategory: "関関同立", facultyType: "文系学部",
    industries: ["不動産・建設・デベロッパー", "商社（総合・専門）", "金融（銀行・証券・保険・投資）"],
    desiredOccupations: ["営業・顧客交渉"], graduationYear: 2027 },
  { lastName: "山本", firstName: "さくら", lastNameRomaji: "Yamamoto", firstNameRomaji: "Sakura",
    university: "大阪大学", universityCategory: "旧帝一科", facultyType: "理系学部",
    industries: ["メーカー（自動車・食品・化学・製薬等）", "IT・通信・Web", "公的機関・公務員"],
    desiredOccupations: ["研究・開発・技術職", "IT・エンジニア・Web制作"], graduationYear: 2026 },
  { lastName: "中村", firstName: "蓮", lastNameRomaji: "Nakamura", firstNameRomaji: "Ren",
    university: "筑波大学", universityCategory: "TOCKY", facultyType: "理系学部",
    industries: ["IT・通信・Web", "メーカー（自動車・食品・化学・製薬等）", "コンサル・シンクタンク"],
    desiredOccupations: ["IT・エンジニア・Web制作"], graduationYear: 2027 },
  { lastName: "小林", firstName: "葵", lastNameRomaji: "Kobayashi", firstNameRomaji: "Aoi",
    university: "東京大学", universityCategory: "旧帝一科", facultyType: "理系大学院",
    industries: ["メーカー（自動車・食品・化学・製薬等）", "コンサル・シンクタンク", "IT・通信・Web"],
    desiredOccupations: ["研究・開発・技術職", "コンサルタント・アナリスト"], graduationYear: 2026 },
  { lastName: "加藤", firstName: "颯太", lastNameRomaji: "Kato", firstNameRomaji: "Sota",
    university: "京都大学", universityCategory: "旧帝一科", facultyType: "理系大学院",
    industries: ["IT・通信・Web", "メーカー（自動車・食品・化学・製薬等）", "商社（総合・専門）"],
    desiredOccupations: ["IT・エンジニア・Web制作", "研究・開発・技術職"], graduationYear: 2027 },
  { lastName: "吉田", firstName: "花", lastNameRomaji: "Yoshida", firstNameRomaji: "Hana",
    university: "早稲田大学", universityCategory: "早慶上理", facultyType: "文系学部",
    industries: ["公的機関・公務員", "金融（銀行・証券・保険・投資）", "サービス・インフラ（運輸・エネルギー・人材・旅行等）"],
    desiredOccupations: ["コーポレート・管理部門（人事・総務・経理・法務等）"], graduationYear: 2026 },
  { lastName: "山田", firstName: "拓海", lastNameRomaji: "Yamada", firstNameRomaji: "Takumi",
    university: "慶應義塾大学", universityCategory: "早慶上理", facultyType: "文系学部",
    industries: ["商社（総合・専門）", "金融（銀行・証券・保険・投資）", "マスコミ・広告・出版"],
    desiredOccupations: ["営業・顧客交渉", "企画・マーケティング・事業開発"], graduationYear: 2027 },
  { lastName: "佐々木", firstName: "紬", lastNameRomaji: "Sasaki", firstNameRomaji: "Tsumugi",
    university: "明治大学", universityCategory: "GMARCH", facultyType: "文系学部",
    industries: ["マスコミ・広告・出版", "サービス・インフラ（運輸・エネルギー・人材・旅行等）", "IT・通信・Web"],
    desiredOccupations: ["クリエイティブ・編集・デザイン"], graduationYear: 2026 },
  { lastName: "山口", firstName: "悠人", lastNameRomaji: "Yamaguchi", firstNameRomaji: "Yuto",
    university: "同志社大学", universityCategory: "関関同立", facultyType: "理系学部",
    industries: ["IT・通信・Web", "メーカー（自動車・食品・化学・製薬等）", "コンサル・シンクタンク"],
    desiredOccupations: ["IT・エンジニア・Web制作", "コンサルタント・アナリスト"], graduationYear: 2027 },
  { lastName: "松本", firstName: "美月", lastNameRomaji: "Matsumoto", firstNameRomaji: "Mizuki",
    university: "大阪大学", universityCategory: "旧帝一科", facultyType: "文系大学院",
    industries: ["コンサル・シンクタンク", "金融（銀行・証券・保険・投資）", "公的機関・公務員"],
    desiredOccupations: ["コンサルタント・アナリスト", "コーポレート・管理部門（人事・総務・経理・法務等）"], graduationYear: 2026 },
];

// 実データが投入済みのSPI・玉手箱それぞれの小分類（questions.sub_category）のみを使う。
// 未収録の小分類を使うとGET /api/exam-resultsの大分類集計に反映されないため。
const SPI_SUB_CATEGORIES = ["推論", "損益算", "資料の読み取り", "語彙"];
const TAMATEBAKO_SUB_CATEGORIES = ["四則逆算", "表の空欄推測", "趣旨判定（IMAGES形式）", "趣旨把握"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function buildCategoryScores(rand: () => number, subCategories: string[]) {
  const scores: Record<string, { correct: number; total: number }> = {};
  for (const sub of subCategories) {
    const total = pick(rand, 4, 6);
    // 偏差値50〜68に収まりやすいよう、正答率を55%〜90%程度の範囲でばらつかせる
    const correct = Math.min(total, Math.max(1, Math.round(total * (0.55 + rand() * 0.35))));
    scores[sub] = { correct, total };
  }
  return scores;
}

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

async function main() {
  const lines: string[] = [];
  const now = new Date();

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const rand = seededRandom(1000 + i * 37);
    const email = `demo-student-${String(i + 1).padStart(2, "0")}@example.com`;
    const { hash, salt } = await hashPassword(`Demo${1000 + i}Pass!`);
    const universityCategory = s.universityCategory;
    const desiredOccupationsJson = JSON.stringify(s.desiredOccupations);
    const createdAt = now.toISOString().slice(0, 19).replace("T", " ");

    lines.push(
      `INSERT INTO users (last_name, first_name, last_name_romaji, first_name_romaji, email, password_hash, password_salt, faculty_type, university, university_category, industry_first, industry_second, industry_third, desired_occupations, graduation_year, graduation_month, terms_agreed_at, scout_consent, created_at) VALUES ('${sqlEscape(
        s.lastName
      )}', '${sqlEscape(s.firstName)}', '${s.lastNameRomaji}', '${s.firstNameRomaji}', '${email}', '${hash}', '${salt}', '${s.facultyType}', '${sqlEscape(
        s.university
      )}', '${universityCategory}', '${sqlEscape(s.industries[0])}', '${sqlEscape(s.industries[1])}', '${sqlEscape(
        s.industries[2]
      )}', '${sqlEscape(desiredOccupationsJson)}', ${s.graduationYear}, 3, datetime('now'), 1, '${createdAt}');`
    );

    // 各学生につきSPI・玉手箱それぞれ1〜2回分の模試結果を作る（受験回数にもばらつきを持たせる）
    for (const testType of ["spi", "tamatebako"] as const) {
      const attempts = 1 + Math.floor(rand() * 2);
      const subCategories = testType === "spi" ? SPI_SUB_CATEGORIES : TAMATEBAKO_SUB_CATEGORIES;
      for (let a = 0; a < attempts; a++) {
        const categoryScores = buildCategoryScores(rand, subCategories);
        const total = Object.values(categoryScores).reduce((sum, v) => sum + v.total, 0);
        const correct = Object.values(categoryScores).reduce((sum, v) => sum + v.correct, 0);
        const accuracyRate = correct / total;
        const deviationScore = pick(rand, 50, 68) + Math.round(rand() * 10) / 10;
        const categoryScoresJson = sqlEscape(JSON.stringify(categoryScores));

        lines.push(
          `INSERT INTO exam_results (user_id, test_type, score, total, accuracy_rate, deviation_score, category_scores_json, taken_at) VALUES ((SELECT id FROM users WHERE email = '${email}'), '${testType}', ${correct}, ${total}, ${accuracyRate.toFixed(
            4
          )}, ${deviationScore.toFixed(1)}, '${categoryScoresJson}', datetime('now', '-${pick(rand, 1, 30)} days'));`
        );
      }
    }
  }

  const outPath = new URL("./seed_demo_students.sql", import.meta.url);
  writeFileSync(outPath, lines.join("\n") + "\n");
  console.log(`wrote ${STUDENTS.length} students (${lines.length} statements) to seed_demo_students.sql`);
}

main();
