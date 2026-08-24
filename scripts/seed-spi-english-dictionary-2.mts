// SPI3「英語」科目 英英辞典の問題（第2弾）を生成するスクリプト。
// 元データ: ユーザー提供の SPI_英英辞典問題集2.md（全30問）。
// 元データの解答をすべて手動で単語の意味と照合し、誤りがないことを確認済み（今回は修正なし）。
// ただし正解が A,B,C,D,E,A,B,C,D,E...という完全な周期パターンになっており、
// 読まずに順番で解答しても全問正解できてしまう重大な偏りがあったため、
// 選択肢を必ずシャッフルしてから投入する。
// category=english, sub_category=英英辞典 として追加する（第1弾30問に続く追加分。計60問になる）。
// 実行: node scripts/seed-spi-english-dictionary-2.mts
// → scripts/seed_spi_english_dictionary_2.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type DictionaryQuestion = {
  definition: string;
  options: [string, string, string, string, string]; // 0番目が正解
  explanation: string;
};

const QUESTIONS: DictionaryQuestion[] = [
  { definition: "the quality of being open to more than one interpretation", options: ["ambiguity", "certainty", "clarity", "consistency", "accuracy"], explanation: "「ambiguity」は「曖昧さ」という意味です。" },
  { definition: "a thing that is accepted as true without proof", options: ["assumption", "conclusion", "evidence", "verification", "observation"], explanation: "「assumption」は「仮定、想定」という意味です。" },
  { definition: "a quality or feature regarded as a characteristic or inherent part of someone or something", options: ["attribute", "tribute", "contribute", "distribute", "attitude"], explanation: "「attribute」は「属性、特質」という意味です。" },
  { definition: "prejudice in favor of or against one person or group compared with another, usually in an unfair way", options: ["bias", "balance", "belief", "boundary", "barrier"], explanation: "「bias」は「偏見」という意味です。" },
  { definition: "the maximum amount that something can contain or produce", options: ["capacity", "capability", "capital", "captivity", "capture"], explanation: "「capacity」は「収容力、能力」という意味です。" },
  { definition: "a part or element of a larger whole, especially a part of a machine or system", options: ["component", "compound", "composition", "compromise", "complement"], explanation: "「component」は「構成要素」という意味です。" },
  { definition: "prolonged public disagreement or heated discussion about something important", options: ["controversy", "consensus", "contradiction", "conflict", "confusion"], explanation: "「controversy」は「論争」という意味です。" },
  { definition: "a lack of compatibility or similarity between two or more facts or figures that ought to match", options: ["discrepancy", "discipline", "disparity", "distinction", "dispute"], explanation: "「discrepancy」は「食い違い」という意味です。" },
  { definition: "the state of having many different types or forms; variety", options: ["diversity", "density", "diversion", "divergence", "division"], explanation: "「diversity」は「多様性」という意味です。" },
  { definition: "the state of achieving maximum productivity with minimum wasted effort or expense", options: ["efficiency", "efficacy", "sufficiency", "proficiency", "deficiency"], explanation: "「efficiency」は「効率」という意味です。" },
  { definition: "special importance or value given to something", options: ["emphasis", "emergence", "emission", "empathy", "emblem"], explanation: "「emphasis」は「強調」という意味です。" },
  { definition: "great excitement and interest in something, and an eagerness to be involved in it", options: ["enthusiasm", "endurance", "emergence", "eminence", "elegance"], explanation: "「enthusiasm」は「熱意」という意味です。" },
  { definition: "a state in which opposing forces or influences are balanced", options: ["equilibrium", "equivalent", "equation", "equity", "equator"], explanation: "「equilibrium」は「均衡」という意味です。" },
  { definition: "a person or thing that is excluded from a general statement or does not follow a rule", options: ["exception", "exemption", "extension", "exclusion", "expectation"], explanation: "「exception」は「例外」という意味です。" },
  { definition: "expert skill or knowledge in a particular field", options: ["expertise", "experience", "expedition", "expenditure", "expression"], explanation: "「expertise」は「専門知識」という意味です。" },
  { definition: "a place, amenity, or piece of equipment provided for a particular purpose", options: ["facility", "faculty", "fabrication", "formation", "foundation"], explanation: "「facility」は「施設、設備」という意味です。" },
  { definition: "the quality of being thankful; readiness to show appreciation", options: ["gratitude", "gratification", "generosity", "gravity", "grievance"], explanation: "「gratitude」は「感謝」という意味です。" },
  { definition: "a thing that motivates or encourages someone to do something", options: ["incentive", "incident", "instance", "instinct", "intention"], explanation: "「incentive」は「動機、誘因」という意味です。" },
  { definition: "a conclusion reached on the basis of evidence and reasoning", options: ["inference", "interference", "influence", "preference", "reference"], explanation: "「inference」は「推論」という意味です。" },
  { definition: "the ability to assess and initiate things independently, without being told what to do", options: ["initiative", "initiation", "instinct", "intention", "institution"], explanation: "「initiative」は「自発性、主導権」という意味です。" },
  { definition: "the quality of being honest and having strong moral principles", options: ["integrity", "intensity", "identity", "integration", "intimacy"], explanation: "「integrity」は「誠実さ」という意味です。" },
  { definition: "danger of loss, harm, or failure", options: ["jeopardy", "journey", "justice", "jurisdiction", "judgement"], explanation: "「jeopardy」は「危険」という意味です。" },
  { definition: "the state of being legally responsible for something", options: ["liability", "validity", "viability", "reliability", "capability"], explanation: "「liability」は「法的責任」という意味です。" },
  { definition: "great size, extent, or importance", options: ["magnitude", "multitude", "altitude", "gratitude", "attitude"], explanation: "「magnitude」は「大きさ、規模」という意味です。" },
  { definition: "failure to take proper care over something, resulting in damage or harm", options: ["negligence", "innocence", "intelligence", "diligence", "reliance"], explanation: "「negligence」は「怠慢、過失」という意味です。" },
  { definition: "a belief or an idea about something", options: ["notion", "motion", "portion", "nation", "notice"], explanation: "「notion」は「概念、考え」という意味です。" },
  { definition: "an act or course of action to which a person is morally or legally bound; a duty", options: ["obligation", "observation", "occupation", "operation", "organization"], explanation: "「obligation」は「義務」という意味です。" },
  { definition: "hopefulness and confidence about the future or the success of something", options: ["optimism", "idealism", "realism", "pessimism", "egoism"], explanation: "「optimism」は「楽観主義」という意味です。" },
  { definition: "a statement or situation that seems contradictory or absurd but may in fact be true", options: ["paradox", "parallel", "paradigm", "paragraph", "parody"], explanation: "「paradox」は「逆説、矛盾」という意味です。" },
  { definition: "the capacity to recover quickly from difficulties; mental toughness", options: ["resilience", "resistance", "persistence", "consistency", "existence"], explanation: "「resilience」は「回復力、粘り強さ」という意味です。" },
];

const CATEGORY = "english";
const SUB_CATEGORY = "英英辞典";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般的な英単語の英英辞典形式定義）。市販教材・書籍からの引用なし。";

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

function main() {
  const lines = QUESTIONS.map((q) => {
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === 0 }));
    const shuffled = shuffle(indexed);
    const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
    const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
    const explanationJson = JSON.stringify([q.explanation]);

    return `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('${escapeSql(
      CATEGORY
    )}', '${escapeSql(SUB_CATEGORY)}', NULL, '${escapeSql(q.definition)}', '${escapeSql(
      optionsJson
    )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(ORIGINALITY_NOTE)}');`;
  });

  writeFileSync(new URL("./seed_spi_english_dictionary_2.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
