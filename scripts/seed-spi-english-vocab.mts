// SPI3「英語」科目 語意（同意語・反意語）の問題を生成するスクリプト。
// 元データ: ユーザー提供の SPI_同意語反意語問題集.md（同意語30問＋反意語30問＝計60問）。
// 元データの解答をすべて手動で意味照合し、誤りがないことを確認済み（今回は修正なし）。
// ただし正解の分布に偏りがあった（反意語30問中「A」が0回、同意語も「E」に偏重）ため、
// 出題時の偏りを避けるためスクリプト側で選択肢をシャッフルする。
// 元データに解説文は無かったため、各語の意味を踏まえた簡潔な解説をこのスクリプトで新規作成している。
// category=english, sub_category=語意（同意語・反意語） として挿入する（既存の practiceUnits.ts の
// SPI「英語（能力）」グループに定義済みの単元）。
// 実行: node scripts/seed-spi-english-vocab.mts
// → scripts/seed_spi_english_vocab.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type VocabQuestion = {
  word: string;
  options: [string, string, string, string, string]; // 0番目が正解
  explanation: string;
};

// ==================== 同意語（Synonym）30問 ====================
const SYNONYMS: VocabQuestion[] = [
  { word: "obtain", options: ["acquire", "reject", "waste", "delay", "expand"], explanation: "obtain（手に入れる）とacquire（獲得する）はほぼ同じ意味です。" },
  { word: "reveal", options: ["disclose", "conceal", "ignore", "reduce", "delay"], explanation: "reveal（明らかにする）とdisclose（暴露する）はほぼ同じ意味です。" },
  { word: "assist", options: ["help", "obstruct", "delay", "replace", "ignore"], explanation: "assist（手伝う）とhelp（助ける）はほぼ同じ意味です。" },
  { word: "abandon", options: ["desert", "gather", "maintain", "repair", "expand"], explanation: "abandon（捨てる・放棄する）とdesert（見捨てる）はほぼ同じ意味です。" },
  { word: "sufficient", options: ["adequate", "scarce", "excessive", "uncertain", "temporary"], explanation: "sufficient（十分な）とadequate（適切で十分な）はほぼ同じ意味です。" },
  { word: "approve", options: ["endorse", "reject", "postpone", "ignore", "doubt"], explanation: "approve（承認する）とendorse（支持・承認する）はほぼ同じ意味です。" },
  { word: "hesitate", options: ["waver", "decide", "insist", "proceed", "confirm"], explanation: "hesitate（ためらう）とwaver（心が揺れる）はほぼ同じ意味です。" },
  { word: "genuine", options: ["authentic", "artificial", "doubtful", "ordinary", "temporary"], explanation: "genuine（本物の）とauthentic（正真正銘の）はほぼ同じ意味です。" },
  { word: "compel", options: ["force", "allow", "refuse", "avoid", "request"], explanation: "compel（強制する）とforce（force・強制する）はほぼ同じ意味です。" },
  { word: "diminish", options: ["decrease", "increase", "maintain", "expand", "restore"], explanation: "diminish（減少する）とdecrease（減少する）はほぼ同じ意味です。" },
  { word: "imitate", options: ["mimic", "invent", "avoid", "ignore", "replace"], explanation: "imitate（まねる）とmimic（模倣する）はほぼ同じ意味です。" },
  { word: "postpone", options: ["defer", "cancel", "accelerate", "finish", "begin"], explanation: "postpone（延期する）とdefer（延期する）はほぼ同じ意味です。" },
  { word: "rigid", options: ["stiff", "flexible", "loose", "elastic", "soft"], explanation: "rigid（硬い・厳格な）とstiff（硬い）はほぼ同じ意味です。" },
  { word: "vague", options: ["ambiguous", "clear", "precise", "obvious", "certain"], explanation: "vague（あいまいな）とambiguous（多義的であいまいな）はほぼ同じ意味です。" },
  { word: "thorough", options: ["meticulous", "careless", "hasty", "superficial", "rough"], explanation: "thorough（徹底的な）とmeticulous（細心の注意を払う）はほぼ同じ意味です。" },
  { word: "reluctant", options: ["unwilling", "eager", "confident", "ready", "willing"], explanation: "reluctant（気が進まない）とunwilling（いやいやながらの）はほぼ同じ意味です。" },
  { word: "abundant", options: ["plentiful", "scarce", "rare", "limited", "insufficient"], explanation: "abundant（豊富な）とplentiful（豊富な）はほぼ同じ意味です。" },
  { word: "persuade", options: ["convince", "discourage", "ignore", "forbid", "deny"], explanation: "persuade（説得する）とconvince（納得させる）はほぼ同じ意味です。" },
  { word: "tolerate", options: ["endure", "reject", "resist", "escape", "avoid"], explanation: "tolerate（我慢する）とendure（耐える）はほぼ同じ意味です。" },
  { word: "eliminate", options: ["remove", "include", "add", "insert", "maintain"], explanation: "eliminate（排除する）とremove（取り除く）はほぼ同じ意味です。" },
  { word: "enormous", options: ["immense", "tiny", "moderate", "average", "slight"], explanation: "enormous（巨大な）とimmense（計り知れないほど大きい）はほぼ同じ意味です。" },
  { word: "fragile", options: ["delicate", "sturdy", "tough", "solid", "durable"], explanation: "fragile（壊れやすい）とdelicate（繊細で壊れやすい）はほぼ同じ意味です。" },
  { word: "cautious", options: ["careful", "careless", "reckless", "hasty", "bold"], explanation: "cautious（慎重な）とcareful（注意深い）はほぼ同じ意味です。" },
  { word: "conceal", options: ["hide", "reveal", "display", "expose", "announce"], explanation: "conceal（隠す）とhide（隠す）はほぼ同じ意味です。" },
  { word: "inevitable", options: ["unavoidable", "avoidable", "optional", "uncertain", "unlikely"], explanation: "inevitable（避けられない）とunavoidable（避けられない）はほぼ同じ意味です。" },
  { word: "flexible", options: ["adaptable", "rigid", "fixed", "stubborn", "strict"], explanation: "flexible（柔軟な）とadaptable（適応力のある）はほぼ同じ意味です。" },
  { word: "numerous", options: ["many", "few", "scarce", "single", "rare"], explanation: "numerous（多数の）とmany（たくさんの）はほぼ同じ意味です。" },
  { word: "essential", options: ["vital", "optional", "trivial", "minor", "unnecessary"], explanation: "essential（不可欠な）とvital（極めて重要な）はほぼ同じ意味です。" },
  { word: "accurate", options: ["precise", "vague", "careless", "rough", "approximate"], explanation: "accurate（正確な）とprecise（正確な）はほぼ同じ意味です。" },
  { word: "ample", options: ["sufficient", "scarce", "insufficient", "limited", "inadequate"], explanation: "ample（十分な・豊富な）とsufficient（十分な）はほぼ同じ意味です。" },
];

// ==================== 反意語（Antonym）30問 ====================
const ANTONYMS: VocabQuestion[] = [
  { word: "increase", options: ["decrease", "expand", "extend", "continue", "maintain"], explanation: "increase（増加する）の反対はdecrease（減少する）です。" },
  { word: "major", options: ["minor", "primary", "central", "main", "huge"], explanation: "major（主要な・大きい）の反対はminor（小さい・重要でない）です。" },
  { word: "superior", options: ["inferior", "equal", "similar", "average", "dominant"], explanation: "superior（優れた）の反対はinferior（劣った）です。" },
  { word: "optimistic", options: ["pessimistic", "confident", "hopeful", "cheerful", "positive"], explanation: "optimistic（楽観的な）の反対はpessimistic（悲観的な）です。" },
  { word: "voluntary", options: ["compulsory", "optional", "free", "willing", "informal"], explanation: "voluntary（自発的な・任意の）の反対はcompulsory（義務的な・強制的な）です。" },
  { word: "temporary", options: ["permanent", "brief", "short", "quick", "momentary"], explanation: "temporary（一時的な）の反対はpermanent（永続的な）です。" },
  { word: "artificial", options: ["natural", "synthetic", "fake", "false", "manmade"], explanation: "artificial（人工の）の反対はnatural（自然の）です。" },
  { word: "abundant", options: ["scarce", "plentiful", "ample", "sufficient", "rich"], explanation: "abundant（豊富な）の反対はscarce（乏しい）です。" },
  { word: "reveal", options: ["conceal", "expose", "disclose", "announce", "display"], explanation: "reveal（明らかにする）の反対はconceal（隠す）です。" },
  { word: "expand", options: ["shrink", "grow", "extend", "enlarge", "increase"], explanation: "expand（拡大する）の反対はshrink（縮小する）です。" },
  { word: "praise", options: ["criticize", "admire", "honor", "respect", "applaud"], explanation: "praise（称賛する）の反対はcriticize（批判する）です。" },
  { word: "import", options: ["export", "purchase", "produce", "deliver", "sell"], explanation: "import（輸入する）の反対はexport（輸出する）です。" },
  { word: "fluent", options: ["halting", "smooth", "skilled", "eloquent", "articulate"], explanation: "fluent（流暢な）の反対はhalting（たどたどしい）です。" },
  { word: "cautious", options: ["reckless", "careful", "prudent", "wary", "alert"], explanation: "cautious（慎重な）の反対はreckless（無謀な）です。" },
  { word: "genuine", options: ["fake", "authentic", "real", "true", "sincere"], explanation: "genuine（本物の）の反対はfake（偽の）です。" },
  { word: "flexible", options: ["rigid", "adaptable", "elastic", "versatile", "supple"], explanation: "flexible（柔軟な）の反対はrigid（硬直した）です。" },
  { word: "generous", options: ["stingy", "kind", "giving", "charitable", "liberal"], explanation: "generous（気前の良い）の反対はstingy（けちな）です。" },
  { word: "domestic", options: ["foreign", "national", "local", "internal", "native"], explanation: "domestic（国内の）の反対はforeign（外国の）です。" },
  { word: "urban", options: ["rural", "metropolitan", "municipal", "civic", "modern"], explanation: "urban（都市の）の反対はrural（田舎の）です。" },
  { word: "hire", options: ["dismiss", "employ", "recruit", "appoint", "engage"], explanation: "hire（雇う）の反対はdismiss（解雇する）です。" },
  { word: "accept", options: ["reject", "approve", "agree", "welcome", "receive"], explanation: "accept（受け入れる）の反対はreject（拒否する）です。" },
  { word: "victory", options: ["defeat", "triumph", "success", "achievement", "win"], explanation: "victory（勝利）の反対はdefeat（敗北）です。" },
  { word: "arrival", options: ["departure", "entrance", "appearance", "coming", "approach"], explanation: "arrival（到着）の反対はdeparture（出発）です。" },
  { word: "prosperity", options: ["poverty", "wealth", "success", "abundance", "fortune"], explanation: "prosperity（繁栄）の反対はpoverty（貧困）です。" },
  { word: "attack", options: ["defend", "invade", "assault", "charge", "strike"], explanation: "attack（攻撃する）の反対はdefend（守る）です。" },
  { word: "include", options: ["exclude", "contain", "involve", "incorporate", "comprise"], explanation: "include（含む）の反対はexclude（除外する）です。" },
  { word: "gain", options: ["lose", "earn", "obtain", "acquire", "achieve"], explanation: "gain（得る）の反対はlose（失う）です。" },
  { word: "construct", options: ["demolish", "build", "erect", "establish", "assemble"], explanation: "construct（建設する）の反対はdemolish（取り壊す）です。" },
  { word: "encourage", options: ["discourage", "support", "motivate", "inspire", "urge"], explanation: "encourage（励ます）の反対はdiscourage（思いとどまらせる）です。" },
  { word: "strengthen", options: ["weaken", "reinforce", "support", "boost", "enhance"], explanation: "strengthen（強化する）の反対はweaken（弱める）です。" },
];

const CATEGORY = "english";
const SUB_CATEGORY = "語意（同意語・反意語）";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般的な英単語の同意語・反意語）。市販教材・書籍からの引用なし。";

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildInserts(questions: VocabQuestion[], promptSuffix: string): string[] {
  return questions.map((q) => {
    const questionText = `「${q.word}」${promptSuffix}`;
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === 0 }));
    const shuffled = shuffle(indexed);
    const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
    const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
    const explanationJson = JSON.stringify([q.explanation]);

    return `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('${escapeSql(
      CATEGORY
    )}', '${escapeSql(SUB_CATEGORY)}', NULL, '${escapeSql(questionText)}', '${escapeSql(
      optionsJson
    )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(ORIGINALITY_NOTE)}');`;
  });
}

function main() {
  const lines = [
    ...buildInserts(SYNONYMS, "と最も近い意味を持つ語を選びなさい。"),
    ...buildInserts(ANTONYMS, "と反対の意味を持つ語を選びなさい。"),
  ];

  writeFileSync(new URL("./seed_spi_english_vocab.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements (30 synonyms + 30 antonyms).`);
}

main();
