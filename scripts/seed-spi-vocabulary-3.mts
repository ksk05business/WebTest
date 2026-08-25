// SPI3「言語」科目 語彙（意味と合致する語句を選ぶ）の問題（第3弾）を生成するスクリプト。
// 元データ: ユーザー提供の spi_goi_igi_gouchi_30mon.md（全30問、解答・解説付き）。
// 提示された意味と最も合致する語句をA〜Dから選ぶ形式（第1・2弾とは逆に、語句ではなく
// 意味の説明文が問題文になっているタイプ）。
// 元データの正解分布はA:9問,B:8問,C:6問,D:7問と比較的均等だったが、
// 他の語彙問題スクリプトとの一貫性のため、念のため選択肢をシャッフルして投入する。
// category=verbal, sub_category=語彙 として追加する（第1・2弾103問に続く追加分）。
// 実行: node scripts/seed-spi-vocabulary-3.mts
// → scripts/seed_spi_vocabulary_3.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type VocabQuestion = {
  meaning: string; // 提示される意味の説明文
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const QUESTIONS: VocabQuestion[] = [
  {
    meaning: "気が利いていて、対応に抜かりがないこと",
    options: ["手堅い", "如才ない", "円滑", "折り目正しい"],
    correctIndex: 1,
    explanation:
      "正解は「如才ない」です。手堅い＝危険が少なく確実であること。円滑＝物事がすらすらと進むこと。折り目正しい＝礼儀作法がきちんとしていること。",
  },
  {
    meaning: "身動きが取れないほど、切羽詰まった事態",
    options: ["抜き差しならない", "手詰まり", "八方塞がり", "綱渡り"],
    correctIndex: 0,
    explanation:
      "正解は「抜き差しならない」です。手詰まり＝とるべき手段がなくなること。八方塞がり＝あらゆる方向がふさがり、打つ手がないこと。綱渡り＝きわどい状況を、なんとか切り抜けていくこと。",
  },
  {
    meaning: "気づかれないよう、事前に密かな手段を講じておくこと",
    options: ["念を押す", "骨を折る", "一肌脱ぐ", "手を回す"],
    correctIndex: 3,
    explanation:
      "正解は「手を回す」です。念を押す＝間違いがないように確かめること。骨を折る＝苦労して力を尽くすこと。一肌脱ぐ＝人のために、進んで力を貸すこと。",
  },
  {
    meaning: "熱心につとめること",
    options: ["いそしむ", "たしなむ", "もてはやす", "こだわる"],
    correctIndex: 0,
    explanation:
      "正解は「いそしむ」です。たしなむ＝芸事や趣味などに、ほどよく親しむこと。もてはやす＝盛んにほめそやすこと。こだわる＝些細なことにまで、必要以上に気を配ること。",
  },
  {
    meaning: "一つのことに全力を注ぐこと",
    options: ["とりつく", "かかりきる", "かかずらう", "てこずる"],
    correctIndex: 1,
    explanation:
      "正解は「かかりきる」です。とりつく＝対象にしっかりと取りついて、離れないこと。かかずらう＝つまらないことに、関わり合うこと。てこずる＝物事がうまく運ばず、手間取ること。",
  },
  {
    meaning: "その上さらに（悪いことが重なる様子）",
    options: ["あまつさえ", "ひいては", "ならびに", "もしくは"],
    correctIndex: 0,
    explanation:
      "正解は「あまつさえ」です。ひいては＝それが原因となって、さらに他へ及んでは。ならびに＝〜と〜とを、並べて示す語。もしくは＝〜か、あるいは〜かを示す語。",
  },
  {
    meaning: "非常にうまく、適切に（言い当てる様子）",
    options: ["あからさまに", "つとに", "あえなく", "いみじくも"],
    correctIndex: 3,
    explanation:
      "正解は「いみじくも」です。あからさまに＝隠さず、はっきりと表す様子。つとに＝早くから、早い時期からの意。あえなく＝張り合いもなく、あっけなく。",
  },
  {
    meaning: "結局のところ、つまるところ",
    options: ["いわんや", "さしずめ", "よしんば", "ひとえに"],
    correctIndex: 1,
    explanation:
      "正解は「さしずめ」です。いわんや＝まして〜は、なおさらだの意。よしんば＝たとえ〜としても、の意。ひとえに＝ただもう、それだけの理由での意。",
  },
  {
    meaning: "思いやりがなく、そっけないこと",
    options: ["よそよそしい", "すげない", "めざとい", "えげつない"],
    correctIndex: 1,
    explanation:
      "正解は「すげない」です。よそよそしい＝親しみが感じられず、他人行儀な様子。めざとい＝物を見つけるのが早いこと。えげつない＝あくどく、露骨で嫌な感じがすること。",
  },
  {
    meaning: "物事が順調に進んでいる様子",
    options: ["めざましい", "いちじるしい", "はかばかしい", "すがすがしい"],
    correctIndex: 2,
    explanation:
      "正解は「はかばかしい」です。めざましい＝驚くほど素晴らしく、優れている様子。いちじるしい＝はっきりと目立つ様子。すがすがしい＝さっぱりとして、気持ちがよい様子。",
  },
  {
    meaning: "くっきりと際立っている様子",
    options: ["ものものしい", "こまやか", "あらわ", "際やか（きわやか）"],
    correctIndex: 3,
    explanation:
      "正解は「際やか」です。ものものしい＝大げさで、仰々しい様子。こまやか＝心配りが行き届き、細やかである様子。あらわ＝隠すことなく、外に現れている様子。",
  },
  {
    meaning: "何もせず、ただ傍観していること",
    options: ["手をこまねく", "高をくくる", "とりつく島がない", "さじを投げる"],
    correctIndex: 0,
    explanation:
      "正解は「手をこまねく」です。高をくくる＝たいしたことはないと、甘く見くびること。とりつく島がない＝頼りとする手がかりが、まったくないこと。さじを投げる＝見込みがないと、諦めること。",
  },
  {
    meaning: "隠れていたことが、表に出ること",
    options: ["発覚", "露呈", "暴露", "漏洩"],
    correctIndex: 1,
    explanation:
      "正解は「露呈」です。発覚＝隠していた悪事などが、明るみに出ること。暴露＝秘密を意図的に暴いて、明るみに出すこと。漏洩＝秘密などが、漏れ出ること。",
  },
  {
    meaning: "頭の働きがよく、賢いこと",
    options: ["老成", "早熟", "利発", "達者"],
    correctIndex: 2,
    explanation:
      "正解は「利発」です。老成＝豊かな経験を積み、精神や技術が成熟していること。早熟＝心身の成熟が、普通の人より早いこと。達者＝技芸などが優れ、巧みなこと。",
  },
  {
    meaning: "目先のことにだけ気がつき、抜け目がない様子",
    options: ["抜け目ない", "小賢しい（こざかしい）", "食えない", "小利口"],
    correctIndex: 3,
    explanation:
      "正解は「小利口」です。抜け目ない＝油断や隙がなく、要領よく立ち回る様子。小賢しい＝生意気で、浅はかな知恵をひけらかす様子。食えない＝一筋縄ではいかない、したたかな人。",
  },
  {
    meaning: "中途半端な知識しかないのに、詳しいふりをすること",
    options: ["半可通", "生兵法（なまびょうほう）", "知ったかぶり", "付け焼き刃"],
    correctIndex: 0,
    explanation:
      "正解は「半可通」です。生兵法＝十分に身についていない、未熟な知識や技術。知ったかぶり＝知らないことを、知っているふりをすること。付け焼き刃＝その場しのぎで身につけた、すぐに底が割れる知識や技術。",
  },
  {
    meaning: "欠点や短所を、ことさら大げさに言い立てること",
    options: ["あげつらう", "なじる", "こきおろす", "やりこめる"],
    correctIndex: 0,
    explanation:
      "正解は「あげつらう」です。なじる＝相手の欠点や失敗を、責めること。こきおろす＝ひどく悪く言う、けなすこと。やりこめる＝議論などで、相手を徹底的に言い負かすこと。",
  },
  {
    meaning: "人に仕えて、その世話をすること",
    options: ["へつらう", "こびる", "かしずく", "おもねる"],
    correctIndex: 2,
    explanation:
      "正解は「かしずく」です。へつらう＝相手に気に入られようと、お世辞を言うこと。こびる＝相手に気に入られようと、媚びた態度をとること。おもねる＝相手の機嫌をとり、気に入られようとすること。",
  },
  {
    meaning: "目上の人から、物をいただくこと",
    options: ["あずかる", "こうむる", "さずかる", "たまわる"],
    correctIndex: 3,
    explanation:
      "正解は「たまわる」です。あずかる＝物事に関与すること、また人から預かって保管すること。こうむる＝恩恵や被害などを、自分の身に受けること。さずかる（授かる）＝目上の者などから、大切なものを与えられること。「たまわる」はもらう側からのへりくだった表現である点に注意しましょう。",
  },
  {
    meaning: "物事に関与すること、また恩恵などを受けること",
    options: ["与る（あずかる）", "携わる", "関与する", "従事する"],
    correctIndex: 0,
    explanation:
      "正解は「与る」です。携わる＝ある物事に、主体的に関係すること。関与する＝ある物事に関係すること全般を指す、一般的な語。従事する＝ある職業や仕事に、携わること。「与る」は「お褒めに与る」のように、恩恵を受け取る受け身のニュアンスを含む点が特徴です。",
  },
  {
    meaning: "（飲食物や資料などを）差し出すこと",
    options: ["呈する（ていする）", "供する", "施す（ほどこす）", "捧げる（ささげる）"],
    correctIndex: 1,
    explanation:
      "正解は「供する」です。呈する＝差し出すこと、またある状態や様相を表すこと。施す＝恵みや援助などを、人に与えること。捧げる＝敬意や真心を込めて、大切なものを差し出すこと。",
  },
  {
    meaning: "他人の意見に反対して、論じ返すこと",
    options: ["論駁（ろんばく）", "抗弁（こうべん）", "反駁（はんばく）", "異議"],
    correctIndex: 2,
    explanation:
      "正解は「反駁」です。論駁＝相手の説の誤りを、論理的に指摘し攻撃すること。抗弁＝相手の言い分に対して、反論すること。異議＝他人と異なる意見や主張、そのものを指す語。",
  },
  {
    meaning: "他人の意見の誤りを論じて、攻撃すること",
    options: ["糾弾（きゅうだん）", "弾劾（だんがい）", "批判", "弁駁（べんばく）"],
    correctIndex: 3,
    explanation:
      "正解は「弁駁」です。糾弾＝罪や責任を問いただして、激しく非難すること。弾劾＝公職にある者の罪状などを調べ、公の場でその責任を問うこと。批判＝物事の善悪・可否を判断し、指摘すること。",
  },
  {
    meaning: "互いに敵意を持ち、にらみ合うこと",
    options: ["反目", "確執（かくしつ）", "軋轢（あつれき）", "不和"],
    correctIndex: 0,
    explanation:
      "正解は「反目」です。確執＝互いに自分の意見を主張して譲らず、仲が悪くなること。軋轢＝人間関係にきしみが生じ、争いや不和が起こること。不和＝単に仲が悪い状態そのものを指す語。",
  },
  {
    meaning: "事前の見込み、もくろみ",
    options: ["皮算用（かわざんよう）", "目算", "胸算用（むなざんよう）", "思惑（おもわく）"],
    correctIndex: 1,
    explanation:
      "正解は「目算」です。皮算用＝まだ手に入れていないものを当てにして、あれこれ計算すること。胸算用＝心の中で、ひそかに見積もりを立てること。思惑＝心の中で考えていること、意図。",
  },
  {
    meaning: "権力を独占し、わがまま勝手に振る舞うこと",
    options: ["横柄（おうへい）", "傲岸（ごうがん）", "専横", "尊大"],
    correctIndex: 2,
    explanation:
      "正解は「専横」です。横柄＝人を見下し、いばった態度をとること。傲岸＝おごり高ぶって、人を見下すこと。尊大＝いばって、偉そうに構える様子。",
  },
  {
    meaning: "何もせず、ぶらぶらと日々を過ごすこと",
    options: ["安逸（あんいつ）", "懶惰（らんだ）", "遊惰（ゆうだ）", "無為"],
    correctIndex: 3,
    explanation:
      "正解は「無為」です。安逸＝特に何もせず、気楽に過ごすこと。懶惰＝なまけて、だらしないこと。遊惰＝なまけて、怠ること。",
  },
  {
    meaning: "前もって予測することができないこと",
    options: ["不測の", "不慮の", "不意の", "不時の"],
    correctIndex: 0,
    explanation:
      "正解は「不測の」です。不慮の＝思いがけないこと。不意の＝予告なく、突然であること。不時の＝思いがけない時に、起こること。",
  },
  {
    meaning: "以前から、かねて抱き続けている願い",
    options: ["念願", "宿願", "悲願", "本懐（ほんかい）"],
    correctIndex: 1,
    explanation:
      "正解は「宿願」です。念願＝長い間、心に思い続けてきた願い。悲願＝なんとしても成し遂げたいと、強く願う望み。本懐＝もともと抱いていた、本来の望み。",
  },
  {
    meaning: "（特に人物の将来性などに）望みをかけること",
    options: ["期待", "待望", "嘱望", "渇望"],
    correctIndex: 2,
    explanation:
      "正解は「嘱望」です。期待＝よい結果を見込んで、待ち望むこと。待望＝あることの実現を、待ち望むこと。渇望＝喉が渇くように、強く欲すること。",
  },
];

const CATEGORY = "verbal";
const SUB_CATEGORY = "語彙";
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
    const questionText = `以下の意味と最も合致する語句を選びなさい。\n\n「${q.meaning}」`;
    const indexed = q.options.map((text, i) => ({ text, isCorrect: i === q.correctIndex }));
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

  writeFileSync(new URL("./seed_spi_vocabulary_3.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements.`);
}

main();
