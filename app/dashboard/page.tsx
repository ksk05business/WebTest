"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { PerformanceDashboard } from "@/src/components/PerformanceDashboard";
import { ScoutInbox } from "@/src/components/ScoutInbox";
import { TEST_TYPES } from "@/src/data/testTypes";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("spiUser");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw) as { name?: string; email?: string };
    setUserName(user.name ?? "");
    if (user.email) setUserEmail(user.email);
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <p className="text-gray-600">ようこそ、{userName}さん</p>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900">試験の種類</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TEST_TYPES.map((t) =>
              t.available ? (
                <Link
                  key={t.id}
                  href={t.href}
                  className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {t.name}
                </Link>
              ) : (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-gray-400"
                >
                  {t.name}
                  <p className="mt-1 text-xs">準備中</p>
                </div>
              )
            )}
          </div>
        </div>

        {userEmail && (
          <>
            <PerformanceDashboard email={userEmail} />
            <ScoutInbox email={userEmail} />
          </>
        )}
      </main>
    </div>
  );
}
