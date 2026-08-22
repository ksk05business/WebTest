"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: number;
  name: string;
  email: string;
  university: string;
  universityCategory: string | null;
  facultyType: string;
  scoutConsent: boolean;
  createdAt: string;
  examCount: number;
};

type ConsentFilter = "all" | "consented" | "not_consented";

export function StudentsTab({
  adminToken,
  onAuthError,
}: {
  adminToken: string;
  onAuthError: () => void;
}) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [consentFilter, setConsentFilter] = useState<ConsentFilter>("all");

  useEffect(() => {
    fetch("/api/admin/users", { headers: { "x-admin-token": adminToken } })
      .then((res) => res.json())
      .then((data: { students?: Student[]; error?: string }) => {
        if (data.error) {
          setLoadError(data.error);
          if (data.error === "認証に失敗しました") onAuthError();
          return;
        }
        setStudents(data.students ?? []);
      })
      .catch(() => setLoadError("通信エラーが発生しました。時間をおいて再度お試しください。"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = searchText.trim().toLowerCase();
    return students.filter((s) => {
      if (consentFilter === "consented" && !s.scoutConsent) return false;
      if (consentFilter === "not_consented" && s.scoutConsent) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q) ||
        (s.universityCategory ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, searchText, consentFilter]);

  if (loadError) {
    return <p className="text-sm font-medium text-red-600">{loadError}</p>;
  }

  if (!students) {
    return <p className="text-sm text-gray-500">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="氏名・メール・大学名で検索"
          className="w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <select
          value={consentFilter}
          onChange={(e) => setConsentFilter(e.target.value as ConsentFilter)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="all">スカウト同意: すべて</option>
          <option value="consented">同意あり</option>
          <option value="not_consented">同意なし</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length}件（全{students.length}件）</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">該当する学生はいません。</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-semibold">登録日</th>
                <th className="px-3 py-2 font-semibold">氏名</th>
                <th className="px-3 py-2 font-semibold">メールアドレス</th>
                <th className="px-3 py-2 font-semibold">大学（区分）</th>
                <th className="px-3 py-2 font-semibold">文理</th>
                <th className="px-3 py-2 font-semibold">模試受験回数</th>
                <th className="px-3 py-2 font-semibold">スカウト同意</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{s.createdAt}</td>
                  <td className="px-3 py-2 text-gray-900">{s.name}</td>
                  <td className="px-3 py-2 text-gray-700">{s.email}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {s.university}
                    {s.universityCategory && (
                      <span className="ml-1 text-xs text-gray-400">（{s.universityCategory}）</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{s.facultyType}</td>
                  <td className="px-3 py-2 text-gray-700">{s.examCount}回</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.scoutConsent ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.scoutConsent ? "同意あり" : "同意なし"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
