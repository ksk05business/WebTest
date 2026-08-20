"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function CompanyHeader({ companyName }: { companyName: string }) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("spiCompanyUser");
    router.push("/company/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <Link href="/company/dashboard" className="text-xl font-bold text-blue-700">
        SPI<span className="text-gray-900">ナビ</span>
        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          企業様向け
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{companyName}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
