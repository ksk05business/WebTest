// 玉手箱「英語」科目 論理的読解（GAB形式）の問題を生成するスクリプト。
// 元データ: ユーザー提供の 玉手箱_論理的読解_問題集.md（長文10本×設問3問=30問、TRUE/UNTRUE/CANNOT SAY形式）。
// category=tamatebako_english, sub_category=論理的読解（GAB形式） として挿入する。
// 実行: node scripts/seed-tamatebako-english-gab.mts
// → scripts/seed_tamatebako_english_gab.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type Question = {
  statement: string;
  correctIndex: 0 | 1 | 2; // 0=TRUE, 1=UNTRUE, 2=CANNOT SAY
  explanation: string;
};

type Passage = {
  title: string;
  passage: string;
  questions: [Question, Question, Question];
};

const OPTIONS = ["TRUE", "UNTRUE", "CANNOT SAY"] as const;

const PASSAGES: Passage[] = [
  {
    title: "Honey and Ancient Egypt",
    passage:
      "The honey found in ancient Egyptian tombs, some more than 3,000 years old, was still fit to eat when archaeologists opened the sites. This is because honey contains very little water and is naturally acidic, an environment in which bacteria struggle to survive. Bees also add an enzyme to nectar that produces a small amount of hydrogen peroxide, which works as a natural preservative. As long as honey is stored in a sealed container away from moisture, it can remain edible almost indefinitely.",
    questions: [
      {
        statement: "Honey found in ancient Egyptian tombs had completely spoiled by the time it was discovered.",
        correctIndex: 1,
        explanation:
          "本文冒頭に「was still fit to eat（まだ食べられる状態だった）」とあり、設問文とは正反対の内容です。本文の記述と逆のことを述べている場合はUNTRUEを選びます。",
      },
      {
        statement: "Bees add an enzyme to nectar that produces hydrogen peroxide.",
        correctIndex: 0,
        explanation:
          "本文に「Bees also add an enzyme to nectar that produces a small amount of hydrogen peroxide」とあり、設問文と一致します。本文の表現とほぼ同じ内容が問われている場合はTRUEを選びやすいパターンです。",
      },
      {
        statement: "Honey was often used as an offering to the pharaoh in ancient Egypt.",
        correctIndex: 2,
        explanation:
          "本文は蜂蜜が腐りにくい理由について述べていますが、「ファラオへの捧げ物として使われた」という情報は一切含まれていません。一般的な知識で判断せず、本文に書かれていない内容はCANNOT SAYを選びます。",
      },
    ],
  },
  {
    title: "The Great Wall of China",
    passage:
      "The Great Wall of China was not built as a single continuous project but was constructed and rebuilt by different dynasties over more than two thousand years. Many of the sections seen by tourists today date from the Ming Dynasty, which reinforced the wall with brick and stone. Contrary to a popular myth, the wall is not visible to the naked eye from the moon. It stretches for thousands of kilometers across northern China, following the natural contours of mountains and valleys.",
    questions: [
      {
        statement: "The Great Wall of China was built entirely during the Ming Dynasty.",
        correctIndex: 1,
        explanation:
          "本文は「different dynasties over more than two thousand years（複数の王朝が2000年以上かけて）」建設・改修したと述べており、明王朝だけで作られたわけではありません。「今見える部分の多くが明代のもの」であって「全てが明代に作られた」わけではない点に注意が必要です。",
      },
      {
        statement: "The wall follows the natural contours of mountains and valleys.",
        correctIndex: 0,
        explanation: "本文最後に「following the natural contours of mountains and valleys」とそのまま記載されています。本文の表現がほぼそのまま設問になっているパターンです。",
      },
      {
        statement: "The wall was originally built to promote trade along the Silk Road.",
        correctIndex: 2,
        explanation:
          "本文には万里の長城の建設目的（防衛など）についての記述が一切なく、シルクロード交易についても触れられていません。「常識的にありそう」でも本文に記載がなければCANNOT SAYを選びます。",
      },
    ],
  },
  {
    title: "The Origin of Chewing Gum",
    passage:
      "Modern chewing gum has its roots in chicle, a natural gum harvested from the sapodilla tree in Central America. In the 1860s, a Mexican general introduced chicle to an American inventor, who tried unsuccessfully to use it as a rubber substitute. Failing at that goal, he began experimenting with it as a chewable treat and added flavoring to make it more appealing. The product eventually became the basis for many chewing gum brands sold today, although most modern gum now uses synthetic rubber instead of natural chicle.",
    questions: [
      {
        statement: "Chicle was originally intended to be used as a substitute for rubber.",
        correctIndex: 0,
        explanation: "本文に「tried unsuccessfully to use it as a rubber substitute」とあり、ゴムの代用品として使おうとしたことが明記されています。",
      },
      {
        statement: "Most chewing gum sold today still contains natural chicle.",
        correctIndex: 1,
        explanation:
          "本文最後に「most modern gum now uses synthetic rubber instead of natural chicle（今日のガムの多くは天然チクルではなく合成ゴムを使用）」とあり、設問文とは逆の内容です。",
      },
      {
        statement: "The American inventor had previously lived in Central America for many years.",
        correctIndex: 2,
        explanation:
          "本文にはメキシコの将軍がチクルをアメリカ人発明家に紹介したとありますが、その発明家自身が中央アメリカに住んでいたかどうかについては一切記述がありません。",
      },
    ],
  },
  {
    title: "The Invention of the Telephone",
    passage:
      'Alexander Graham Bell is widely credited with inventing the telephone and was awarded the first US patent for the device in 1876. However, other inventors, including Elisha Gray, were working on similar technology at around the same time, and some historians argue that Bell may have used ideas from Gray\'s designs. Bell\'s device transmitted the human voice electrically for the first time, and his famous first words to his assistant were reportedly, "Mr. Watson, come here, I want to see you." The telephone rapidly transformed communication, though it took several decades before it became common in ordinary households.',
    questions: [
      {
        statement: "Alexander Graham Bell was the only person working on telephone technology around 1876.",
        correctIndex: 1,
        explanation:
          "本文に「other inventors, including Elisha Gray, were working on similar technology at around the same time」とあり、ベル以外にも同様の技術を開発していた人物がいたことが分かります。",
      },
      {
        statement: "Bell was awarded the first US patent for the telephone in 1876.",
        correctIndex: 0,
        explanation: "本文冒頭に「was awarded the first US patent for the device in 1876」とそのまま記載されています。",
      },
      {
        statement: "Bell worked as a university professor before inventing the telephone.",
        correctIndex: 2,
        explanation:
          "本文にはベルの発明経緯や助手とのやり取りは書かれていますが、発明以前の経歴（大学教授だったかどうか）については触れられていません。",
      },
    ],
  },
  {
    title: "The Origin of the Sandwich",
    passage:
      "The sandwich is said to be named after John Montagu, the 4th Earl of Sandwich, an English aristocrat of the 18th century. According to a popular story, Montagu was fond of gambling and asked for meat to be served between two slices of bread so that he would not have to leave the gaming table to eat. Whether or not this story is entirely accurate, the name stuck, and the format of meat or other fillings between bread quickly became popular among the British upper class. Today, sandwiches are eaten in countless variations around the world.",
    questions: [
      {
        statement: "The sandwich is named after an English aristocrat.",
        correctIndex: 0,
        explanation: "本文冒頭に「named after John Montagu, the 4th Earl of Sandwich, an English aristocrat」とあり、設問文と一致します。",
      },
      {
        statement: "Montagu asked for the dish because he could not afford proper meals.",
        correctIndex: 1,
        explanation:
          "本文では、ギャンブル好きで食事のためにゲームの席を離れたくなかったことが理由とされており、「食事を買う余裕がなかった」という記述はなく、むしろ理由として書かれている内容と矛盾します。",
      },
      {
        statement: "Montagu's favorite card game was poker.",
        correctIndex: 2,
        explanation: "本文には「fond of gambling（ギャンブル好き）」とあるのみで、具体的なゲームの種類には触れられていません。",
      },
    ],
  },
  {
    title: "The Discovery of Coffee",
    passage:
      "According to legend, coffee was discovered in Ethiopia by a goat herder named Kaldi, who noticed that his goats became unusually energetic after eating berries from a certain tree. Curious, Kaldi tried the berries himself and reported a similar feeling of alertness. He brought the berries to a local monastery, where the monks eventually made a drink from them to help stay awake during long hours of prayer. From there, knowledge of the plant is believed to have spread across the Arabian Peninsula and eventually to the rest of the world.",
    questions: [
      {
        statement: "Kaldi first noticed coffee's effects by observing his goats.",
        correctIndex: 0,
        explanation: "本文に「noticed that his goats became unusually energetic after eating berries」とあり、設問文と一致します。",
      },
      {
        statement: "The monks refused to use the berries because they interfered with prayer.",
        correctIndex: 1,
        explanation:
          "本文には「the monks eventually made a drink from them to help stay awake during long hours of prayer（祈りの間眠らずにいるために飲み物を作った）」とあり、拒否したのではなく積極的に活用したことが分かります。",
      },
      {
        statement: "Kaldi later became a monk at the local monastery.",
        correctIndex: 2,
        explanation: "本文にはカルディがベリーを修道院に持ち込んだことは書かれていますが、その後彼自身が修道士になったという記述はありません。",
      },
    ],
  },
  {
    title: "The Printing Press",
    passage:
      "Johannes Gutenberg introduced the movable-type printing press in Europe around 1440, dramatically changing the way books were produced. Before his invention, books were copied by hand, a slow and expensive process that limited how many people could own or read them. Gutenberg's press used reusable metal letters that could be arranged to print any text, then reused for the next page. His most famous work, the Gutenberg Bible, is considered one of the most significant books in the history of printing.",
    questions: [
      {
        statement: "Before Gutenberg's invention, books were mainly copied by hand.",
        correctIndex: 0,
        explanation: "本文に「Before his invention, books were copied by hand」とそのまま記載されています。",
      },
      {
        statement: "Gutenberg's printing press used letters made of wood.",
        correctIndex: 1,
        explanation: "本文には「reusable metal letters（再利用可能な金属製の活字）」とあり、木製ではなく金属製であることが明記されています。",
      },
      {
        statement: "Gutenberg traveled to China to study early printing techniques.",
        correctIndex: 2,
        explanation:
          "本文にはグーテンベルクの発明内容や功績は書かれていますが、中国への渡航や学習経験については一切記述がありません。",
      },
    ],
  },
  {
    title: "The Modern Olympic Games",
    passage:
      "The modern Olympic Games were revived in 1896 by Pierre de Coubertin, a French educator who believed that international sports competition could promote peace and understanding among nations. The first modern Games were held in Athens, Greece, in reference to the ancient Olympic tradition that began there centuries earlier. Only a small number of countries participated in the first modern Olympics, and nearly all of the athletes were men. Since then, the Games have grown into one of the largest international sporting events, held every four years and now including athletes from nearly every country in the world.",
    questions: [
      {
        statement: "The first modern Olympic Games were held in Athens, Greece.",
        correctIndex: 0,
        explanation: "本文に「The first modern Games were held in Athens, Greece」とそのまま記載されています。",
      },
      {
        statement: "Roughly half of the athletes at the first modern Olympics were women.",
        correctIndex: 1,
        explanation: "本文には「nearly all of the athletes were men（ほぼ全ての選手が男性だった）」とあり、設問文とは正反対の内容です。",
      },
      {
        statement: "Pierre de Coubertin later became the president of France.",
        correctIndex: 2,
        explanation:
          "本文にはクーベルタンがオリンピックを復興させたことは書かれていますが、その後の経歴（フランス大統領になったかどうか）については触れられていません。",
      },
    ],
  },
  {
    title: "The Discovery of Penicillin",
    passage:
      "Penicillin, the world's first widely used antibiotic, was discovered by Alexander Fleming in 1928, though the discovery was largely accidental. Fleming noticed that a mold had contaminated one of his bacterial cultures and that the bacteria around the mold had been destroyed. He identified the mold as a type of Penicillium and realized it produced a substance capable of killing bacteria. It took more than a decade, however, before other scientists developed methods to produce the substance in large enough quantities to be used as a medical treatment.",
    questions: [
      {
        statement: "Fleming deliberately grew the mold in order to test its effect on bacteria.",
        correctIndex: 1,
        explanation: "本文には「the discovery was largely accidental（発見は偶然によるものだった）」とあり、意図的に培養したわけではないことが分かります。",
      },
      {
        statement: "Fleming identified the mold as a type of Penicillium.",
        correctIndex: 0,
        explanation: "本文に「He identified the mold as a type of Penicillium」とそのまま記載されています。",
      },
      {
        statement: "Fleming was awarded the Nobel Prize for his discovery.",
        correctIndex: 2,
        explanation:
          "本文にはペニシリンの発見経緯と実用化までの経過は書かれていますが、フレミングがノーベル賞を受賞したかどうかについては記述がありません。",
      },
    ],
  },
  {
    title: "The Invention of the Zipper",
    passage:
      "The device now known as the zipper was patented in 1893 by Whitcomb Judson, though his early version was unreliable and did not sell well. It was later improved by Gideon Sundback, a Swedish-American engineer, who developed a more dependable design in 1913. Despite this improvement, the zipper was not widely adopted for clothing until decades later, when fashion designers began to incorporate it into everyday garments. Today, the zipper is used in countless products, from jackets and bags to tents and furniture covers.",
    questions: [
      {
        statement: "Whitcomb Judson's original design worked reliably and sold well from the start.",
        correctIndex: 1,
        explanation:
          "本文には「his early version was unreliable and did not sell well（初期のものは信頼性が低く、あまり売れなかった）」とあり、設問文とは正反対の内容です。",
      },
      {
        statement: "Gideon Sundback improved the zipper's design in 1913.",
        correctIndex: 0,
        explanation: "本文に「who developed a more dependable design in 1913」とあり、設問文と一致します。",
      },
      {
        statement: "The zipper was invented in Sweden.",
        correctIndex: 2,
        explanation:
          "本文にはサンドバックが「Swedish-American engineer（スウェーデン系アメリカ人技師）」とあるのみで、ジッパーの発明・特許自体はアメリカで行われたと読み取れます（発明者ジャドソンについても国名の明記なし）。発明地がスウェーデンだったとは本文からは判断できません。",
      },
    ],
  },
];

const CATEGORY = "tamatebako_english";
const SUB_CATEGORY = "論理的読解（GAB形式）";
const GROUP_ID_START = 31; // 既存の長文読解（IMAGES形式）投入後の最大passage_group_id(30)の次から採番

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function main() {
  const lines: string[] = [];

  PASSAGES.forEach((p, pIdx) => {
    const groupId = GROUP_ID_START + pIdx;
    const originalityNote =
      "ユーザー提供のオリジナル英文（一般知識ベースの創作文、TRUE/UNTRUE/CANNOT SAY形式）。市販教材・書籍からの引用なし。";

    p.questions.forEach((q) => {
      const questionText = `${p.passage}\n\n【設問】\n${q.statement}`;
      const optionsJson = JSON.stringify(OPTIONS);
      const explanationJson = JSON.stringify([q.explanation]);

      lines.push(
        `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id) VALUES ('${escapeSql(
          CATEGORY
        )}', '${escapeSql(SUB_CATEGORY)}', '${escapeSql(p.title)}', '${escapeSql(questionText)}', '${escapeSql(
          optionsJson
        )}', ${q.correctIndex}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(
          originalityNote
        )}', ${groupId});`
      );
    });
  });

  writeFileSync(new URL("./seed_tamatebako_english_gab.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements (${PASSAGES.length} passages x 3 questions).`);
}

main();
