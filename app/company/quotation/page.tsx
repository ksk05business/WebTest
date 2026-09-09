"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { BackLink } from "@/src/components/BackLink";
import { QuotationSimulator } from "@/src/components/QuotationSimulator";

export default function CompanyQuotationPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    const company = JSON.parse(raw) as { companyName?: string; email?: string };
    if (!company.email) {
      router.replace("/company/login");
      return;
    }
    setCompanyName(company.companyName ?? "");
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CompanyHeader companyName={companyName} />

      <main className="px-6 py-10 sm:py-14">
        <div className="mx-auto mb-6 max-w-4xl">
          <BackLink href="/company/dashboard" label="ダッシュボードへ戻る" />
        </div>
        <QuotationSimulator
          initialCompanyName={companyName}
          title="見積作成"
          description="プラン・利用人数を入力すると、その場で概算のお見積り金額を確認できます。内容をご確認のうえ、PDFとしてダウンロードしてください。"
          showBadge={false}
        />
      </main>
    </div>
  );
}
