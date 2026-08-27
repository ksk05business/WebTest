import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Mail,
  Repeat2,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { TEST_TYPES } from "@/src/data/testTypes";
import { BusinessLink } from "@/src/components/BusinessLink";
import { ForgettingCurveChart } from "@/src/components/ForgettingCurveChart";
import { SupportChatWidget } from "@/src/components/SupportChatWidget";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

const BADGES = [
  { icon: Clock, text: "登録3分" },
  { icon: Smartphone, text: "スマホ / PC対応" },
  { icon: ShieldCheck, text: "2段階開示で安心" },
];

const TEST_BRAND_DETAILS: { id: string; slug: string; displayName: string; subjects: string; pitch: string }[] = [
  { id: "spi", slug: "spi", displayName: "SPI3", subjects: "言語・非言語・構造的把握・英語", pitch: "日本最大級の圧倒的採用実績" },
  { id: "tamatebako", slug: "tamatebako", displayName: "玉手箱", subjects: "言語・計数・英語", pitch: "とにかく時間との勝負" },
  { id: "tgweb", slug: "tg-web", displayName: "TG-WEB", subjects: "従来型・新型", pitch: "PwC・三菱UFJ銀行・資生堂・三菱地所などのトップ企業" },
  { id: "gab_cgab", slug: "gab", displayName: "C-GAB / Web-GAB", subjects: "言語・計数・英語", pitch: "総合商社・インフラ業界等で頻出" },
  { id: "cab", slug: "cab", displayName: "CAB", subjects: "暗算・法則性・命令表・暗号", pitch: "IT・システムエンジニア職向け" },
  { id: "scoa", slug: "scoa", displayName: "SCOA", subjects: "言語・数理・論理・常識・英語", pitch: "公務員・地方銀行・中堅企業で頻出" },
];

const TEST_BRANDS = TEST_BRAND_DETAILS.map((d) => ({
  ...d,
  available: TEST_TYPES.find((t) => t.id === d.id)?.available ?? false,
}));

const FEATURES = [
  {
    icon: BarChart3,
    title: "本番想定の高精度Webテスト模試",
    description: "偏差値・順位をリアルタイムに算出し、カテゴリ別の苦手分野を分析グラフで可視化します。",
  },
  {
    icon: Brain,
    title: "忘却曲線に基づく自動復習機能",
    description:
      "エビングハウスの忘却曲線を意識し、1日・3日・7日・14日の最適サイクルで知識問題の定着を徹底サポートします。",
  },
  {
    icon: Mail,
    title: "成績・MBTI・志望で届く「特別スカウト」",
    description:
      "2段階開示で個人情報を守りつつ、Webテスト成績や志望動向、MBTI相性を総合考慮した本気度の高い優良企業から特別オファーが届きます。",
  },
];

const FAQS = [
  {
    question: "どんな人におすすめですか？",
    answer:
      "参考書を買わずに就活対策を完結させたい方や、忘却曲線に基づいた効率的な学習で短期間にスコアを伸ばしたい方におすすめです。",
  },
  {
    question: "対応しているWebテストの種類を教えてください。",
    answer: "SPI3をはじめ、玉手箱、TG-WEB、GAB/C-GAB、CAB、SCOAなど、主要なWebテストを幅広く網羅しています。",
  },
  {
    question: "問題のクオリティや難易度はどのくらいですか？",
    answer:
      "最新の出題傾向や傾向分析データをもとに独自作成された問題・解説を収録しています。本番と同等の難易度と問題形式で実践的な対策が可能です。",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "無料会員登録",
    description: "志望業界・希望職種を入力するだけ",
  },
  {
    icon: BookOpen,
    title: "練習問題",
    description: "単元ごとの問題演習で基礎力を強化",
  },
  {
    icon: Repeat2,
    title: "効率的な復習",
    description: "〇・△・×の自己評価と忘却曲線で弱点克服",
  },
  {
    icon: FileText,
    title: "模試",
    description: "本番形式の模試で偏差値・順位を判定",
  },
  {
    icon: Mail,
    title: "スカウト",
    description: "模試成績やMBTIを見た優良企業から特別オファー",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "ja",
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
      provider: { "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      areaServed: "JP",
      hasCourse: TEST_BRAND_DETAILS.map((brand) => ({
        "@type": "Course",
        name: `${brand.displayName} 無料対策講座`,
        description: `${brand.displayName}（${brand.subjects}）の練習問題・模試・解き方ガイドを無料で提供する対策講座。`,
        provider: { "@type": "EducationalOrganization", name: SITE_NAME, url: SITE_URL },
        isAccessibleForFree: true,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT30M",
        },
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-blue-700">
            Webテスト<span className="text-gray-900">ナビ</span>
          </Link>
          <div className="flex items-center gap-6">
            <BusinessLink className="hidden text-sm font-medium text-gray-500 hover:text-indigo-700 sm:inline">
              企業様はこちら
            </BusinessLink>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-blue-700"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              無料登録
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
          <h1 className="text-balance text-3xl font-bold leading-snug text-white drop-shadow-sm sm:text-4xl md:text-5xl">
            参考書を買わずに、
            <br />
            主要Webテストを完全攻略。
            <br />
            模試 ✕ スカウト
          </h1>
          <p className="text-balance text-base leading-relaxed text-blue-50 sm:text-lg">
            SPI3・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOA
            に幅広く対応。高精度模試、忘却曲線に基づく復習機能、特別スカウト獲得まで、学生は【完全無料】で利用できます。
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              【完全無料】今すぐ会員登録して対策を始める
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-white/70 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              ログイン
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-blue-50/90 sm:text-sm">
            {BADGES.map((b) => (
              <span key={b.text} className="flex items-center gap-1.5">
                <b.icon className="h-4 w-4" />
                {b.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 危機感訴求 */}
      <section className="relative overflow-hidden bg-gray-900 px-6 py-16 text-center sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, #f87171 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-red-600/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5">
          <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            就活生への警告
          </span>
          <h2 className="text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
            どんなに志望度が高くても、
            <br />
            <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
              Webテストで落とされたら面接すら受けられない。
            </span>
          </h2>
          <p className="text-balance text-sm leading-relaxed text-gray-300 sm:text-base">
            選考の最初の壁であるWebテスト。対策を後回しにしていると「足切り」に遭い、自分自身の強みや思いをアピールする面接の場にすらたどり着けません。ライバルが対策を始める前に、今すぐスコアを底上げしましょう。
          </p>
          <Link
            href="/register"
            className="mt-2 rounded-full bg-gradient-to-r from-red-500 to-amber-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            手遅れになる前に【無料】で対策を始める
          </Link>
        </div>
      </section>

      {/* 対応Webテスト網羅 */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-4 flex max-w-2xl flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Layers className="h-3.5 w-3.5" />
              すべての主要Webテストを網羅
            </span>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              これ1つで就活のWebテスト対策がすべて完結
            </h2>
            <p className="text-sm text-gray-500 sm:text-base">
              業界・企業ごとに異なる出題形式にも、幅広く対応しています。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {TEST_BRANDS.map((b) => (
              <Link
                key={b.id}
                href={`/test/${b.slug}`}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{b.displayName}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      b.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.available ? "対応済み" : "準備中"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{b.subjects}</p>
                <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {b.pitch}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 安心感バナー */}
      <section className="border-y border-gray-100 bg-blue-50/60 px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <p className="text-balance text-xl font-extrabold text-blue-900 sm:text-2xl">
            学生は完全無料
            <span className="ml-1.5 text-blue-600">（全機能￥0）</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {BADGES.map((b) => (
              <span
                key={b.text}
                className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-xs font-medium text-blue-700 sm:text-sm"
              >
                <b.icon className="h-4 w-4" />
                {b.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">3つのコア機能</h2>
            <p className="text-sm text-gray-500 sm:text-base">
              就活生の「対策・分析・出会い」をひとつのサービスで完結できます。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="break-words text-base font-bold text-gray-900 sm:text-lg">
                  {f.title}
                </h3>
                <p className="break-words text-sm leading-relaxed text-gray-600">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 忘却曲線グラフ */}
      <section className="border-y border-purple-100 bg-purple-50/40 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <span className="flex w-fit items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                <Brain className="h-3.5 w-3.5" />
                科学的な記憶定着メソッド
              </span>
              <h2 className="text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
                「復習しないと忘れる」を、
                <br />
                仕組みで解決します。
              </h2>
              <p className="text-balance text-sm leading-relaxed text-gray-600 sm:text-base">
                心理学者エビングハウスが提唱した「忘却曲線」の通り、人の記憶は復習しなければ急速に薄れていきます。Webテストナビは間違えた知識問題を自動でキューに登録し、
                <strong className="font-bold text-gray-900">1日・3日・7日・14日</strong>
                の最適なタイミングで復習を促すことで、一夜漬けでは終わらない「本当に使える知識」への定着をサポートします。
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-purple-800 sm:text-sm">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" />
                参考書を1周して終わりにせず、間違えた問題だけを効率よく繰り返せるから、限られた時間でも着実にスコアが伸びます。
              </div>
              <Link
                href="/register"
                className="mt-1 w-fit rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:text-base"
              >
                無料で復習機能を試してみる
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <ForgettingCurveChart />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
                ※エビングハウスの忘却曲線の考え方に基づくイメージ図です。復習タイミングによって記憶の定着率が回復・維持される傾向を表しています。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 利用の流れ */}
      <section className="bg-gray-50 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">ご利用の流れ</h2>
            <p className="text-sm text-gray-500 sm:text-base">5ステップで、対策からスカウト獲得まで。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <s.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="break-words font-bold text-gray-900">{s.title}</h3>
                <p className="break-words text-sm leading-normal text-gray-600">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 企業様向け */}
      <section id="business" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Building2 className="h-3.5 w-3.5" />
            採用ご担当者様へ
          </span>
          <h2 className="text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
            スコア・志望業界による高精度データベースから
            <br />
            ターゲット学生に直接スカウトを送れます
          </h2>
          <p className="text-balance text-sm leading-relaxed text-gray-600 sm:text-base">
            2段階開示方式で学生の個人情報を守りながら、模試の偏差値・志望業界・希望職種などの条件で候補者を検索し、匿名スカウトを送信できます。学生が承諾した場合のみ実名情報が開示されます。
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/company/apply"
              className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              利用申請・資料請求はこちら
            </Link>
            <Link
              href="/company/login"
              className="rounded-full border-2 border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              企業様ログイン
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
            <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              <HelpCircle className="h-3.5 w-3.5" />
              よくある質問
            </span>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">よくある質問（FAQ）</h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <details
                key={f.question}
                className="group rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900">
                  {f.question}
                  <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ボトムCTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-20 text-center sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl"
        />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
          <CheckCircle2 className="h-10 w-10 text-white" />
          <h2 className="text-balance text-2xl font-bold text-white sm:text-3xl">
            対策も、スカウトも。すべて無料ではじめよう。
          </h2>
          <Link
            href="/register"
            className="rounded-full bg-white px-10 py-4 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            完全無料でWebテスト対策を始める
          </Link>
        </div>
      </section>

      <SupportChatWidget />
    </div>
  );
}
