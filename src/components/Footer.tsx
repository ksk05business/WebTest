import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-500">
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/guide" className="hover:text-gray-700 hover:underline">
          単元別解き方ガイド
        </Link>
        <Link href="/terms" className="hover:text-gray-700 hover:underline">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:text-gray-700 hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="/policy" className="hover:text-gray-700 hover:underline">
          問題作成ポリシー
        </Link>
        <Link href="/company/apply" className="hover:text-gray-700 hover:underline">
          企業様はこちら
        </Link>
        <Link href="/contact" className="hover:text-gray-700 hover:underline">
          お問い合わせ
        </Link>
      </nav>
      <p className="mt-2">&copy; Webテストナビ</p>
      <p className="mx-auto mt-3 max-w-2xl text-[11px] leading-relaxed text-gray-400">
        <Link href="/policy" className="underline hover:text-gray-600">
          問題作成ポリシー
        </Link>
        : 本サービス上の問題・解説はすべて、生成AI技術と当社独自のプロンプト・アルゴリズムによってゼロから作成し、当社が内容を監修したオリジナルコンテンツです。市販の参考書・出版物等の複製ではありません。
      </p>
      <p className="mx-auto mt-1 max-w-2xl text-[11px] leading-relaxed text-gray-400">
        ※当サイトは各適性検査の運営会社とは関係のない非公式の対策サービスです。「SPI」は株式会社リクルートマネジメントソリューションズ等、各社の登録商標または商標です。
      </p>
    </footer>
  );
}
