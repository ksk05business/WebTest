import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-500">
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/terms" className="hover:text-gray-700 hover:underline">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:text-gray-700 hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="/company/apply" className="hover:text-gray-700 hover:underline">
          企業・就活エージェント様はこちら
        </Link>
      </nav>
      <p className="mt-2">&copy; Webテストナビ</p>
    </footer>
  );
}
