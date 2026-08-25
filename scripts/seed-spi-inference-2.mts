// SPI3「非言語」科目 推論の問題（追加分）を生成するスクリプト。
// 元データ: ユーザー提供の SPI非言語_推論類題18問.md（全18問、解答・解説付き）。
// 元データは正解が極端に「C」へ偏っていた（18問中9問がC。他はA3問・B5問・D1問）ため、
// 出題時の偏りを避けるためスクリプト側で選択肢をシャッフルする。
// category=non_verbal, sub_category=推論 として追加する。
// 実行: node scripts/seed-spi-inference-2.mts
// → scripts/seed_spi_inference_2.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type InferenceQuestion = {
  questionText: string;
  options: string[]; // 元データの並び順（A,B,C,D...）
  correctIndex: number;
  explanation: string;
};

const QUESTIONS: InferenceQuestion[] = [
  // ==================== タイプ①：順位をすべて確定させる ====================
  {
    questionText:
      "E、F、G、Hの4人が長距離走を行いました。4人の順位に関して次のことがわかっています。\n\nⅠ．EはF、Gよりも順位が高かった。\nⅡ．FはHよりも順位が高かった。\nⅢ．Hは4位ではなかった。\n\nこれらの情報を基に、左から順に1位〜4位の順位を正しく並べてください。",
    options: ["EFGH", "EFHG", "EGFH", "FEHG"],
    correctIndex: 1,
    explanation:
      "条件Ⅰより、EはF・Gの両方より上位なので、Eは1位か2位です。もしEが2位なら、1位はF・G以外の人物である必要がありますが、そうなると条件Ⅱ（F＞H）を満たす人物配置ができず矛盾します。よってEは1位に確定します。残りF、G、Hを2〜4位に並べますが、条件ⅡよりFはHより上位である必要があるので、候補は「EFHG」「EFGH」「EGFH」の3通りです。ここに条件Ⅲ「Hは4位ではない」を当てはめると、EFGHとEGFHはどちらもHが4位になるため除外されます。残った「EFHG」が唯一の答えです。",
  },
  {
    questionText:
      "I、J、K、Lの4人が水泳競技を行いました。4人の順位に関して次のことがわかっています。\n\nⅠ．IはJ、Kよりも順位が高かった。\nⅡ．JはLよりも順位が高かった。\nⅢ．Lは4位ではなかった。",
    options: ["IJKL", "IJLK", "IKJL", "JILK"],
    correctIndex: 1,
    explanation:
      "条件Ⅰより、IはJ・Kの両方より上位なので、Iは1位か2位です。Iが2位だと条件Ⅱ（J＞L）を満たせる1位の人物がいないため矛盾し、Iは1位に確定します。残りJ、K、Lを2〜4位に並べる際、J＞Lより候補は「IJLK」「IJKL」「IKJL」の3通り。条件Ⅲ「Lは4位ではない」により、Lが4位になるIJKLとIKJLは除外されます。残った「IJLK」が答えです。",
  },
  {
    questionText:
      "M、N、O、Pの4人がチェス大会に出場しました。4人の順位に関して次のことがわかっています。\n\nⅠ．MはN、Oよりも順位が高かった。\nⅡ．NはPよりも順位が高かった。\nⅢ．Pは4位ではなかった。",
    options: ["MNOP", "MNPO", "MONP", "NMOP"],
    correctIndex: 1,
    explanation:
      "条件Ⅰより、Mは1位か2位ですが、2位だと条件Ⅱを満たせず矛盾するため、Mは1位に確定します。残りN、O、Pを2〜4位に並べる際、N＞Pより候補は「MNPO」「MNOP」「MONP」の3通り。条件Ⅲ「Pは4位ではない」により、Pが4位になるMNOPとMONPは除外され、「MNPO」が答えです。",
  },
  // ==================== タイプ②：必ずしも誤りとは言えないものを選ぶ ====================
  {
    questionText:
      "T、U、V、Wの4人が発表を順番に行いました。発表順について次のことがわかっています。\n\nⅠ．Tの直後にUが発表した\nⅡ．最初に発表したのはVではない\n\n次の推論ア、イ、ウのうち、必ずしも誤りとは言えないものはどれか。\n\nア：Wが2番目に発表した\nイ：Vが3番目に発表した\nウ：Tが4番目に発表した",
    options: ["アだけ", "イだけ", "アとイの両方", "全て間違い"],
    correctIndex: 1,
    explanation:
      "Ⅰより「TU」は隣り合う塊として扱えます。この塊が入る位置は1-2番目、2-3番目、3-4番目の3通りですが、Ⅱ「Vは最初ではない」を満たす並びを書き出すと、TUVW・TUWV・WTUV・WVTUの4通りになります。ア（W＝2番目）：4通りいずれにも該当なし→誤り。イ（V＝3番目）：TUVWで該当→必ずしも誤りとは言えない。ウ（T＝4番目）：Tの直後に必ずUが来るため最後にはなれない→誤り。したがって答えはイだけです。",
  },
  {
    questionText:
      "X、Y、Z、Wの4人が面接を順番に受けました。順番について次のことがわかっています。\n\nⅠ．Xの直後にYが面接を受けた\nⅡ．最初に面接を受けたのはZではない\n\nア：Wが2番目に受けた\nイ：Zが3番目に受けた\nウ：Xが4番目に受けた",
    options: ["アだけ", "イだけ", "アとイの両方", "全て間違い"],
    correctIndex: 1,
    explanation:
      "「XY」の塊の位置で場合分けし、Ⅱを満たす並びを書き出すと、XYZW、XYWZ、WXYZ、WZXYの4通りです。ア（W＝2番目）：該当なし。イ（Z＝3番目）：XYWZで該当→必ずしも誤りとは言えない。ウ（X＝4番目）：Xの直後に必ずYが来るため該当なし。よって答えはイだけです。",
  },
  {
    questionText:
      "G、H、I、Jの4人が発表を順番に行いました。発表順について次のことがわかっています。\n\nⅠ．Gの直後にHが発表した\nⅡ．最初に発表したのはIではない\n\nア：Iが2番目に発表した\nイ：Jが1番目に発表した\nウ：Gが3番目に発表した",
    options: ["アだけ", "イだけ", "ウだけ", "アとイとウの全て"],
    correctIndex: 3,
    explanation:
      "「GH」の塊の位置で場合分けし、Ⅱを満たす並びを書き出すと、GHIJ、GHJI、JGHI、JIGHの4通りです。ア（I＝2番目）：JIGHで該当。イ（J＝1番目）：JGHIで該当。ウ（G＝3番目）：JIGHで該当。3つとも実現する並びが存在するため、いずれも「必ずしも誤りとは言えない」と判断できます。よって答えはアとイとウの全てです。",
  },
  // ==================== タイプ③：必ず正しいものを選ぶ ====================
  {
    questionText:
      "K、L、M、Nの4人が短距離走を行い、4人の順位について次のことがわかっています。\n\nⅠ．KはLよりも順位が高い\nⅡ．MはNよりも順位が低い\nⅢ．Kは1位ではない\n\n次の推論ア、イ、ウのうち、必ず正しいものはどれか。\n\nア：Nが1位である\nイ：Mが4位である\nウ：Lが3位以下である",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "条件Ⅰ、ⅡからK＞L、N＞Mです。1位になれる人物を考えると、Kは条件Ⅲより1位ではありません。LはKより下位なので1位になれず、MはNより下位なので1位になれません。したがって1位になれるのはNのみで、Nが1位に確定します（ア＝必ず正しい）。残りK、L、Mを2〜4位に並べますが、K＞Lの関係から、Lは常に3位か4位になります（ウ＝必ず正しい）。一方Mは2位になる場合もあるため（例：NMKL）、Mが4位とは限りません（イ＝必ず正しいとは言えない）。よって答えはアとウの両方です。",
  },
  {
    questionText:
      "O、P、Q、Rの4人が短距離走を行い、4人の順位について次のことがわかっています。\n\nⅠ．OはPよりも順位が高い\nⅡ．QはRよりも順位が低い\nⅢ．Oは1位ではない\n\nア：Rが1位である\nイ：Qが4位である\nウ：Pが3位以下である",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "問題7と同じ考え方で、O、Qは1位になれず、Pも(O＞Pより)1位になれないため、1位はRに確定します（ア）。残るO、P、Qの並びで、O＞Pの関係からPは常に3位か4位になります（ウ）。Qは常に4位とは限りません（イは誤り）。よって答えはアとウの両方です。",
  },
  {
    questionText:
      "W、X、Y、Zの4人がバドミントンの試合を行い、4人の順位について次のことがわかっています。\n\nⅠ．WはXよりも順位が高い\nⅡ．YはZよりも順位が低い\nⅢ．Wは1位ではない\n\nア：Zが1位である\nイ：Yが4位である\nウ：Xが3位以下である",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "同様に、W・X・Yは1位になれないため、1位はZに確定します（ア）。残りW、X、Yの並びで、W＞Xの関係からXは常に3位か4位になります（ウ）。Yが常に4位とは限らないため（イは誤り）、答えはアとウの両方です。",
  },
  // ==================== タイプ④：点数（順位）が最も高い人を求める ====================
  {
    questionText:
      "U、V、W、X、Yの5人がテストを受けました。5人の点数について次のことがわかっています（同点はいないものとする）。\n\nⅠ．UはVより点数が高い\nⅡ．WはXより点数が高い\nⅢ．YはWより点数が高く、Uより点数が低い\n\nこのとき、最も点数が高かったのは誰か。",
    options: ["U", "V", "W", "Y"],
    correctIndex: 0,
    explanation:
      "条件ⅢからU＞Y、条件Ⅱと合わせるとY＞W＞Xとなり、これをつなげるとU＞Y＞W＞Xの関係が確定します。さらに条件ⅠのU＞Vも合わせると、Uより上の人はいません。よって最も点数が高いのはUです。",
  },
  {
    questionText:
      "E、F、G、H、Iの5人がテストを受けました。5人の点数について次のことがわかっています（同点はいないものとする）。\n\nⅠ．EはFより点数が高い\nⅡ．GはHより点数が高い\nⅢ．IはGより点数が高く、Eより点数が低い",
    options: ["E", "F", "G", "I"],
    correctIndex: 0,
    explanation:
      "条件Ⅲ・ⅡよりE＞I＞G＞Hの関係が確定し、条件ⅠのE＞Fも合わせると、Eより上の人はいません。よって最も点数が高いのはEです。",
  },
  {
    questionText:
      "J、K、L、M、Nの5人がテストを受けました。5人の点数について次のことがわかっています（同点はいないものとする）。\n\nⅠ．JはKより点数が高い\nⅡ．LはMより点数が高い\nⅢ．NはLより点数が高く、Jより点数が低い",
    options: ["J", "K", "L", "N"],
    correctIndex: 0,
    explanation:
      "条件Ⅲ・ⅡよりJ＞N＞L＞Mの関係が確定し、条件ⅠのJ＞Kも合わせると、Jより上の人はいません。よって最も点数が高いのはJです。",
  },
  // ==================== タイプ⑤：必ず正しいものを選ぶ（隣接ブロック） ====================
  {
    questionText:
      "C、D、E、Fの4人がリレーで走った順序について、次のことがわかっています。\n\nⅠ．Dの直後にEが走った\nⅡ．Fは最後に走った\n\n次の推論ア、イ、ウのうち、必ず正しいものはどれか。\n\nア：Dが1番目に走った\nイ：Cが3番目に走った\nウ：Eは2番目か3番目に走った",
    options: ["アだけ", "イだけ", "ウだけ", "アとウの両方"],
    correctIndex: 2,
    explanation:
      "Ⅱより Fは4番目で確定です。残るC、D、Eを1〜3番目に並べますが、Ⅰより「DE」は隣り合う塊になります。塊が1-2番目に入る場合：残るCは3番目→並びはDECF。塊が2-3番目に入る場合：残るCは1番目→並びはCDEF。考えられる並びはこの2通りです。ア（D＝1番目）：DECFのみ該当し、必ず正しいとは言えません。イ（C＝3番目）：DECFのみ該当し、必ず正しいとは言えません。ウ（E＝2番目か3番目）：DECFでは2番目、CDEFでは3番目となり、どちらの並びでも成立します。したがって必ず正しいのはウだけです。",
  },
  {
    questionText:
      "G、H、I、Jの4人がリレーで走った順序について、次のことがわかっています。\n\nⅠ．Hの直後にIが走った\nⅡ．Jは最後に走った\n\nア：Hが1番目に走った\nイ：Gが3番目に走った\nウ：Iは2番目か3番目に走った",
    options: ["アだけ", "イだけ", "ウだけ", "アとウの両方"],
    correctIndex: 2,
    explanation:
      "Jは4番目で確定。「HI」の塊の位置で場合分けすると、並びはHIGJまたはGHIJの2通りです。アはHIGJのみ、イもHIGJのみで成立し、必ず正しいとは言えません。ウ（I＝2番目か3番目）はHIGJ（2番目）、GHIJ（3番目）のどちらでも成立するため必ず正しく、答えはウだけです。",
  },
  {
    questionText:
      "K、L、M、Nの4人がリレーで走った順序について、次のことがわかっています。\n\nⅠ．Lの直後にMが走った\nⅡ．Nは最後に走った\n\nア：Lが1番目に走った\nイ：Kが3番目に走った\nウ：Mは2番目か3番目に走った",
    options: ["アだけ", "イだけ", "ウだけ", "アとウの両方"],
    correctIndex: 2,
    explanation:
      "Nは4番目で確定。「LM」の塊の位置で場合分けすると、並びはLMKNまたはKLMNの2通りです。アとイはどちらか一方の並びでしか成立せず必ず正しいとは言えませんが、ウ（M＝2番目か3番目）はLMKN（2番目）、KLMN（3番目）のどちらでも成立するため必ず正しく、答えはウだけです。",
  },
  // ==================== タイプ⑥：必ずしも誤りとは言えないものを選ぶ（先後関係） ====================
  {
    questionText:
      "P、Q、R、Sの4人がコンビニに到着した順序について、次のことがわかっています。\n\nⅠ．QはPよりも後に到着した\nⅡ．Rは最初には到着していない\n\n次の推論ア、イ、ウのうち、必ずしも誤りとは言えないものはどれか。\n\nア：Sが最初に到着した\nイ：Pが最後に到着した\nウ：Qが2番目に到着した",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "Ⅰより、PはQより先に到着しています（P＜Q）。最初に到着できる人物を考えると、QはPより後なので最初にはなれず、RもⅡより最初にはなれません。よって最初はPかSに絞られます。ア（S＝最初）：SPQR等が存在し、誤りとは言えません。イ（P＝最後）：P＜Qより、Pの後に必ずQがいるため、Pが最後になることはなく、必ず誤りです。ウ（Q＝2番目）：PQRS（P1・Q2）のような並びが存在し、誤りとは言えません。したがって必ずしも誤りとは言えないのはアとウの両方です。",
  },
  {
    questionText:
      "T、U、V、Wの4人が図書館に到着した順序について、次のことがわかっています。\n\nⅠ．UはTよりも後に到着した\nⅡ．Vは最初には到着していない\n\nア：Wが最初に到着した\nイ：Tが最後に到着した\nウ：Uが2番目に到着した",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "T＜U（Tが先）の関係があります。UとVはどちらも最初になれないため、最初はTかWに絞られます。ア（W＝最初）：WTUV等が存在し、誤りとは言えません。イ（T＝最後）：T＜Uより、Tの後に必ずUが来るため必ず誤りです。ウ（U＝2番目）：TUVW（T1・U2）等が存在し、誤りとは言えません。よって答えはアとウの両方です。",
  },
  {
    questionText:
      "E、F、G、Hの4人が駅に到着した順序について、次のことがわかっています。\n\nⅠ．FはEよりも後に到着した\nⅡ．Gは最初には到着していない\n\nア：Hが最初に到着した\nイ：Eが最後に到着した\nウ：Fが2番目に到着した",
    options: ["アだけ", "ウだけ", "アとウの両方", "アとイとウの全て"],
    correctIndex: 2,
    explanation:
      "E＜F（Eが先）の関係があります。FとGはどちらも最初になれないため、最初はEかHに絞られます。ア（H＝最初）：HEFG等が存在し、誤りとは言えません。イ（E＝最後）：E＜Fより、Eの後に必ずFが来るため必ず誤りです。ウ（F＝2番目）：EFGH（E1・F2）等が存在し、誤りとは言えません。よって答えはアとウの両方です。",
  },
];

const CATEGORY = "non_verbal";
const SUB_CATEGORY = "推論";
const ORIGINALITY_NOTE =
  "ユーザー提供のオリジナル問題（一般知識ベースの創作文）。市販教材・書籍からの引用なし。";

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
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === q.correctIndex }));
    const shuffled = shuffle(indexed);
    const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
    const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
    const explanationJson = JSON.stringify([q.explanation]);
    return `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('${escapeSql(
      CATEGORY
    )}', '${escapeSql(SUB_CATEGORY)}', NULL, '${escapeSql(q.questionText)}', '${escapeSql(
      optionsJson
    )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(ORIGINALITY_NOTE)}');`;
  });

  writeFileSync(new URL("./seed_spi_inference_2.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
