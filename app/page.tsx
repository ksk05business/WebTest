import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  Mail,
  Repeat2,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { TEST_TYPES } from "@/src/data/testTypes";
import { BusinessLink } from "@/src/components/BusinessLink";

const BADGES = [
  { icon: Clock, text: "登録3分" },
  { icon: Smartphone, text: "スマホ / PC対応" },
  { icon: ShieldCheck, text: "2段階開示で安心" },
];

const TEST_BRAND_DETAILS: { id: string; displayName: string; subtitle: string }[] = [
  { id: "spi", displayName: "SPI3", subtitle: "言語・非言語・構造的把握" },
  { id: "tamatebako", displayName: "玉手箱", subtitle: "計数・言語・英語" },
  { id: "tgweb", displayName: "TG-WEB", subtitle: "従来型・新型" },
  { id: "gab", displayName: "GAB", subtitle: "商社・総合職向け適性検査" },
  { id: "cgab", displayName: "C-GAB", subtitle: "Web会場型のGAB" },
  { id: "cab", displayName: "CAB", subtitle: "SE・IT職向け（暗号・論理的思考）" },
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
    title: "成績を見た企業から届く「特別スカウト」",
    description:
      "2段階開示で個人情報を守りつつ、本気度の高い優良企業から特別選考ルートの直オファーが届きます。",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "無料会員登録",
    description: "志望業界・希望職種を入力するだけ",
  },
  {
    icon: FileText,
    title: "Webテスト模試を受験",
    description: "SPIなど主要Webテストの模試を受けて成績を分析",
  },
  {
    icon: Repeat2,
    title: "忘却曲線復習で弱点を克服",
    description: "最適サイクルの復習でスコアアップ",
  },
  {
    icon: Mail,
    title: "特別スカウトを受信",
    description: "成績を見た企業から直接オファー",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-blue-700">
            Webテスト<span className="text-gray-900">ナビ</span>
          </Link>
          <div className="flex items-center gap-6">
            <BusinessLink className="hidden text-sm font-medium text-gray-500 hover:text-indigo-700 sm:inline">
              企業・就活エージェント様はこちら
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
            SPI / 玉手箱 / TG-WEB / GAB / C-GAB / CAB
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
              <div
                key={b.id}
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
                <p className="text-xs leading-relaxed text-gray-500">{b.subtitle}</p>
              </div>
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
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 利用の流れ */}
      <section className="bg-gray-50 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">ご利用の流れ</h2>
            <p className="text-sm text-gray-500 sm:text-base">4ステップで、対策からスカウト獲得まで。</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <s.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 企業・エージェント様向け */}
      <section id="business" className="scroll-mt-20 bg-gray-50 px-6 py-20 sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Building2 className="h-3.5 w-3.5" />
            採用ご担当者様・就活エージェント様へ
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
              無料デモ・資料請求はこちら
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
    </div>
  );
}
