"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Building2, Landmark, ListChecks, LogOut, Mail, Users } from "lucide-react";
import { ContactInquiriesTab } from "@/src/components/admin/ContactInquiriesTab";
import { CompanyManagementPanel } from "@/src/components/admin/CompanyManagementPanel";
import { StudentsTab } from "@/src/components/admin/StudentsTab";
import { QuestionAuditTab } from "@/src/components/admin/QuestionAuditTab";
import { CompanyBordersTab } from "@/src/components/admin/CompanyBordersTab";
import { BlogPostsTab } from "@/src/components/admin/BlogPostsTab";

const TOKEN_STORAGE_KEY = "adminApiToken";

// 「問題データ管理」は最も頻繁に使う運用作業（問題の追加・修正確認）のため先頭に配置し、
// リロード時のデフォルト着地タブにもしている。
const TABS = [
  { id: "questions", label: "問題データ管理", icon: ListChecks },
  { id: "contact", label: "お問い合わせ", icon: Mail },
  { id: "companies", label: "直接採用企業", icon: Building2 },
  { id: "borders", label: "ボーダー企業管理", icon: Landmark },
  { id: "blog", label: "ブログ記事管理", icon: BookOpen },
  { id: "students", label: "学生", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

type BadgeCounts = {
  contactUnhandled: number;
  companiesPending: number;
  bordersIncomplete: number;
  studentsRecent: number;
};

const BADGE_KEY_BY_TAB: Partial<Record<TabId, keyof BadgeCounts>> = {
  contact: "contactUnhandled",
  companies: "companiesPending",
  borders: "bordersIncomplete",
  students: "studentsRecent",
};

// 運営専用の統合管理画面。LP・共通ヘッダー/フッターからのリンクは一切無く、URLを直接知っている
// 運営担当者のみがアクセスする想定（/admin/companies等と同じ、x-admin-token簡易認証モデル）。
// sessionStorageにトークンが無ければ即座に /admin/login へリダイレクトする。
export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("questions");
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    setAdminToken(stored);
    setChecked(true);
  }, [router]);

  const refreshBadgeCounts = useCallback((token: string) => {
    fetch("/api/admin/badge-counts", { headers: { "x-admin-token": token } })
      .then((res) => res.json())
      .then((data: Partial<BadgeCounts> & { error?: string }) => {
        if (data.error) return;
        setBadgeCounts({
          contactUnhandled: data.contactUnhandled ?? 0,
          companiesPending: data.companiesPending ?? 0,
          bordersIncomplete: data.bordersIncomplete ?? 0,
          studentsRecent: data.studentsRecent ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    refreshBadgeCounts(adminToken);
  }, [adminToken, refreshBadgeCounts]);

  function handleAuthError() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/admin/login");
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/admin/login");
  }

  function handleDataChanged() {
    if (adminToken) refreshBadgeCounts(adminToken);
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
        {TABS.map((tab) => {
          const badgeKey = BADGE_KEY_BY_TAB[tab.id];
          const badgeCount = badgeKey ? badgeCounts?.[badgeKey] ?? 0 : 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (adminToken) refreshBadgeCounts(adminToken);
              }}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {badgeCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div>
        {activeTab === "questions" && (
          <QuestionAuditTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
        {activeTab === "contact" && (
          <ContactInquiriesTab
            adminToken={adminToken}
            onAuthError={handleAuthError}
            onDataChanged={handleDataChanged}
          />
        )}
        {activeTab === "companies" && (
          <CompanyManagementPanel
            adminToken={adminToken}
            onAuthError={handleAuthError}
            onDataChanged={handleDataChanged}
          />
        )}
        {activeTab === "borders" && (
          <CompanyBordersTab
            adminToken={adminToken}
            onAuthError={handleAuthError}
            onDataChanged={handleDataChanged}
          />
        )}
        {activeTab === "blog" && (
          <BlogPostsTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
        {activeTab === "students" && (
          <StudentsTab adminToken={adminToken} onAuthError={handleAuthError} />
        )}
      </div>
    </main>
  );
}
