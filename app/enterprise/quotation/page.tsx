"use client";

import Link from "next/link";
import { QuotationSimulator } from "@/src/components/QuotationSimulator";

export default function EnterpriseQuotationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-blue-700">
            Webテスト<span className="text-gray-900">ナビ</span>
          </Link>
          <Link
            href="/company/apply"
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:shadow-md"
          >
            企業様お問い合わせ
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 sm:py-16">
        <QuotationSimulator />
      </main>
    </div>
  );
}
