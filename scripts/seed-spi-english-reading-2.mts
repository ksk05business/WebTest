// SPI3「英語」科目 長文読解（英語）の問題（第2弾）を生成するスクリプト。
// 元データ: ユーザー提供の SPI英語長文読解問題集_第2弾.md（長文10本×設問3問=30問）。
// 元データは正解が極端に「B」へ偏っていた（30問中28問がB。他はA1問・C1問）ため、
// 出題時の偏りを避けるためスクリプト側で選択肢をシャッフルする。
// category=english, sub_category=長文読解（英語） として追加する（第1弾30問に続く追加分。計60問になる）。
// 実行: node scripts/seed-spi-english-reading-2.mts
// → scripts/seed_spi_english_reading_2.sql を生成（このsqlファイル自体はコミットしない）。

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
    title: "Private Space Exploration",
    passage:
      "Over the past decade, private companies have increasingly taken the lead in space exploration, a domain once dominated almost entirely by government agencies such as NASA and Roscosmos. Companies like SpaceX have developed reusable rocket technology, dramatically reducing the cost of launching satellites and cargo into orbit. This shift has opened the door to a new industry: space tourism, in which private citizens, rather than trained astronauts, pay substantial sums to travel briefly beyond the Earth’s atmosphere.\n\nProponents argue that competition among private firms accelerates innovation and lowers costs more effectively than government-run programs alone. They point to the rapid pace of rocket reusability development as evidence that commercial incentives can drive technological progress faster than traditional public funding models.\n\nCritics, however, raise concerns about the environmental impact of frequent rocket launches, as well as questions about safety regulation and the fairness of an industry currently accessible only to the extremely wealthy. Some also worry that the growing accumulation of space debris from increased launch activity could pose long-term risks to satellites and future missions.",
    questions: [
      {
        question: "What technology have companies like SpaceX developed to reduce launch costs?",
        options: [
          "Solar-powered satellites",
          "Reusable rocket technology",
          "Underwater launch platforms",
          "Fully automated space stations",
          "Government-funded shuttles",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「Companies like SpaceX have developed reusable rocket technology, dramatically reducing the cost」とあります。",
      },
      {
        question: "According to proponents mentioned in the passage, what drives faster technological progress?",
        options: [
          "Strict government regulation",
          "Commercial competition and incentives",
          "International treaties",
          "Reduced public interest in space",
          "A decrease in launch frequency",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「competition among private firms accelerates innovation」「commercial incentives can drive technological progress faster」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Space tourism currently allows ordinary trained astronauts only.\n② Critics are concerned about the environmental impact of frequent rocket launches.\n③ Some worry about the accumulation of space debris from increased launches.",
        options: ["① only", "② and ③", "① and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「concerns about the environmental impact of frequent rocket launches」から②が正しく、末尾「growing accumulation of space debris...could pose long-term risks」から③も正しいとわかります。①は「private citizens, rather than trained astronauts」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "EV Battery Ethics and Sustainability",
    passage:
      "As demand for electric vehicles (EVs) has grown rapidly, so too has scrutiny of the batteries that power them. Most EV batteries rely on lithium-ion technology, which requires materials such as lithium, cobalt, and nickel. The mining of these materials, particularly cobalt, has raised ethical concerns, as a significant portion of global cobalt production comes from mines in the Democratic Republic of the Congo, where labor conditions have often been criticized by human rights organizations.\n\nIn response, battery manufacturers have been investing heavily in research to reduce dependence on cobalt, developing alternative battery chemistries that use little or no cobalt at all. Some companies have also begun exploring battery recycling programs, which could reduce the need for newly mined materials by recovering valuable metals from used batteries.\n\nBeyond ethical sourcing, another major challenge facing the EV battery industry is the environmental cost of battery production itself, which requires substantial energy and can generate significant carbon emissions before a vehicle even reaches the road. Nevertheless, most life-cycle studies conclude that, over their full lifespan, electric vehicles still produce fewer total emissions than comparable gasoline-powered cars.",
    questions: [
      {
        question: "What ethical concern is associated with cobalt mining, according to the passage?",
        options: [
          "Cobalt is too expensive to mine.",
          "Labor conditions at some mines have been criticized.",
          "Cobalt mining has been completely banned.",
          "Cobalt is no longer used in any batteries.",
          "Cobalt mining creates no environmental impact.",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「labor conditions have often been criticized by human rights organizations」とあります。",
      },
      {
        question: "What are some manufacturers doing to reduce dependence on cobalt?",
        options: [
          "Increasing cobalt imports",
          "Developing alternative battery chemistries with little or no cobalt",
          "Stopping EV production entirely",
          "Using only gasoline engines",
          "Reducing battery recycling programs",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「developing alternative battery chemistries that use little or no cobalt at all」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Battery production itself can generate significant carbon emissions.\n② Most life-cycle studies find that EVs produce more total emissions than gasoline cars.\n③ Some companies are exploring battery recycling programs.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「requires substantial energy and can generate significant carbon emissions」から①が正しく、中盤「exploring battery recycling programs」から③も正しいとわかります。②は「electric vehicles still produce fewer total emissions than comparable gasoline-powered cars」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "The Gig Economy",
    passage:
      'The "gig economy," characterized by short-term, flexible work arrangements often facilitated through digital platforms, has grown substantially over the past fifteen years. Ride-sharing drivers, food delivery couriers, and freelance workers hired through online marketplaces are frequently cited as examples of this shift away from traditional, long-term employment relationships.\n\nSupporters of the gig economy emphasize the flexibility it offers, allowing workers to choose their own hours and take on multiple jobs simultaneously, which can be particularly appealing to students, parents, or those seeking supplemental income. Companies benefit as well, since they can adjust their workforce size quickly in response to changing demand without the long-term commitments associated with traditional employment.\n\nHowever, labor advocates have raised significant concerns about the lack of job security, health benefits, and retirement savings typically available to gig workers, who are often classified as independent contractors rather than employees. This classification, in many countries, exempts companies from providing benefits that are legally required for traditional employees, leading to ongoing legal battles and regulatory debates in several jurisdictions about how gig workers should be classified and protected.',
    questions: [
      {
        question: "What are ride-sharing drivers and food delivery couriers cited as examples of, according to the passage?",
        options: [
          "Traditional long-term employment",
          "The gig economy",
          "Government employment programs",
          "Manufacturing jobs",
          "Unionized labor",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「are frequently cited as examples of this shift away from traditional...employment relationships」とあり、これらはギグエコノミーの例として挙げられています。",
      },
      {
        question: "Why do companies benefit from the gig economy, according to the passage?",
        options: [
          "They can avoid paying any taxes.",
          "They can adjust workforce size quickly without long-term commitments.",
          "They are required by law to hire gig workers.",
          "Gig workers receive full employee benefits.",
          "It eliminates the need for any workers.",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「can adjust their workforce size quickly in response to changing demand without the long-term commitments」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Gig workers are often classified as independent contractors rather than employees.\n② All countries have resolved the legal debates over gig worker classification.\n③ Labor advocates have raised concerns about the lack of benefits for gig workers.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「classified as independent contractors rather than employees」から①が正しく、「labor advocates have raised significant concerns about the lack of job security, health benefits」から③も正しいとわかります。②は「ongoing legal battles and regulatory debates」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "The Placebo Effect",
    passage:
      "The placebo effect, a phenomenon in which patients experience real improvements in their symptoms after receiving a treatment with no active therapeutic ingredients, has puzzled and fascinated medical researchers for decades. Classic examples include patients reporting reduced pain after taking a sugar pill they believed to be a real painkiller, simply because they expected the treatment to work.\n\nResearchers now believe the placebo effect involves genuine biological processes, not merely psychological illusion. Brain imaging studies have shown that placebo treatments can trigger the release of natural pain-relieving chemicals in the brain, such as endorphins, suggesting that the expectation of relief can produce measurable physiological changes.\n\nInterestingly, recent studies have found that placebos can sometimes work even when patients are explicitly told they are receiving a placebo, a phenomenon researchers call “open-label placebo” effect. This finding has led some doctors to explore whether placebos might be ethically used as a legitimate complement to conventional treatment in certain cases, such as chronic pain management, without the need for deception. Nevertheless, most medical experts agree that placebos should not replace treatments with proven biological effectiveness for serious illnesses.",
    questions: [
      {
        question: "What is the placebo effect, according to the passage?",
        options: [
          "A treatment that always fails to work",
          "Real symptom improvement after a treatment with no active ingredients",
          "A type of surgical procedure",
          "A disease caused by stress",
          "A government health policy",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「patients experience real improvements in their symptoms after receiving a treatment with no active therapeutic ingredients」とあります。",
      },
      {
        question: "What have brain imaging studies shown about placebo treatments?",
        options: [
          "They have no effect on the brain.",
          "They can trigger the release of natural pain-relieving chemicals.",
          "They always cause harmful side effects.",
          "They only work on animals.",
          "They eliminate the need for all medication.",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「placebo treatments can trigger the release of natural pain-relieving chemicals in the brain, such as endorphins」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Open-label placebos can sometimes work even when patients know they are receiving a placebo.\n② Most medical experts believe placebos should replace proven treatments for serious illnesses.\n③ Placebo effects may involve genuine biological processes, not just psychological illusion.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「placebos can sometimes work even when patients are explicitly told they are receiving a placebo」から①が正しく、「Researchers now believe the placebo effect involves genuine biological processes」から③も正しいとわかります。②は「should not replace treatments with proven biological effectiveness for serious illnesses」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Microplastics",
    passage:
      "Microplastics, tiny plastic fragments less than five millimeters in size, have become a growing environmental concern in recent years. These particles originate from a variety of sources, including the breakdown of larger plastic debris, synthetic fibers shed from clothing during washing, and microbeads once commonly used in cosmetic products before many countries banned them.\n\nResearch has found microplastics in a remarkably wide range of environments, from the deepest ocean trenches to remote mountain snow, and even within the human body, having been detected in blood, lung tissue, and placental tissue. While scientists are still working to fully understand the health effects of microplastic exposure, some studies suggest possible links to inflammation and other cellular damage, though definitive conclusions remain elusive due to the complexity of conducting controlled research on this topic.\n\nEfforts to address the microplastic problem include improved wastewater filtration systems designed to capture fibers before they reach rivers and oceans, as well as growing consumer demand for clothing made from natural rather than synthetic fibers. However, many experts argue that meaningfully reducing microplastic pollution will require broader changes in how plastic is produced, used, and disposed of globally.",
    questions: [
      {
        question: "What is one source of microplastics mentioned in the passage?",
        options: [
          "Volcanic ash",
          "Synthetic fibers shed from clothing during washing",
          "Naturally occurring minerals",
          "Fresh produce",
          "Rainwater alone",
        ],
        correctIndex: 1,
        explanation: "本文冒頭に「synthetic fibers shed from clothing during washing」とあります。",
      },
      {
        question: "Where have researchers found microplastics, according to the passage?",
        options: [
          "Only in ocean water",
          "Only in cosmetic products",
          "In environments ranging from ocean trenches to the human body",
          "Only in remote mountain snow",
          "Nowhere near human settlements",
        ],
        correctIndex: 2,
        explanation:
          "本文中盤に「from the deepest ocean trenches to remote mountain snow, and even within the human body」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Scientists have reached definitive conclusions about the health effects of microplastics.\n② Improved wastewater filtration is one effort to address microplastic pollution.\n③ Many experts believe broader changes in plastic production and disposal are needed.",
        options: ["① only", "② and ③", "① and ③", "② only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「improved wastewater filtration systems designed to capture fibers」から②が正しく、「meaningfully reducing microplastic pollution will require broader changes」から③も正しいとわかります。①は「definitive conclusions remain elusive」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "AI and the Augmented Workplace",
    passage:
      "As artificial intelligence tools become increasingly capable of performing tasks once thought to require human judgment, many workplaces are grappling with how to integrate these technologies without displacing employees entirely. Rather than replacing workers outright, many companies have adopted what researchers call an “augmentation” approach, in which AI tools handle repetitive or data-intensive tasks, freeing employees to focus on work requiring creativity, complex decision-making, or interpersonal skills.\n\nSurveys of workers across various industries reveal mixed feelings about this shift. Some employees report that AI tools have made their jobs more efficient and less tedious, while others express anxiety about job security, particularly in fields such as customer service, data entry, and certain aspects of legal and financial analysis, where AI has demonstrated strong performance.\n\nEconomists studying previous waves of technological change note that while automation often eliminates certain job categories, it has historically also created new types of jobs that did not previously exist. Whether this pattern will hold true for the current wave of AI-driven automation remains uncertain, and researchers emphasize the importance of retraining programs to help workers transition into new roles as the nature of work continues to evolve.",
    questions: [
      {
        question: "What is the “augmentation” approach mentioned in the passage?",
        options: [
          "Replacing all workers with AI immediately",
          "Using AI to handle repetitive tasks so employees can focus on other work",
          "Banning AI tools from workplaces entirely",
          "Reducing employee wages",
          "Eliminating all data-intensive tasks",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「AI tools handle repetitive or data-intensive tasks, freeing employees to focus on work requiring creativity」とあります。",
      },
      {
        question: "In which fields has AI demonstrated strong performance, according to the passage?",
        options: [
          "Only in manufacturing",
          "Customer service, data entry, and aspects of legal and financial analysis",
          "Only in agriculture",
          "Only in creative writing",
          "Only in construction",
        ],
        correctIndex: 1,
        explanation:
          "本文中盤に「particularly in fields such as customer service, data entry, and certain aspects of legal and financial analysis」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Historically, automation has sometimes created new types of jobs.\n② Economists are certain that the current AI wave will follow the exact same pattern as the past.\n③ Researchers emphasize the importance of retraining programs for workers.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「automation often eliminates certain job categories, it has historically also created new types of jobs」から①が正しく、「researchers emphasize the importance of retraining programs」から③も正しいとわかります。②は「whether this pattern will hold true...remains uncertain」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Minimum Wage Debates",
    passage:
      "Debates over minimum wage policy have persisted among economists for decades, with disagreement centering on the question of how raising the minimum wage affects employment levels. Traditional economic theory suggests that setting wages above the market equilibrium could lead employers to hire fewer workers, potentially increasing unemployment, particularly among low-skilled workers.\n\nHowever, a substantial body of more recent empirical research has complicated this simple picture. Several influential studies comparing regions that raised their minimum wage to neighboring regions that did not have found little to no negative effect on overall employment levels, suggesting that in some labor markets, employers may have more flexibility to absorb higher wage costs than traditional theory predicts, whether through slightly higher prices, reduced profit margins, or lower employee turnover.\n\nNevertheless, economists broadly agree that the effects of minimum wage increases likely depend heavily on local economic conditions, including the cost of living and the size of the increase relative to existing wages. A modest increase in a high-cost region may have very different effects than a large increase in a region with a lower cost of living, which helps explain why research findings on this topic have not always been consistent.",
    questions: [
      {
        question: "What does traditional economic theory suggest about raising the minimum wage above market equilibrium?",
        options: [
          "It has no effect on employment.",
          "It could lead to fewer jobs, especially for low-skilled workers.",
          "It always increases employment.",
          "It eliminates the need for wages entirely.",
          "It only affects high-skilled workers.",
        ],
        correctIndex: 1,
        explanation:
          "本文冒頭に「could lead employers to hire fewer workers, potentially increasing unemployment, particularly among low-skilled workers」とあります。",
      },
      {
        question: "What have several influential recent studies found about minimum wage increases?",
        options: [
          "They always cause massive job losses.",
          "They have little to no negative effect on overall employment in some cases.",
          "They eliminate all businesses in affected regions.",
          "They have no relationship to employer profit margins.",
          "They are illegal in most countries.",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「found little to no negative effect on overall employment levels」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Economists broadly agree that minimum wage effects depend on local economic conditions.\n② Research findings on minimum wage effects have always been perfectly consistent.\n③ Employers may absorb higher wage costs through means such as reduced profit margins.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「economists broadly agree that the effects...likely depend heavily on local economic conditions」から①が正しく、中盤「through slightly higher prices, reduced profit margins, or lower employee turnover」から③も正しいとわかります。②は「research findings on this topic have not always been consistent」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Telemedicine",
    passage:
      "Telemedicine, the practice of providing medical consultations remotely through video calls, phone calls, or messaging platforms, experienced explosive growth during the global pandemic, as patients and healthcare providers sought ways to minimize in-person contact. While usage has declined somewhat since the peak of the pandemic, telemedicine has remained significantly more common than it was in the years before, suggesting a lasting shift in how some healthcare is delivered.\n\nAdvocates highlight several benefits, including greater convenience for patients, particularly those in rural areas with limited access to specialists, as well as reduced travel time and lower risk of exposure to contagious illnesses in waiting rooms. Some studies also suggest that telemedicine can improve appointment attendance rates, since patients are less likely to miss a virtual appointment than one requiring travel.\n\nHowever, telemedicine is not suitable for all types of medical care. Physical examinations, certain diagnostic tests, and procedures requiring hands-on treatment cannot be conducted remotely, meaning telemedicine generally works best as a complement to, rather than a complete replacement for, in-person healthcare. Additionally, disparities in internet access and digital literacy mean that telemedicine may inadvertently create new barriers to care for certain populations, even as it removes barriers for others.",
    questions: [
      {
        question: "What happened to telemedicine usage during the global pandemic, according to the passage?",
        options: [
          "It disappeared entirely.",
          "It experienced explosive growth.",
          "It remained exactly the same as before.",
          "It was banned in most countries.",
          "It became available only to the wealthy.",
        ],
        correctIndex: 1,
        explanation: "本文冒頭に「experienced explosive growth during the global pandemic」とあります。",
      },
      {
        question: "According to the passage, who might particularly benefit from telemedicine’s convenience?",
        options: [
          "Only urban residents",
          "Patients in rural areas with limited access to specialists",
          "Only hospital staff",
          "Only patients requiring surgery",
          "Only children",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「particularly those in rural areas with limited access to specialists」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Telemedicine can be used for all types of medical care, including surgery.\n② Telemedicine may inadvertently create barriers for people with limited internet access.\n③ Some studies suggest telemedicine can improve appointment attendance rates.",
        options: ["① only", "② and ③", "① and ③", "② only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文末尾「disparities in internet access and digital literacy mean that telemedicine may inadvertently create new barriers」から②が正しく、中盤「telemedicine can improve appointment attendance rates」から③も正しいとわかります。①は「Physical examinations...cannot be conducted remotely」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Food Deserts",
    passage:
      "A \"food desert\" refers to an area, often in low-income urban or rural communities, where residents have limited access to affordable, nutritious food, typically due to the absence of nearby grocery stores selling fresh produce and other healthy options. Instead, residents in these areas often rely on convenience stores or fast-food restaurants, which tend to offer fewer healthy choices at comparatively higher prices.\n\nResearchers have linked food deserts to a range of negative health outcomes, including higher rates of obesity, diabetes, and other diet-related illnesses within affected communities. However, some researchers caution against oversimplifying the issue, noting that access alone does not fully explain dietary patterns; factors such as income, time constraints, cultural food preferences, and marketing of unhealthy products also play significant roles in shaping what people eat.\n\nVarious solutions have been proposed and tested, including incentives for grocery stores to open in underserved areas, mobile markets that bring fresh produce directly to neighborhoods, and community gardens that allow residents to grow their own food. While these interventions have shown some promise, researchers generally agree that addressing food deserts effectively requires a combination of approaches rather than any single solution.",
    questions: [
      {
        question: "What is a food desert, according to the passage?",
        options: [
          "An area with too many grocery stores",
          "An area with limited access to affordable, nutritious food",
          "A region with no residents at all",
          "A type of farming technique",
          "An area exclusively for wealthy residents",
        ],
        correctIndex: 1,
        explanation: "本文冒頭に「an area...where residents have limited access to affordable, nutritious food」とあります。",
      },
      {
        question: "What do some researchers caution about regarding food deserts, according to the passage?",
        options: [
          "That access alone does not fully explain dietary patterns",
          "That food deserts do not exist",
          "That income has no effect on diet",
          "That mobile markets always fail",
          "That community gardens are illegal",
        ],
        correctIndex: 0,
        explanation:
          "本文中盤に「access alone does not fully explain dietary patterns; factors such as income, time constraints...also play significant roles」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① Food deserts have been linked to higher rates of obesity and diabetes.\n② Researchers agree that a single solution can fully solve the food desert problem.\n③ Mobile markets are one proposed solution to food deserts.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文中盤「linked food deserts to a range of negative health outcomes, including higher rates of obesity, diabetes」から①が正しく、末尾「mobile markets that bring fresh produce directly to neighborhoods」から③も正しいとわかります。②は「requires a combination of approaches rather than any single solution」と矛盾するため誤りです。",
      },
    ],
  },
  {
    title: "Solar Power and Intermittency",
    passage:
      "Solar power has emerged as one of the fastest-growing sources of renewable energy worldwide, driven largely by dramatic declines in the cost of photovoltaic panels over the past two decades. In many regions, solar power is now the cheapest source of new electricity generation, even without government subsidies, a milestone that seemed unlikely just a generation ago when solar technology was significantly more expensive than fossil fuel alternatives.\n\nDespite this progress, solar power faces an inherent challenge: intermittency. Solar panels only generate electricity when sunlight is available, meaning that without adequate energy storage systems, solar power alone cannot reliably meet electricity demand around the clock. This has driven significant investment in battery storage technology, which allows excess energy generated during sunny periods to be stored and used later, such as during the evening or on cloudy days.\n\nGrid operators also face the challenge of integrating variable solar output with other energy sources to maintain a stable and reliable electricity supply. Some regions have addressed this by combining solar with other renewable sources, such as wind power, which often peaks at different times, as well as by upgrading transmission infrastructure to move electricity efficiently across larger geographic areas.",
    questions: [
      {
        question: "What has driven the rapid growth of solar power, according to the passage?",
        options: [
          "Rising costs of photovoltaic panels",
          "Dramatic declines in the cost of photovoltaic panels",
          "A ban on fossil fuels",
          "Decreased government interest in renewable energy",
          "A shortage of sunlight",
        ],
        correctIndex: 1,
        explanation: "本文冒頭に「driven largely by dramatic declines in the cost of photovoltaic panels over the past two decades」とあります。",
      },
      {
        question: "What is the “intermittency” challenge mentioned in the passage?",
        options: [
          "Solar panels are too heavy to install.",
          "Solar panels only generate electricity when sunlight is available.",
          "Solar panels cannot be manufactured in large quantities.",
          "Solar panels require constant human operation.",
          "Solar panels generate electricity only at night.",
        ],
        correctIndex: 1,
        explanation: "本文中盤に「Solar panels only generate electricity when sunlight is available」とあります。",
      },
      {
        question:
          "Which of the following is true of the passage?\n\n① In many regions, solar power is now the cheapest source of new electricity generation.\n② Battery storage technology has received little investment.\n③ Some regions combine solar with wind power to address variability.",
        options: ["① only", "① and ③", "② and ③", "③ only", "①② and ③"],
        correctIndex: 1,
        explanation:
          "本文冒頭「solar power is now the cheapest source of new electricity generation」から①が正しく、末尾「combining solar with other renewable sources, such as wind power」から③も正しいとわかります。②は「driven significant investment in battery storage technology」と矛盾するため誤りです。",
      },
    ],
  },
];

const CATEGORY = "english";
const SUB_CATEGORY = "長文読解（英語）";
const GROUP_ID_START = 51; // 既存の最大passage_group_id(50)の次から採番

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

      // 元データは正解が「B」に極端に偏っているため、選択肢をシャッフルしてから正解インデックスを求める。
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

  writeFileSync(new URL("./seed_spi_english_reading_2.sql", import.meta.url), lines.join("\n") + "\n");
  console.log(`Generated ${lines.length} INSERT statements (${PASSAGES.length} passages x 3 questions).`);
}

main();
