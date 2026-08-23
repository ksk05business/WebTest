// 玉手箱「英語」科目 長文読解（IMAGES形式）の問題を生成するスクリプト。
// 元データ: ユーザー提供の tamatebako_reading_comprehension_10.md（長文10本×設問3問=30問）。
// category=tamatebako_english, sub_category=長文読解（IMAGES形式） として挿入する。
// 実行: node scripts/seed-tamatebako-english-reading.mts
// → scripts/seed_tamatebako_english_reading.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type Question = {
  question: string;
  options: [string, string, string, string, string];
  correctIndex: number; // 0=A, 1=B, 2=C, 3=D, 4=E
  explanation: string;
};

type Passage = {
  title: string;
  passage: string;
  source: string; // originality_note用の出典メモ
  questions: [Question, Question, Question];
};

const PASSAGES: Passage[] = [
  {
    title: "Turkish Coffee",
    passage:
      'For coffee lovers who want to see history in a cup, Turkey is the place to go. Turkish coffee has been brewed the same way for over 500 years, and in 2013, UNESCO added the tradition to its list of Intangible Cultural Heritage. Unlike drip coffee, Turkish coffee is made by boiling very finely ground beans with water in a small copper pot called a "cezve." It is never filtered, so a thick layer of grounds settles at the bottom of the cup. Many families in Istanbul still serve it in tiny porcelain cups alongside a piece of Turkish delight, a sweet treat made from sugar and starch. Visitors to a traditional coffeehouse can watch baristas prepare the drink over hot sand rather than an open flame, a method that heats the coffee slowly and evenly. After finishing the coffee, some people turn their cup upside down on the saucer. Once the grounds cool and dry, a fortune teller reads the shapes left inside the cup, a custom known as "tasseography." Every August, the city of Istanbul hosts a coffee festival where roasters from across the country gather to share their techniques.',
    source: "Excerpt adapted from general travel and culture writing on Turkish coffee traditions.",
    questions: [
      {
        question: "What did UNESCO do in 2013?",
        options: [
          "Opened a coffee festival in Istanbul",
          "Banned the use of copper pots",
          "Added Turkish coffee to its Intangible Cultural Heritage list",
          "Discovered a new coffee bean",
          "Built a museum about tasseography",
        ],
        correctIndex: 2,
        explanation:
          "本文2文目「in 2013, UNESCO added the tradition to its list of Intangible Cultural Heritage」に明記。「2013年」「UNESCO」をキーワードに該当箇所を探すのが速い。",
      },
      {
        question: "What can visitors do in a traditional coffeehouse?",
        options: [
          "learn how to grow coffee beans",
          "watch baristas prepare coffee over hot sand",
          "drink Turkish delight instead of coffee",
          "buy a copper cezve to take home",
          "roast their own beans",
        ],
        correctIndex: 1,
        explanation:
          "「Visitors to a traditional coffeehouse can watch baristas prepare the drink over hot sand」と一致。A・C・D・Eはいずれも本文に根拠なし。",
      },
      {
        question: "When does Istanbul host its coffee festival?",
        options: [
          "Every time a fortune teller visits",
          "Every November",
          "Every August",
          "Every time a new coffeehouse opens",
          "Every time UNESCO updates its list",
        ],
        correctIndex: 2,
        explanation:
          "「Every August, the city of Istanbul hosts a coffee festival」と明記。“festival”をキーワードに文末付近を探すと見つかる。",
      },
    ],
  },
  {
    title: "Andean Quinoa",
    passage:
      'Quinoa has become a popular "superfood" around the world, but people in the Andes Mountains of Peru and Bolivia have grown it for more than 5,000 years. Ancient Incan farmers called quinoa the "mother grain" and believed it gave warriors strength before battle. Unlike wheat or rice, quinoa is technically a seed, not a true grain, and it contains all nine essential amino acids that the human body needs. Because it grows well at high altitudes and in poor soil, quinoa was a key crop for Andean communities living more than 3,000 meters above sea level. Today, farmers in the region still grow more than 3,000 varieties, ranging in color from white to red to black. Visitors to Andean markets can sample quinoa soup, quinoa bread, and even a fermented quinoa drink called "chicha." Each June, the town of Puno in Peru holds a harvest festival where farmers give thanks for the season’s crop and share traditional quinoa dishes with tourists.',
    source: "Excerpt adapted from general agricultural and cultural writing on Andean quinoa farming.",
    questions: [
      {
        question: "How long have people in the Andes grown quinoa?",
        options: [
          "About 500 years",
          "More than 5,000 years",
          "Since the 1900s",
          "About 3,000 years",
          "Since UNESCO recognized it",
        ],
        correctIndex: 1,
        explanation: "「people in the Andes Mountains of Peru and Bolivia have grown it for more than 5,000 years」と一致。",
      },
      {
        question: "What can visitors do at Andean markets?",
        options: [
          "buy quinoa seeds to plant at home",
          "sample quinoa soup, bread, and chicha",
          "meet Incan warriors",
          "learn to farm at 3,000 meters",
          "watch quinoa being turned into wheat",
        ],
        correctIndex: 1,
        explanation:
          "「Visitors to Andean markets can sample quinoa soup, quinoa bread, and even a fermented quinoa drink called “chicha.”」に明記。",
      },
      {
        question: "When does Puno hold its harvest festival?",
        options: [
          "Every time a new variety is found",
          "Every March",
          "Every June",
          "Every time tourists arrive",
          "Every October",
        ],
        correctIndex: 2,
        explanation: "「Each June, the town of Puno in Peru holds a harvest festival」と一致。",
      },
    ],
  },
  {
    title: "Icelandic Geothermal Energy",
    passage:
      "Iceland sits on top of one of the most active volcanic zones on Earth, and instead of fighting this heat, Icelanders have learned to use it. Nearly 90 percent of homes in Iceland are heated using geothermal energy, water and steam drawn from deep underground. The practice began in the early 20th century, but it expanded quickly after 1930, when the city of Reykjavik built the first large-scale geothermal heating system. Today, geothermal power plants also generate about a quarter of the country’s electricity. Visitors can experience this natural resource firsthand at the Blue Lagoon, a warm, mineral-rich pool formed from the runoff of a nearby power plant. Tourists often cover their faces in white silica mud, which is said to be good for the skin. Iceland also uses geothermal heat to warm greenhouses, allowing farmers to grow bananas and tomatoes despite the cold climate outside. Every February, the town of Hveragerdi holds a geothermal festival, inviting visitors to learn about the science behind the country’s hot springs.",
    source: "Excerpt adapted from general science and travel writing on Icelandic geothermal energy.",
    questions: [
      {
        question: "What happened after 1930 in Reykjavik?",
        options: [
          "The Blue Lagoon was discovered",
          "The city built the first large-scale geothermal heating system",
          "Volcanic activity stopped",
          "Farmers stopped growing bananas",
          "Electricity use fell by a quarter",
        ],
        correctIndex: 1,
        explanation:
          "「it expanded quickly after 1930, when the city of Reykjavik built the first large-scale geothermal heating system」と一致。",
      },
      {
        question: "What can visitors do at the Blue Lagoon?",
        options: [
          "grow tomatoes in a greenhouse",
          "cover their faces in white silica mud",
          "generate their own electricity",
          "visit a volcano up close",
          "learn to farm bananas",
        ],
        correctIndex: 1,
        explanation: "「Tourists often cover their faces in white silica mud」と明記。",
      },
      {
        question: "When does Hveragerdi hold its geothermal festival?",
        options: [
          "Every time a volcano erupts",
          "Every July",
          "Every February",
          "Every time a new power plant opens",
          "Every time the Blue Lagoon is renovated",
        ],
        correctIndex: 2,
        explanation: "「Every February, the town of Hveragerdi holds a geothermal festival」に一致。",
      },
    ],
  },
  {
    title: "Vietnamese Egg Coffee",
    passage:
      'In Vietnam, coffee culture looks a little different from the rest of the world. During the French colonial period in the late 19th century, dairy milk was expensive and hard to keep fresh in Vietnam’s hot climate, so people began using sweetened condensed milk instead. This tradition continues today in a drink called "ca phe sua da," or Vietnamese iced coffee. In 1946, during a period of milk shortages, a Hanoi bartender named Nguyen Van Giang created an even richer version by whipping egg yolks with condensed milk and pouring the mixture over strong coffee. The result, known as "egg coffee" or "ca phe trung," tastes similar to a light custard or tiramisu. Visitors to Hanoi’s Old Quarter can watch baristas whisk the egg mixture by hand until it becomes thick and foamy. Many small cafes keep the coffee warm in a bowl of hot water so the egg topping does not cool too quickly. Every autumn, coffee shops across Hanoi hold tasting events to celebrate the city’s unique coffee culture.',
    source: "Excerpt adapted from general food and travel writing on Vietnamese coffee traditions.",
    questions: [
      {
        question: "Why did people in Vietnam start using condensed milk in coffee?",
        options: [
          "Fresh dairy milk was expensive and hard to keep fresh",
          "Egg yolks were unavailable",
          "The French banned dairy farming",
          "Condensed milk was cheaper than coffee",
          "A bartender invented it in 1946",
        ],
        correctIndex: 0,
        explanation:
          "「dairy milk was expensive and hard to keep fresh in Vietnam’s hot climate, so people began using sweetened condensed milk instead」に一致。",
      },
      {
        question: "What can visitors do in Hanoi’s Old Quarter?",
        options: [
          "buy fresh dairy milk",
          "watch baristas whisk egg mixture by hand",
          "learn to farm coffee beans",
          "meet Nguyen Van Giang",
          "taste tiramisu made in France",
        ],
        correctIndex: 1,
        explanation: "「Visitors to Hanoi’s Old Quarter can watch baristas whisk the egg mixture by hand」と明記。",
      },
      {
        question: "When do Hanoi’s coffee shops hold tasting events?",
        options: ["Every spring", "Every autumn", "Every time milk runs short", "Every time a new cafe opens", "Every winter"],
        correctIndex: 1,
        explanation: "「Every autumn, coffee shops across Hanoi hold tasting events」に一致。",
      },
    ],
  },
  {
    title: "Moroccan Argan Oil",
    passage:
      'In the dry, rocky region of southwestern Morocco, one tree grows almost nowhere else on Earth: the argan tree. For centuries, Berber women have collected the fruit of this tree and cracked open its hard shells by hand to extract the seeds inside, which are then pressed into a golden oil. It can take nearly 20 hours of labor to produce just one liter of pure argan oil, which is why it is often called "liquid gold." In 1999, local women formed cooperatives to protect their traditional methods and ensure fair pay, and in 2014, UNESCO recognized argan oil production as part of the region’s Intangible Cultural Heritage. The oil is used both in cooking, drizzled over bread and couscous, and in cosmetics, where it is prized for moisturizing skin and hair. Visitors to cooperatives near the city of Essaouira can watch the entire process, from cracking shells to grinding seeds with a traditional stone mill. Every December, the town of Taroudant hosts an argan festival celebrating the tree and the women who have preserved this craft for generations.',
    source: "Excerpt adapted from general cultural and agricultural writing on Moroccan argan oil.",
    questions: [
      {
        question: "What did UNESCO do in 2014?",
        options: [
          "Banned the export of argan oil",
          "Recognized argan oil production as Intangible Cultural Heritage",
          "Built a cooperative near Essaouira",
          "Discovered a new use for argan oil",
          "Opened the Taroudant festival",
        ],
        correctIndex: 1,
        explanation:
          "「in 2014, UNESCO recognized argan oil production as part of the region’s Intangible Cultural Heritage」と一致。",
      },
      {
        question: "What can visitors do at cooperatives near Essaouira?",
        options: [
          "plant new argan trees",
          "watch the process from cracking shells to grinding seeds",
          "learn to cook couscous",
          "buy land to grow argan trees",
          "meet UNESCO officials",
        ],
        correctIndex: 1,
        explanation:
          "「Visitors to cooperatives near the city of Essaouira can watch the entire process, from cracking shells to grinding seeds」に明記。",
      },
      {
        question: "When does Taroudant host its argan festival?",
        options: [
          "Every time a cooperative is formed",
          "Every May",
          "Every December",
          "Every time UNESCO visits",
          "Every time oil prices rise",
        ],
        correctIndex: 2,
        explanation: "「Every December, the town of Taroudant hosts an argan festival」と一致。",
      },
    ],
  },
  {
    title: "Finnish Sauna Culture",
    passage:
      'Finland has more saunas than cars, with an estimated 3.3 million saunas for a population of about 5.5 million people. The tradition dates back at least 2,000 years, and for many Finns, the sauna was historically not just a place to bathe but also where babies were born and the sick were cared for, since it was considered the cleanest room in the house. In 2020, UNESCO added the Finnish sauna culture to its list of Intangible Cultural Heritage. A traditional sauna is heated by throwing water over hot stones, creating steam called "loyly." Many Finns then cool off by jumping into a lake or rolling in snow before returning to the heat. Visitors can experience this contrast at public saunas throughout Helsinki, some of which sit right on the waterfront. Business meetings, family gatherings, and even political discussions have historically taken place in the sauna, reflecting its central role in Finnish social life. Every June, the town of Jyvaskyla hosts a sauna festival featuring wood-fired saunas built by local craftspeople.',
    source: "Excerpt adapted from general cultural writing on Finnish sauna traditions.",
    questions: [
      {
        question: "What did UNESCO do in 2020?",
        options: [
          "Counted the number of saunas in Finland",
          "Added Finnish sauna culture to its Intangible Cultural Heritage list",
          "Banned wood-fired saunas",
          "Built a sauna in Helsinki",
          "Opened the Jyvaskyla festival",
        ],
        correctIndex: 1,
        explanation: "「In 2020, UNESCO added the Finnish sauna culture to its list of Intangible Cultural Heritage」と一致。",
      },
      {
        question: "What can visitors do in Helsinki?",
        options: [
          "give birth in a traditional sauna",
          "experience public saunas on the waterfront",
          "attend political meetings only",
          "build their own wood-fired sauna",
          "count the country’s saunas",
        ],
        correctIndex: 1,
        explanation:
          "「Visitors can experience this contrast at public saunas throughout Helsinki, some of which sit right on the waterfront」に一致。",
      },
      {
        question: "When does Jyvaskyla host its sauna festival?",
        options: [
          "Every time snow falls",
          "Every January",
          "Every June",
          "Every time UNESCO updates its list",
          "Every time a baby is born",
        ],
        correctIndex: 2,
        explanation: "「Every June, the town of Jyvaskyla hosts a sauna festival」と明記。",
      },
    ],
  },
  {
    title: "Ethiopian Coffee Ceremony",
    passage:
      'Ethiopia is widely believed to be the birthplace of coffee, and according to legend, a goat herder named Kaldi discovered the plant around the 9th century after noticing his goats became energetic after eating its red berries. Whether or not the legend is true, coffee remains deeply woven into Ethiopian daily life through a ritual known as the coffee ceremony. Unlike a quick cup at a cafe, the ceremony can take more than an hour and typically happens three times a day in many households. Green beans are washed, roasted over an open flame, and ground by hand before being brewed in a clay pot called a "jebena." The host walks around the room, letting guests smell the roasting beans before serving three rounds of coffee, each considered weaker and more spiritually significant than the last. Visitors to Ethiopia can join a coffee ceremony in homes, markets, or specialty cafes in the capital, Addis Ababa. Every October, the country celebrates a national coffee day, honoring the crop’s deep connection to Ethiopian culture and economy.',
    source: "Excerpt adapted from general cultural and agricultural writing on Ethiopian coffee traditions.",
    questions: [
      {
        question: "According to legend, who discovered coffee?",
        options: [
          "A bartender in Addis Ababa",
          "A goat herder named Kaldi",
          "A UNESCO researcher",
          "French colonists",
          "A group of farmers in the 20th century",
        ],
        correctIndex: 1,
        explanation: "「according to legend, a goat herder named Kaldi discovered the plant」と一致。",
      },
      {
        question: "What can visitors do in Ethiopia?",
        options: [
          "join a coffee ceremony in homes, markets, or cafes",
          "buy a jebena in France",
          "skip the roasting process",
          "taste only one round of coffee",
          "watch goats eat coffee berries",
        ],
        correctIndex: 0,
        explanation: "「Visitors to Ethiopia can join a coffee ceremony in homes, markets, or specialty cafes」に明記。",
      },
      {
        question: "When does Ethiopia celebrate national coffee day?",
        options: [
          "Every time a ceremony is held",
          "Every March",
          "Every October",
          "Every time goats become energetic",
          "Every time a jebena is made",
        ],
        correctIndex: 2,
        explanation: "「Every October, the country celebrates a national coffee day」と一致。",
      },
    ],
  },
  {
    title: "Mexican Chocolate History",
    passage:
      'Long before chocolate became a sweet treat, it was a bitter, spiced drink enjoyed by the Aztec and Maya civilizations of Mexico. Cacao beans were so valuable that the Aztecs used them as a form of currency, and only nobility and warriors were typically allowed to drink chocolate, which was mixed with chili peppers, water, and cornmeal rather than sugar. Spanish colonizers brought cacao back to Europe in the 16th century, where sugar was eventually added, transforming the bitter drink into the sweet chocolate known today. In parts of Mexico, however, the traditional spiced drink survives in a beverage called "champurrado," a thick, warm chocolate drink made with masa, a corn-based dough, and often served with cinnamon. Visitors to the state of Oaxaca can watch cacao beans being ground by hand on a traditional stone tool called a "metate," a method still used by some local chocolate makers. Every July, the city of Oaxaca hosts a chocolate festival where visitors can sample dozens of varieties, from bitter drinking chocolate to sweet chocolate bars.',
    source: "Excerpt adapted from general cultural and food history writing on Mexican chocolate traditions.",
    questions: [
      {
        question: "How did the Aztecs use cacao beans?",
        options: [
          "As a form of currency",
          "As a sweetener for corn",
          "To feed warriors before battle",
          "As building material",
          "To trade with Spanish colonizers",
        ],
        correctIndex: 0,
        explanation: "「Cacao beans were so valuable that the Aztecs used them as a form of currency」と一致。",
      },
      {
        question: "What can visitors do in Oaxaca?",
        options: [
          "watch cacao beans ground on a metate",
          "taste only sweet chocolate bars",
          "meet Aztec nobility",
          "learn to grow chili peppers",
          "buy sugar from Europe",
        ],
        correctIndex: 0,
        explanation:
          '「Visitors to the state of Oaxaca can watch cacao beans being ground by hand on a traditional stone tool called a “metate”」に明記。',
      },
      {
        question: "When does Oaxaca host its chocolate festival?",
        options: [
          "Every time a new metate is made",
          "Every July",
          "Every April",
          "Every time cacao prices rise",
          "Every time Spanish colonizers visit",
        ],
        correctIndex: 1,
        explanation: "「Every July, the city of Oaxaca hosts a chocolate festival」と一致。",
      },
    ],
  },
  {
    title: "New Zealand Kiwifruit",
    passage:
      'The kiwifruit, now closely associated with New Zealand, actually originated in China, where it was known as the "Chinese gooseberry" and had been grown for centuries. Seeds were brought to New Zealand in 1904 by a schoolteacher named Isabel Fraser, who had visited mission schools in China. New Zealand growers spent decades developing the fruit, and by the 1960s, exporters renamed it "kiwifruit" after the country’s native bird to make it more appealing to international markets, particularly in the United States. Today, New Zealand is one of the world’s largest kiwifruit exporters, and the Bay of Plenty region alone produces the majority of the country’s crop. Visitors to orchards in the region can pick fruit directly from the vines during the harvest season, which typically runs from March to May. Some orchards also offer tastings of gold kiwifruit, a sweeter variety with smooth, hairless skin developed by New Zealand scientists in the 1990s. Every June, the town of Te Puke, known as the kiwifruit capital, hosts a festival celebrating the fruit’s history and its importance to the local economy.',
    source: "Excerpt adapted from general agricultural and cultural writing on New Zealand kiwifruit history.",
    questions: [
      {
        question: "Who brought kiwifruit seeds to New Zealand in 1904?",
        options: [
          "A group of scientists",
          "A schoolteacher named Isabel Fraser",
          "Exporters from the United States",
          "Farmers from the Bay of Plenty",
          "A team from Te Puke",
        ],
        correctIndex: 1,
        explanation: "「Seeds were brought to New Zealand in 1904 by a schoolteacher named Isabel Fraser」と一致。",
      },
      {
        question: "What can visitors do at orchards in the Bay of Plenty?",
        options: [
          "pick fruit directly from the vines",
          "rename the fruit",
          "visit mission schools",
          "export fruit to China",
          "develop new kiwi varieties themselves",
        ],
        correctIndex: 0,
        explanation: "「Visitors to orchards in the region can pick fruit directly from the vines during the harvest season」に明記。",
      },
      {
        question: "When does Te Puke host its kiwifruit festival?",
        options: [
          "Every time gold kiwifruit is developed",
          "Every June",
          "Every January",
          "Every time exporters visit",
          "Every time the harvest fails",
        ],
        correctIndex: 1,
        explanation: "「Every June, the town of Te Puke...hosts a festival」と一致。",
      },
    ],
  },
  {
    title: "Japanese Matcha Tea",
    passage:
      'Matcha, the vivid green powdered tea now popular around the world, has roots in Japanese Zen Buddhism dating back to the 12th century, when a monk named Eisai brought tea seeds and preparation methods back from China. Unlike regular green tea, matcha is made from shade-grown leaves that are steamed, dried, and ground into a fine powder using a stone mill, a process that can take up to an hour to produce just 30 grams of matcha. Because the whole leaf is consumed rather than steeped and discarded, matcha contains more caffeine and antioxidants than typical brewed tea. The tea became central to the Japanese tea ceremony, or "chanoyu," a ritual that emphasizes harmony, respect, and tranquility. Visitors to Kyoto can take part in a traditional tea ceremony, learning the precise movements used to whisk matcha into a smooth, frothy drink using a bamboo whisk called a "chasen." Every April, the city of Uji, one of Japan’s most famous tea-growing regions, hosts a tea festival celebrating the harvest of new tea leaves.',
    source: "Excerpt adapted from general cultural and food history writing on Japanese matcha traditions.",
    questions: [
      {
        question: "Who brought tea seeds and preparation methods from China in the 12th century?",
        options: [
          "A tea farmer from Uji",
          "A monk named Eisai",
          "A group of shoguns",
          "Chinese exporters",
          "A tea ceremony master",
        ],
        correctIndex: 1,
        explanation: "「a monk named Eisai brought tea seeds and preparation methods back from China」と一致。",
      },
      {
        question: "What can visitors do in Kyoto?",
        options: [
          "grind their own stone mills",
          "take part in a traditional tea ceremony",
          "harvest tea leaves in April only",
          "buy bamboo whisks from China",
          "learn Zen Buddhism from monks",
        ],
        correctIndex: 1,
        explanation: "「Visitors to Kyoto can take part in a traditional tea ceremony」に明記。",
      },
      {
        question: "When does Uji host its tea festival?",
        options: [
          "Every time a chasen is made",
          "Every April",
          "Every October",
          "Every time a new monk arrives",
          "Every time matcha prices change",
        ],
        correctIndex: 1,
        explanation: "「Every April, the city of Uji...hosts a tea festival」と一致。",
      },
    ],
  },
];

const CATEGORY = "tamatebako_english";
const SUB_CATEGORY = "長文読解（IMAGES形式）";
const GROUP_ID_START = 21; // 既存の最大passage_group_id(20)の次から採番

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function main() {
  const lines: string[] = [];

  PASSAGES.forEach((p, pIdx) => {
    const groupId = GROUP_ID_START + pIdx;
    const originalityNote = `ユーザー提供のオリジナル英文（一般知識ベースの創作文）。${p.source} 市販教材・書籍からの引用なし。`;

    p.questions.forEach((q) => {
      const questionText = `${p.passage}\n\n【設問】\n${q.question}`;
      const optionsJson = JSON.stringify(q.options);
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

  writeFileSync(new URL("./seed_tamatebako_english_reading.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements (${PASSAGES.length} passages x 3 questions).`);
}

main();
