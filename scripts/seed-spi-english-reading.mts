// SPI3「英語」科目 長文読解（英語）の問題を生成するスクリプト。
// 元データ: ユーザー提供の SPI英語長文読解問題集.md（長文10本×設問3問=30問）。
// 元データは正解がB・Cに極端に偏っていた（B:17問, C:10問, A:1問, D:2問, E:0問／全30問）ため、
// 出題時の偏りを避けるためスクリプト側で選択肢をシャッフルする。
// category=english, sub_category=長文読解（英語） として挿入する（既存の practiceUnits.ts の
// SPI「英語（能力）」グループに定義済みの単元）。
// 実行: node scripts/seed-spi-english-reading.mts
// → scripts/seed_spi_english_reading.sql を生成（このsqlファイル自体はコミットしない）。

import { writeFileSync } from "node:fs";

type Question = {
  question: string;
  options: [string, string, string, string, string];
  correctIndex: number;
  explanation: string;
};

type Passage = {
  title: string;
  passage: string;
  questions: [Question, Question, Question];
};

const PASSAGES: Passage[] = [
  {
    title: "The Four-Day Workweek",
    passage:
      'The idea of the four-day workweek has gained attention around the world in recent years. Several countries, including Iceland, Belgium, and the United Kingdom, have conducted large-scale trials in which employees worked four days a week while still receiving full pay. The results of these trials were largely positive: most companies reported that productivity remained the same or even improved, while employees experienced less stress and better work-life balance.\n\nHowever, not all industries can easily adopt this model. Sectors that require constant staffing, such as healthcare and manufacturing, face greater challenges in reducing working days without hiring additional staff. Critics also argue that a shorter workweek could increase pressure on employees to complete the same amount of work in less time, potentially leading to burnout rather than reducing it.\n\nDespite these concerns, a growing number of companies worldwide are experimenting with flexible schedules, suggesting that the traditional five-day workweek may not remain the standard forever.',
    questions: [
      {
        question: "According to the passage, what was a common result of the four-day workweek trials?",
        options: [
          "Productivity decreased significantly.",
          "Employees had to work longer hours each day.",
          "Productivity stayed the same or improved.",
          "Companies stopped paying full salaries.",
          "Only manufacturing companies participated.",
        ],
        correctIndex: 2,
        explanation:
          "本文2〜3行目に「productivity remained the same or even improved」とあり、生産性が維持または向上したことが述べられています。",
      },
      {
        question: "Which industries are described as facing difficulty adopting a four-day workweek?",
        options: [
          "Retail and finance",
          "Healthcare and manufacturing",
          "Education and technology",
          "Media and entertainment",
          "Agriculture and tourism",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「Sectors that require constant staffing, such as healthcare and manufacturing, face greater challenges」とあり、常時人員が必要な医療・製造業が課題を抱えていると述べられています。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Some critics worry that a shorter workweek could lead to burnout.\n② All countries have already adopted the four-day workweek permanently.\n③ Iceland is mentioned as one of the countries that trialed the system.",
        options: ["① only", "② only", "③ only", "① and ③", "② and ③"],
        correctIndex: 3,
        explanation:
          "本文に「could increase pressure on employees...leading to burnout」とあり①が正しく、また「Iceland, Belgium, and the United Kingdom」と明記されているため③も正しい内容です。②のように「すべての国が恒久的に導入した」とは述べられていません。",
      },
    ],
  },
  {
    title: "Coral Reefs",
    passage:
      'Coral reefs, often called the "rainforests of the sea," cover less than one percent of the ocean floor but support approximately twenty-five percent of all marine species. These ecosystems provide food and shelter for countless organisms, protect coastlines from storms, and generate significant income through tourism and fishing industries.\n\nIn recent decades, however, coral reefs have faced serious threats. Rising ocean temperatures caused by climate change lead to a phenomenon known as coral bleaching, in which corals expel the colorful algae living within their tissues, turning white and becoming more vulnerable to disease. Pollution, overfishing, and destructive fishing practices have further weakened reef ecosystems.\n\nScientists warn that if current trends continue, a large proportion of the world’s coral reefs could disappear within the coming decades. Conservation efforts, including the creation of marine protected areas and coral restoration projects, are underway, but experts agree that addressing climate change remains the most critical step for the long-term survival of these ecosystems.',
    questions: [
      {
        question: "What percentage of marine species do coral reefs support, according to the passage?",
        options: ["Less than 1%", "About 10%", "About 25%", "About 50%", "Nearly 100%"],
        correctIndex: 2,
        explanation: "本文冒頭に「support approximately twenty-five percent of all marine species」とあります。",
      },
      {
        question: "What happens to corals during coral bleaching?",
        options: [
          "They grow faster than usual.",
          "They expel algae and turn white.",
          "They multiply rapidly.",
          "They become more colorful.",
          "They move to deeper water.",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「corals expel the colorful algae living within their tissues, turning white」とあり、藻類を排出して白くなることが述べられています。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Coral reefs cover a large portion of the ocean floor.\n② Climate change is considered the most critical issue to address for reef survival.\n③ Conservation projects such as marine protected areas are currently being carried out.",
        options: ["① only", "② only", "① and ②", "② and ③", "①② and ③"],
        correctIndex: 3,
        explanation:
          "本文冒頭で「cover less than one percent of the ocean floor」と述べられているため①は誤りです。「addressing climate change remains the most critical step」から②、「marine protected areas and coral restoration projects, are underway」から③が正しいとわかります。",
      },
    ],
  },
  {
    title: "The Printing Press",
    passage:
      "Throughout history, the invention of the printing press by Johannes Gutenberg in the fifteenth century is often regarded as one of the most significant technological breakthroughs in human civilization. Before its invention, books were copied by hand, a slow and expensive process that limited the spread of knowledge to a small, privileged portion of society, primarily the clergy and the wealthy.\n\nGutenberg’s press used movable metal type, which allowed printers to produce multiple copies of a text far more quickly and cheaply than ever before. This innovation dramatically increased the availability of books, contributing to rising literacy rates across Europe. It also played a crucial role in spreading new ideas, including those associated with the Renaissance and the Protestant Reformation.\n\nSome historians argue that without the printing press, the rapid exchange of scientific and religious ideas that characterized the following centuries would have been impossible. In this sense, Gutenberg’s invention is often compared to the internet in terms of its transformative impact on how information is shared and consumed.",
    questions: [
      {
        question: "Before the printing press was invented, how were books typically produced?",
        options: [
          "Printed using wooden blocks",
          "Copied by hand",
          "Mass-produced in factories",
          "Written only by monks in Italy",
          "Not produced at all",
        ],
        correctIndex: 1,
        explanation: "本文1〜2行目に「books were copied by hand, a slow and expensive process」とあります。",
      },
      {
        question: "What technology did Gutenberg's press rely on?",
        options: [
          "Electric power",
          "Movable metal type",
          "Digital scanning",
          "Photographic plates",
          "Handwritten templates",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「Gutenberg's press used movable metal type」と明記されています。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Before the printing press, only the clergy and the wealthy had wide access to books.\n② The printing press had no connection to the Renaissance or the Reformation.\n③ Some historians compare the printing press's impact to that of the internet.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文1〜2行目「limited the spread of knowledge to...primarily the clergy and the wealthy」から①が正しく、末尾の「compared to the internet」という記述から③も正しいとわかります。②は「played a crucial role in spreading...Renaissance and the Protestant Reformation」という記述と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Sleep Regularity",
    passage:
      'Sleep researchers have long debated the ideal amount of sleep needed for adults to function at their best. While the commonly cited recommendation is seven to nine hours per night, a growing body of research suggests that both the quality and consistency of sleep may matter just as much as the total number of hours.\n\nStudies have shown that people who go to bed and wake up at irregular times, even if they get sufficient total sleep, tend to experience more fatigue and reduced cognitive performance than those with consistent sleep schedules. This has led some scientists to propose that "sleep regularity" should be considered alongside sleep duration when evaluating overall sleep health.\n\nAdditionally, exposure to artificial light from smartphones and computers before bedtime has been linked to delayed sleep onset and lower sleep quality. Experts recommend reducing screen time in the hour before sleep and maintaining a consistent bedtime, even on weekends, to improve both the quantity and quality of rest.',
    questions: [
      {
        question: "What is the commonly cited recommendation for adult sleep duration?",
        options: ["4 to 6 hours", "5 to 6 hours", "7 to 9 hours", "9 to 11 hours", "10 to 12 hours"],
        correctIndex: 2,
        explanation: "本文冒頭に「the commonly cited recommendation is seven to nine hours per night」とあります。",
      },
      {
        question:
          "According to the passage, what effect does irregular sleep timing have on people, even with sufficient total sleep?",
        options: [
          "It has no negative effect.",
          "It improves cognitive performance.",
          "It leads to more fatigue and reduced cognitive performance.",
          "It shortens the total amount of sleep needed.",
          "It increases the number of hours needed to fall asleep.",
        ],
        correctIndex: 2,
        explanation:
          "本文中盤に「tend to experience more fatigue and reduced cognitive performance than those with consistent sleep schedules」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Sleep regularity may be as important as total sleep duration.\n② Screen exposure before bedtime has no impact on sleep quality.\n③ Experts recommend maintaining a consistent bedtime even on weekends.",
        options: ["① only", "② only", "① and ③", "② and ③", "①② and ③"],
        correctIndex: 2,
        explanation:
          "本文冒頭「the quality and consistency of sleep may matter just as much as the total number of hours」から①が正しく、末尾「maintaining a consistent bedtime, even on weekends」から③も正しいとわかります。②は「exposure to artificial light...has been linked to delayed sleep onset and lower sleep quality」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "The Assembly Line",
    passage:
      "In the early twentieth century, the assembly line revolutionized manufacturing, most famously through Henry Ford’s production of the Model T automobile. By breaking down the manufacturing process into small, repeatable tasks performed by workers stationed at fixed points, Ford was able to dramatically reduce the time required to build a single car, from over twelve hours to roughly ninety minutes.\n\nThis increase in efficiency allowed Ford to lower the price of automobiles significantly, making car ownership accessible to a much broader segment of the population rather than remaining a luxury reserved for the wealthy. At the same time, Ford famously raised wages for his workers to five dollars a day, nearly double the prevailing rate, which reduced employee turnover and, some argue, helped create a growing middle class capable of purchasing the very products they manufactured.\n\nCritics, however, point out that assembly line work was often repetitive and physically demanding, leading to concerns about worker alienation that later influenced labor movements and eventually contributed to reforms in workplace conditions throughout the twentieth century.",
    questions: [
      {
        question: "How long did it take to build a car using Ford's assembly line, according to the passage?",
        options: [
          "Over twelve hours",
          "About six hours",
          "Roughly ninety minutes",
          "About one week",
          "Less than ten minutes",
        ],
        correctIndex: 2,
        explanation:
          "本文1〜2行目に「from over twelve hours to roughly ninety minutes」とあり、組み立て時間が90分程度に短縮されたことがわかります。",
      },
      {
        question: "Why did Ford raise wages to five dollars a day?",
        options: [
          "It is not stated why he raised wages, but it reduced employee turnover.",
          "Government regulations required it.",
          "Workers went on strike.",
          "Competitors were paying much more.",
          "It had no effect on turnover.",
        ],
        correctIndex: 0,
        explanation:
          "本文には賃上げの直接的な理由は明記されていませんが、「which reduced employee turnover」とその効果が述べられています。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① The assembly line made automobiles more affordable for ordinary people.\n② All workers were satisfied with assembly line jobs, and no criticism existed.\n③ Some critics link assembly line work to later labor movement reforms.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「lower the price of automobiles significantly, making car ownership accessible to a much broader segment」から①が正しく、末尾「influenced labor movements and eventually contributed to reforms」から③も正しいとわかります。②は「physically demanding, leading to concerns about worker alienation」という記述と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Urban Green Spaces",
    passage:
      'Urban green spaces, such as parks, community gardens, and street trees, have long been valued for their aesthetic appeal, but recent research has highlighted their broader importance for public health and environmental sustainability. Studies conducted in several major cities have found that residents living near green spaces report lower levels of stress and higher levels of physical activity compared to those in areas with limited access to nature.\n\nBeyond the benefits to mental and physical health, urban greenery plays a critical role in mitigating the "urban heat island" effect, a phenomenon in which cities experience significantly higher temperatures than surrounding rural areas due to the concentration of concrete, asphalt, and buildings that absorb and retain heat. Trees and vegetation help lower temperatures by providing shade and releasing moisture into the air through a process called transpiration.\n\nAs cities continue to grow, urban planners face the challenge of balancing the need for housing and infrastructure with the preservation and expansion of green spaces. Some cities have begun incorporating green roofs and vertical gardens into new buildings as a way to increase greenery without requiring additional land.',
    questions: [
      {
        question: "What did studies find about residents living near green spaces?",
        options: [
          "They reported higher stress levels.",
          "They reported lower stress and more physical activity.",
          "They had less access to healthcare.",
          "They preferred living in cities without parks.",
          "They showed no measurable difference in health.",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「residents living near green spaces report lower levels of stress and higher levels of physical activity」とあります。",
      },
      {
        question: 'What causes the "urban heat island" effect, according to the passage?',
        options: [
          "Excessive tree planting",
          "High levels of transpiration",
          "Concentration of concrete, asphalt, and buildings that retain heat",
          "Cold ocean currents near cities",
          "A decrease in city population",
        ],
        correctIndex: 2,
        explanation:
          "本文中盤に「due to the concentration of concrete, asphalt, and buildings that absorb and retain heat」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Trees help cool cities partly through a process called transpiration.\n② Urban planners face no challenges in balancing housing needs and green space.\n③ Some cities use green roofs and vertical gardens to add greenery without more land.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「releasing moisture into the air through a process called transpiration」から①が正しく、末尾「incorporating green roofs and vertical gardens...without requiring additional land」から③も正しいとわかります。②は「face the challenge of balancing」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Loss Aversion",
    passage:
      'Behavioral economists have long studied a phenomenon known as "loss aversion," the tendency for people to feel the pain of losing something more intensely than the pleasure of gaining something of equal value. First formally described by psychologists Daniel Kahneman and Amos Tversky in the late 1970s, loss aversion has since become one of the most influential concepts in the field of behavioral economics.\n\nResearch suggests that losses are typically felt about twice as strongly as equivalent gains, meaning that losing 100 dollars produces roughly twice the emotional impact of gaining 100 dollars. This asymmetry helps explain a wide range of human behaviors, from why investors often hold onto losing stocks for too long, hoping to avoid realizing a loss, to why consumers respond more strongly to the fear of missing out on a discount than to the prospect of receiving one.\n\nMarketers and policymakers have applied insights from loss aversion in various ways, such as framing messages around what people stand to lose rather than what they stand to gain, since this framing tends to be more persuasive. Critics, however, caution that overreliance on such tactics can sometimes manipulate consumer behavior in ways that are not in the consumer’s best interest.',
    questions: [
      {
        question: "Who first formally described loss aversion, according to the passage?",
        options: [
          "Henry Ford",
          "Johannes Gutenberg",
          "Daniel Kahneman and Amos Tversky",
          "A group of marketers",
          "Modern policymakers",
        ],
        correctIndex: 2,
        explanation:
          "本文冒頭に「First formally described by psychologists Daniel Kahneman and Amos Tversky in the late 1970s」とあります。",
      },
      {
        question: "According to the passage, how strongly are losses typically felt compared to equivalent gains?",
        options: [
          "Half as strongly",
          "Equally as strongly",
          "About twice as strongly",
          "Three times as strongly",
          "Losses are not felt at all",
        ],
        correctIndex: 2,
        explanation: "本文中盤に「losses are typically felt about twice as strongly as equivalent gains」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Loss aversion helps explain why investors sometimes hold onto losing stocks too long.\n② Marketers never use loss aversion in their messaging strategies.\n③ Some critics warn that loss aversion tactics can manipulate consumers.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「why investors often hold onto losing stocks for too long」から①が正しく、末尾「overreliance on such tactics can sometimes manipulate consumer behavior」から③も正しいとわかります。②は「Marketers...have applied insights from loss aversion」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Universal Basic Income",
    passage:
      'The concept of "universal basic income" (UBI), a policy in which every citizen receives a regular, unconditional cash payment from the government regardless of employment status, has gained increasing attention as automation threatens to displace workers in various industries. Proponents argue that UBI could provide a financial safety net in an era of economic uncertainty, reduce poverty, and give individuals greater freedom to pursue education, entrepreneurship, or caregiving roles without the constant pressure of financial survival.\n\nSeveral pilot programs testing UBI have been conducted in countries such as Finland, Kenya, and parts of the United States. Results from these trials have been mixed but generally positive: many participants reported improved mental health and greater financial stability, though the effects on employment rates varied depending on the specific program and local economic conditions.\n\nCritics of UBI raise concerns about its cost, arguing that funding a universal payment for an entire population would require substantial tax increases or major restructuring of existing social welfare programs. Some also worry that a guaranteed income could reduce the incentive to work, though most pilot studies so far have not found strong evidence to support this concern.',
    questions: [
      {
        question: "What is universal basic income, according to the passage?",
        options: [
          "A loan given only to unemployed citizens",
          "A regular, unconditional cash payment given to every citizen",
          "A tax reduction for low-income workers",
          "A one-time payment given during economic crises",
          "A payment given only to elderly citizens",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「every citizen receives a regular, unconditional cash payment from the government regardless of employment status」とあります。",
      },
      {
        question: "According to the passage, what did many UBI pilot program participants report?",
        options: [
          "Worse mental health and financial instability",
          "No change in their lives",
          "Improved mental health and greater financial stability",
          "A strong desire to stop working entirely",
          "Increased tax burdens",
        ],
        correctIndex: 2,
        explanation:
          "本文中盤に「many participants reported improved mental health and greater financial stability」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Pilot programs testing UBI have been conducted in Finland and Kenya.\n② Most pilot studies have found strong evidence that UBI reduces the incentive to work.\n③ Critics are concerned about the cost of funding UBI for an entire population.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「countries such as Finland, Kenya, and parts of the United States」から①が正しく、末尾「argue that funding a universal payment...would require substantial tax increases」から③も正しいとわかります。②は「most pilot studies so far have not found strong evidence to support this concern」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Bilingualism and Cognition",
    passage:
      'Bilingualism, the ability to use two languages fluently, has long fascinated researchers studying cognitive development. For decades, some educators believed that raising children with two languages might delay language development or cause confusion. However, more recent research has largely overturned this view, suggesting that bilingual children often develop certain cognitive advantages compared to their monolingual peers.\n\nStudies have found that bilingual individuals tend to perform better on tasks requiring what psychologists call "executive function," which includes skills such as switching attention between tasks, ignoring irrelevant information, and solving problems flexibly. Researchers believe this may be because bilingual speakers constantly manage two active language systems, requiring their brains to continuously select the appropriate language while suppressing the other, effectively giving the brain regular practice in cognitive control.\n\nSome research also suggests that bilingualism may help delay the onset of age-related cognitive decline, including symptoms of dementia, by several years, although scientists caution that more research is needed to fully understand this relationship. Regardless, most experts now agree that learning a second language, at any age, offers cognitive benefits beyond simple communication skills.',
    questions: [
      {
        question: "What did some educators previously believe about raising children with two languages?",
        options: [
          "It would definitely improve their memory.",
          "It might delay language development or cause confusion.",
          "It would have no effect on cognitive development.",
          "It would make children more athletic.",
          "It would eliminate the need for formal schooling.",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「some educators believed that raising children with two languages might delay language development or cause confusion」とあります。",
      },
      {
        question: "According to the passage, what cognitive skill do bilingual individuals tend to perform better at?",
        options: [
          "Memorizing long lists of numbers",
          "Executive function, such as switching attention and problem-solving",
          "Physical coordination",
          "Visual art appreciation",
          "Mathematical calculation speed",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「bilingual individuals tend to perform better on tasks requiring...executive function, which includes skills such as switching attention between tasks」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Recent research has largely overturned the belief that bilingualism delays development.\n② Scientists are completely certain that bilingualism delays dementia onset.\n③ Most experts agree that learning a second language offers cognitive benefits at any age.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文冒頭「more recent research has largely overturned this view」から①が正しく、末尾「most experts now agree that learning a second language, at any age, offers cognitive benefits」から③も正しいとわかります。②は「scientists caution that more research is needed to fully understand this relationship」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "The Rise of Remote Work",
    passage:
      "The rise of remote work, accelerated dramatically by the global pandemic in the early 2020s, has led many companies to reconsider the traditional office-based work model. While some organizations have fully embraced remote or hybrid arrangements, allowing employees to work from home either permanently or part of the week, others have pushed for a full return to the office, citing concerns about collaboration, company culture, and the mentorship of younger employees.\n\nSurveys of employees consistently show a strong preference for flexibility, with many workers stating that they would consider leaving their jobs if required to return to the office full-time. At the same time, some research suggests that fully remote employees, particularly those early in their careers, may face challenges in building professional networks and receiving informal feedback that often occurs naturally in physical office settings.\n\nAs a compromise, many companies have adopted hybrid models, requiring employees to be in the office a certain number of days per week while allowing flexibility on the remaining days. Whether this hybrid approach will become the long-term standard, or whether companies will eventually shift more decisively toward one extreme or the other, remains a subject of ongoing debate among business leaders and researchers.",
    questions: [
      {
        question: "What accelerated the rise of remote work, according to the passage?",
        options: [
          "New tax laws",
          "The global pandemic in the early 2020s",
          "A shortage of office buildings",
          "Rising fuel prices",
          "A decline in internet costs",
        ],
        correctIndex: 1,
        explanation: "本文冒頭に「accelerated dramatically by the global pandemic in the early 2020s」とあります。",
      },
      {
        question:
          "What challenge do fully remote employees, especially early-career workers, potentially face?",
        options: [
          "Higher salaries than office workers",
          "Difficulty building professional networks and receiving informal feedback",
          "Mandatory relocation to rural areas",
          "Reduced access to computers",
          "Increased office attendance requirements",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「fully remote employees, particularly those early in their careers, may face challenges in building professional networks and receiving informal feedback」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Surveys show many employees would consider leaving their jobs if forced back to the office full-time.\n② All companies have agreed to adopt the same remote work policy.\n③ Hybrid work models require employees to be in the office a set number of days per week.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「many workers stating that they would consider leaving their jobs if required to return to the office full-time」から①が正しく、末尾「requiring employees to be in the office a certain number of days per week」から③も正しいとわかります。②は「some organizations have fully embraced remote...others have pushed for a full return」と矛盾するため誤りです。",
      },
    ],
  },
];

const CATEGORY = "english";
const SUB_CATEGORY = "長文読解（英語）";
const GROUP_ID_START = 41; // 既存の最大passage_group_id(40)の次から採番

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
  const lines: string[] = [];

  PASSAGES.forEach((p, pIdx) => {
    const groupId = GROUP_ID_START + pIdx;
    const originalityNote =
      "ユーザー提供のオリジナル英文（一般知識ベースの創作文）。市販教材・書籍からの引用なし。";

    p.questions.forEach((q) => {
      const questionText = `${p.passage}\n\n【設問】\n${q.question}`;

      // 元データは正解の分布に偏りがあるため、選択肢をシャッフルしてから正解インデックスを求める。
      const indexed = q.options.map((text, i) => ({ text, isCorrect: i === q.correctIndex }));
      const shuffled = shuffle(indexed);
      const correctAnswer = shuffled.findIndex((c) => c.isCorrect);
      const optionsJson = JSON.stringify(shuffled.map((c) => c.text));
      const explanationJson = JSON.stringify([q.explanation]);

      lines.push(
        `INSERT INTO questions (category, sub_category, title, question_text, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id) VALUES ('${escapeSql(
          CATEGORY
        )}', '${escapeSql(SUB_CATEGORY)}', '${escapeSql(p.title)}', '${escapeSql(questionText)}', '${escapeSql(
          optionsJson
        )}', ${correctAnswer}, '${escapeSql(explanationJson)}', 3, 'published', '${escapeSql(
          originalityNote
        )}', ${groupId});`
      );
    });
  });

  writeFileSync(new URL("./seed_spi_english_reading.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements (${PASSAGES.length} passages x 3 questions).`);
}

main();
