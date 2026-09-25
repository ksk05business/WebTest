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
import { FadeInSection } from "@/src/components/FadeInSection";
import { ForgettingCurveChart } from "@/src/components/ForgettingCurveChart";
import { HighlightedText, extractBracketTargets } from "@/src/components/HighlightedText";
import { ShareButtons } from "@/src/components/ShareButtons";
import { SmoothScroll } from "@/src/components/SmoothScroll";
import { SupportChatWidget } from "@/src/components/SupportChatWidget";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

const BADGES = [
  { icon: Smartphone, text: "スマホ / PC対応" },
  { icon: ShieldCheck, text: "2段階開示で安心" },
];

const TEST_BRAND_DETAILS: { id: string; slug: string; displayName: string; subjects: string; pitch: string }[] = [
  { id: "spi", slug: "spi", displayName: "SPI", subjects: "言語・非言語・構造的把握・英語", pitch: "Webテストの代名詞" },
  { id: "tamatebako", slug: "tamatebako", displayName: "玉手箱", subjects: "言語・計数・英語", pitch: "大企業・大手企業で圧倒的採用" },
  { id: "tgweb", slug: "tg-web", displayName: "TG-WEB", subjects: "従来型・新型", pitch: "PwC・三菱地所などのトップ企業が採用" },
  { id: "gab_cgab", slug: "gab", displayName: "C-GAB / Web-GAB", subjects: "言語・計数・英語", pitch: "総合商社・インフラ業界等で頻出" },
  { id: "cab", slug: "cab", displayName: "CAB", subjects: "暗算・法則性・命令表・暗号", pitch: "IT・システムエンジニア職向け" },
  { id: "scoa", slug: "scoa", displayName: "SCOA", subjects: "言語・数理・論理・常識・英語", pitch: "公務員・地方銀行等で頻出" },
];

const TEST_BRANDS = TEST_BRAND_DETAILS.map((d) => ({
  ...d,
  available: TEST_TYPES.find((t) => t.id === d.id)?.available ?? false,
}));

const FEATURES = [
  {
    icon: BarChart3,
    title: "本番想定の高精度Webテスト模試",
    description: "正答率をリアルタイムに算出し、カテゴリ別の苦手分野を分析グラフで可視化します。",
  },
  {
    icon: Brain,
    title: "忘却曲線に基づく自動復習機能",
    description:
      "エビングハウスの忘却曲線を意識し、1日・3日・7日・14日の最適サイクルで知識問題の定着を徹底サポートします。",
  },
  {
    icon: Mail,
    title: "成績・MBTIで届く「匿名スカウト」",
    description:
      "成績や適性（MBTI）を評価した優良企業から特別スカウトが届きます。オファー承諾まで連絡先が公開されない安心の匿名システムです。",
  },
];

const FAQS = [
  {
    question: "本当にすべて無料で使えますか？",
    answer:
      "はい、就活生の方は全機能を完全無料でご利用いただけます。当サービスは企業からのシステム利用料・スカウト費用で運営されているため、学生の皆様から料金をいただくことは一切ありません。",
  },
  {
    question: "勝手に企業へ個人情報が送られませんか？",
    answer:
      "ご安心ください。最初は「大学群」「文理」「偏差値」「MBTI」などの匿名情報のみが企業に公開されます。あなたが企業からのスカウトを【承諾】した時点ではじめて、氏名や連絡先が開示される「2段階開示システム」を採用しています。",
  },
  {
    question: "どんな企業からスカウトが来ますか？",
    answer:
      "あなたのWebテストのスコア（地頭力）やMBTI（ポテンシャル・性格特性）を高く評価した優良企業から、特別なスカウトが届きます。大手企業から成長ベンチャーまで、あなたの隠れた適性を見てオファーを送ります。",
  },
  {
    question: "どんな人におすすめですか？",
    answer:
      "参考書を買わずに就活対策を完結させたい方や、忘却曲線に基づいた効率的な学習で短期間にスコアを伸ばしたい方におすすめです。",
  },
  {
    question: "対応しているWebテストの種類を教えてください。",
    answer: "SPIをはじめ、玉手箱、TG-WEB、GAB/C-GAB、CAB、SCOAなど、主要なWebテストを幅広く網羅しています。",
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
    description: "本番形式の模試で正答率を判定",
  },
  {
    icon: Mail,
    title: "スカウト",
    description: "模試成績やMBTIを見た優良企業から特別オファー",
  },
];

// 利用イメージセクションのモック1（問題演習・解答解説）用データ。
// src/components/HighlightedText.tsx（実際の練習画面で使っている対象語句ハイライト機能）を
// そのまま流用して描画するため、本物の問題データと同じ「【対象語句】」記法で用意する。
const DEMO_QUESTION_TEXT = "あれから10年が【たつ】。";
const DEMO_CHOICES = [
  { text: "会議で席をたつ。", correct: false },
  { text: "鳥肌がたつ。", correct: false },
  { text: "彼の腕は役にたつ。", correct: false },
  { text: "卒業して3年がたつ。", correct: true },
];
const DEMO_EXPLANATION =
  "「たつ」は時間が経過するという意味。A〜Cは「その場を離れる／生じる／役立つ」と別の意味で使われており、Dのみ問題文と同じ意味です。";

// モック2（スマート復習ダッシュボード）用データ。エビングハウスの忘却曲線に基づく
// 1日後・3日後・7日後の復習キューをイメージしたダミーデータ。
const DEMO_REVIEW_QUEUE = [
  { due: "1日後", urgency: "urgent" as const, subject: "非言語 - 推論", count: 4 },
  { due: "3日後", urgency: "soon" as const, subject: "言語 - 語彙", count: 6 },
  { due: "7日後", urgency: "later" as const, subject: "英語 - 長文読解", count: 3 },
];

// モック3（正答率ベースの弱点分析）用データ。偏差値は一切使わず、すべて「正答率(%)」で表現する。
const DEMO_ACCURACY_OVERALL = 78;
const DEMO_ACCURACY_BY_CATEGORY = [
  { label: "言語", score: 88 },
  { label: "非言語", score: 62 },
  { label: "英語", score: 81 },
  { label: "構造的把握", score: 70 },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: "SPIナビ",
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

// ヘッダーの「無料登録」ボタン内に埋め込むGoogle/LINEのミニロゴ。
// GoogleLoginButton.tsx/LineLoginButton.tsxと同じSVGパスデータを使い、実際のログインボタンの
// ロゴと完全に一致させる。
function GoogleMiniIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} flex-shrink-0`} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
        c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
        c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039
        l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
        c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24
        C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

function LineMiniIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`${className} flex flex-shrink-0 items-center justify-center rounded-full`}
      style={{ backgroundColor: "#06C755" }}
    >
      <svg className="h-[62%] w-[62%]" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M12 2C6.477 2 2 5.61 2 10.062c0 3.99 3.548 7.33 8.345 7.962.325.07.767.215.879.494.101.253.066.65.033.906l-.142.858c-.043.253-.2.99.868.54 1.067-.45 5.76-3.393 7.858-5.81C21.29 13.37 22 11.79 22 10.062 22 5.61 17.523 2 12 2Zm-3.5 9.8H7.1a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h1.4a.31.31 0 0 1 .31.31v3.857a.31.31 0 0 1-.31.31Zm3.72 0h-.001a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h.001a.31.31 0 0 1 .31.31v3.857a.31.31 0 0 1-.31.31ZM14.9 11.8a.31.31 0 0 1-.31.31h-.001a.307.307 0 0 1-.248-.125l-1.767-2.386v2.2a.31.31 0 0 1-.31.31h-.001a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h.001c.098 0 .19.048.248.125l1.767 2.386v-2.2a.31.31 0 0 1 .31-.31h.001a.31.31 0 0 1 .31.31Zm3.09-3.166h-1.63v.71h1.63a.31.31 0 1 1 0 .62h-1.63v.71h1.63a.31.31 0 1 1 0 .619h-1.94a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h1.94a.31.31 0 1 1 0 .619Z" />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <SmoothScroll />
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm will-change-transform">
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
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 pl-3 pr-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
            >
              <span className="flex items-center -space-x-1">
                <GoogleMiniIcon className="h-4 w-4 rounded-full bg-white p-0.5" />
                <LineMiniIcon className="h-4 w-4" />
              </span>
              無料登録
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-20 text-center sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl will-change-transform"
          style={{ transform: "translateY(calc(var(--scroll-y, 0) * 0.05px))" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl will-change-transform"
          style={{ transform: "translateY(calc(var(--scroll-y, 0) * -0.04px))" }}
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
            SPI・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOA
            に幅広く対応。高精度模試、忘却曲線に基づく復習機能、特別スカウト獲得まで、学生は【完全無料】で利用できます。
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="whitespace-nowrap rounded-full bg-white px-6 py-4 text-sm font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:px-8 sm:text-base"
            >
              【完全無料】今すぐ対策を始める
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
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 rounded-full bg-red-600/20 blur-3xl will-change-transform"
          style={{ transform: "translateX(-50%) translateY(calc(var(--scroll-y, 0) * 0.06px))" }}
        />

        <FadeInSection className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5">
          <span className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 ring-1 ring-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            就活生への警告
          </span>
          <h2 className="text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
            どんなにガクチカが強くても、
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
        </FadeInSection>
      </section>

      {/* 対応Webテスト網羅 */}
      <section className="px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-6xl">
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
        </FadeInSection>
      </section>

      {/* 特徴 */}
      <section className="px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-6xl">
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
        </FadeInSection>
      </section>

      {/* 利用イメージ（学習画面モックアップ） */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Smartphone className="h-3.5 w-3.5" />
              実際の画面イメージ
            </span>
            <h2 className="text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
              登録すると、こんな画面で対策できます
            </h2>
            <p className="text-balance text-sm text-gray-500 sm:text-base">
              問題演習から自動復習・弱点分析まで、迷わず使えるシンプルなUIです。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* モック1: 問題演習・解答解説（対象語句の【】ハイライトを実装コンポーネントそのままで再現） */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-2 text-xs font-medium text-gray-400">練習問題</span>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    言語 - 語句の用法
                  </span>
                  <span className="text-xs font-medium text-gray-400">問18 / 全35問</span>
                </div>
                <p className="text-balance text-sm font-bold leading-relaxed text-gray-900 sm:text-base">
                  <HighlightedText text={DEMO_QUESTION_TEXT} targets={extractBracketTargets(DEMO_QUESTION_TEXT)} />
                  {" "}と同じ意味・用法のものを選びなさい。
                </p>
                <div className="flex flex-col gap-2">
                  {DEMO_CHOICES.map((choice, i) => (
                    <div
                      key={choice.text}
                      className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
                        choice.correct
                          ? "border-green-300 bg-green-50 font-semibold text-green-800"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          choice.correct ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <HighlightedText text={choice.text} targets={extractBracketTargets(DEMO_QUESTION_TEXT)} />
                      {choice.correct && <CheckCircle2 className="ml-auto h-4 w-4 flex-shrink-0 text-green-600" />}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs leading-relaxed text-blue-900 sm:text-sm">
                  <p className="mb-1 font-bold text-blue-700">解説</p>
                  {DEMO_EXPLANATION}
                </div>
              </div>
            </div>

            {/* モック2: スマート復習ダッシュボード（忘却曲線に基づく1日後・3日後・7日後の復習キュー） */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-2 text-xs font-medium text-gray-400">復習リマインダー</span>
              </div>
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    <Clock className="h-4 w-4 text-purple-600" />
                    今日の復習タスク
                  </p>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    計{DEMO_REVIEW_QUEUE.reduce((sum, r) => sum + r.count, 0)}問
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {DEMO_REVIEW_QUEUE.map((row) => {
                    const urgencyStyle =
                      row.urgency === "urgent"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : row.urgency === "soon"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-700 border-blue-200";
                    return (
                      <div
                        key={row.due}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex-shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${urgencyStyle}`}
                          >
                            {row.due}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">{row.subject}</p>
                            <p className="text-xs text-gray-500">{row.count}問を復習</p>
                          </div>
                        </div>
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white">
                          <Repeat2 className="h-3.5 w-3.5" />
                          復習する
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="rounded-lg border border-purple-100 bg-purple-50/60 px-3 py-2 text-[11px] leading-relaxed text-purple-800">
                  エビングハウスの忘却曲線に基づき、間違えた問題だけを最適なタイミングで自動的に出題します。
                </p>
              </div>
            </div>
          </div>

          {/* モック3: 正答率ベースの弱点分析（偏差値は使わず正答率のみで表現） */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <span className="ml-2 text-xs font-medium text-gray-400">弱点分析</span>
            </div>
            <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="relative h-32 w-32 flex-shrink-0">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(#2563eb 0% ${DEMO_ACCURACY_OVERALL}%, #e5e7eb ${DEMO_ACCURACY_OVERALL}% 100%)`,
                  }}
                />
                <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-extrabold text-gray-900">{DEMO_ACCURACY_OVERALL}%</span>
                  <span className="text-[10px] text-gray-500">総合正答率</span>
                </div>
              </div>

              <div className="flex w-full flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {DEMO_ACCURACY_BY_CATEGORY.map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                      <span className="w-20 flex-shrink-0 text-xs font-medium text-gray-600 sm:w-24 sm:text-sm">
                        {row.label}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                      <span className="w-10 flex-shrink-0 text-right text-xs font-bold text-gray-700 sm:text-sm">
                        {row.score}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    得意：言語・英語
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    要復習：非言語
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl sm:text-base"
            >
              無料登録してこの画面を使ってみる
            </Link>
          </div>
        </FadeInSection>
      </section>

      {/* 忘却曲線グラフ */}
      <section className="border-y border-purple-100 bg-purple-50/40 px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-5xl">
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
                言語や英語などの「知識問題」は、心理学者エビングハウスが提唱した「忘却曲線」の通り、復習しなければ記憶が急速に薄れていきます。そのため間違えた問題を自動でキューに登録し、
                <strong className="font-bold text-gray-900">1日・3日・7日・14日</strong>
                の最適なタイミングで復習することで記憶への定着をサポートします。一方、計数（非言語）問題は単なる暗記よりも「解き方のパターンに慣れる」ことが重要です。Webテストナビは、分野ごとの特性に合わせた復習サイクルを提供し、着実なスコアアップをサポートします。
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
        </FadeInSection>
      </section>

      {/* 利用の流れ */}
      <section className="bg-gray-50 px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-6xl">
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
        </FadeInSection>
      </section>

      {/* 企業様向け */}
      <section id="business" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
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
        </FadeInSection>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 sm:py-24">
        <FadeInSection className="mx-auto max-w-3xl">
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
        </FadeInSection>
      </section>

      {/* ボトムCTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 py-20 text-center sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-white/10 blur-3xl will-change-transform"
          style={{ transform: "translateY(calc(var(--scroll-y, 0) * 0.05px))" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl will-change-transform"
          style={{ transform: "translateY(calc(var(--scroll-y, 0) * -0.05px))" }}
        />
        <FadeInSection className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6">
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
        </FadeInSection>
      </section>

      <ShareButtons
        variant="floating"
        url={SITE_URL}
        text="無料で本番環境そっくりのWEBテスト対策ができる『WEBテストナビ』"
        calloutText="友達に共有"
      />
      <SupportChatWidget />
    </div>
  );
}
