import { notFound } from "next/navigation";
import { TEST_TYPES } from "@/src/data/testTypes";
import { TestDashboardClient } from "@/src/components/TestDashboardClient";

// output:"export"（静的エクスポート）のため、動的セグメント[testId]は事前にすべての
// TEST_TYPES.idを列挙してビルドする必要がある（app/test/[category]/page.tsxと同じ制約）。
// ページ本体はログイン確認・API取得などクライアント処理が必要なため、
// 実体はsrc/components/TestDashboardClient.tsx（"use client"）に委譲する。
export function generateStaticParams() {
  return TEST_TYPES.map((t) => ({ testId: t.id }));
}

type PageProps = {
  params: Promise<{ testId: string }>;
};

export default async function TestDashboardPage({ params }: PageProps) {
  const { testId } = await params;
  const testType = TEST_TYPES.find((t) => t.id === testId);
  if (!testType) notFound();

  return <TestDashboardClient testId={testId} />;
}
