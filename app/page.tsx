import Link from "next/link";
import {
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Repeat2,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";

const BADGES = [
  { icon: Clock, text: "登録3分" },
  { icon: Smartphone, text: "SP/PC両対応" },
  { icon: ShieldCheck, text: "2段階開示で個人情報も安心" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "本番想定の高精度Webテスト模試",
    description: "偏差値・順位をリアルタイムに算出し、苦手分野を分析グラフで可視化します。",
  },
  {
    icon: Brain,
    title: "忘却曲線に基づく自動復習機能",
    description:
      "エビングハウスの忘却曲線を意識し、1日・3日・7日・14日の最適タイミングで知識問題の定着を徹底サポートします。",
  },
  {
    icon: Mail,
    title: "成績を見た企業から届く「特別スカウト」",
    description:
      "2段階開示だから安心。最初は匿名で、本気度の高い優良企業から特別選考ルートのオファーが届きます。",
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
    description: "SPI模試を受けて成績を分析",
  },
  {
    icon: Repeat2,
    title: "復習機能で弱点を克服",
    description: "忘却曲線に沿った復習でスコアアップ",
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
            SPI<span className="text-gray-900">ナビ</span>
          </Link>
          <div className="flex items-center gap-3">
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
            本を買わずに、SPI完全攻略。
            <br />
            高精度模試 ✕ スカウト獲得
          </h1>
          <p className="text-balance text-base leading-relaxed text-blue-50 sm:text-lg">
            参考書不要！高精度の模擬試験、エビングハウスの忘却曲線に基づく復習機能、企業からの特別スカウトまで、学生は【完全無料】で利用できます。
          </p>
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-full bg-white px-8 py-4 text-base font-bold text-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              【完全無料】今すぐ会員登録して練習を始める
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

      {/* 安心感バナー */}
      <section className="border-b border-gray-100 bg-blue-50/60 px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-semibold text-blue-900 sm:text-base">
            学生は完全無料
            <span className="ml-1 font-normal text-blue-700">
              （※企業からのスカウト掲載料で運営されているため、学生に費用は一切かかりません）
            </span>
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
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">3つのコアな特徴</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">利用の流れ</h2>
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
            今すぐ無料でSPI対策を始める
          </Link>
        </div>
      </section>
    </div>
  );
}
