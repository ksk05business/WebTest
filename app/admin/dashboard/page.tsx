"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ListChecks, LogOut, Mail, Users } from "lucide-react";
import { ContactInquiriesTab } from "@/src/components/admin/ContactInquiriesTab";
import { CompanyManagementPanel } from "@/src/components/admin/CompanyManagementPanel";
import { StudentsTab } from "@/src/components/admin/StudentsTab";
import { QuestionAuditTab } from "@/src/components/admin/QuestionAuditTab";

const TOKEN_STORAGE_KEY = "adminApiToken";

const TABS = [
  { id: "contact", label: "お問い合わせ", icon: Mail },
  { id: "companies", label: "直接採用企業", icon: Building2 },
  { id: "students", label: "学生", icon: Users },
  { id: "questions", label: "問題検品・編集", icon: ListChecks },
] as const;

type TabId = (typeof TABS)[number]["id"];

// 運営専用の統合管理画面。LP・共通ヘッダー/フッターからのリンクは一切無く、URLを直接知っている
// 運営担当者のみがアクセスする想定（/admin/companies等と同じ、x-admin-token簡易認証モデル）。
// sessionStorageにトークンが無ければ即座に /admin/login へリダイレクトする。
export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("contact");

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    setAdminToken(stored);
    setChecked(true);
  }, [router]);

  function handleAuthError() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/admin/login");
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/admin/login");
  }

  if (!checked || !adminToken) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">運営管理画面</h1>
          <p className="text-sm text-gray-500">お問い合わせ・企業・学生データの一元管理</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      <div>
        {activeTab === "contact" && (
          <ContactInquiriesTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
        {activeTab === "companies" && (
          <CompanyManagementPanel adminToken={adminToken} onAuthError={handleAuthError} />
        )}
        {activeTab === "students" && (
          <StudentsTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
        {activeTab === "questions" && (
          <QuestionAuditTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
      </div>
    </main>
  );
}
