import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 px-6 text-center">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-8">
        <h1 className="text-3xl font-bold leading-snug text-white drop-shadow-sm">
          本を買わずに
          <br />
          SPI完全攻略
        </h1>
        <p className="text-blue-50">
          参考書を買わなくても、このアプリだけでSPI非言語のポイントが身につきます。
        </p>
        <Link
          href="/test"
          className="rounded-full bg-white px-8 py-3 font-semibold text-blue-700 shadow hover:bg-blue-50"
        >
          SPI非言語 練習スタート
        </Link>
      </div>
    </main>
  );
}
