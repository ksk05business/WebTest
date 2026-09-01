"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TOKEN_STORAGE_KEY = "adminApiToken";

// /admin 直下にはこれまでpage.tsxが無く、サブルート（/admin/login, /admin/dashboard,
// /admin/companies）のみが存在していたため https://.../admin への直接アクセスが404になっていた。
// このページは即座にリダイレクトするだけの入口で、sessionStorageにトークンが既にあれば
// /admin/dashboard へ、無ければ /admin/login へ振り分ける（未認証時に404ではなくログイン画面が
// 表示されるようにするための対応）。
export default function AdminEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    router.replace(token ? "/admin/dashboard" : "/admin/login");
  }, [router]);

  return null;
}
