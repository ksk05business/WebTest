"use client";

import { useEffect, useMemo, useState } from "react";
import { MbtiBadge } from "@/src/components/MbtiBadge";
import { UNIVERSITY_CATEGORIES } from "@/src/data/universityCategories";
import { MBTI_TYPES } from "@/src/data/mbti";
import { INDUSTRIES, DESIRED_OCCUPATIONS } from "@/src/data/formOptions";

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
  mbti: string | null;
  industries: string[];
  desiredOccupations: string[];
};

// 文理区分フィルターはFACULTY_TYPES（学部/大学院×文系/理系/リベラルアーツの6値）を
// 「文系 / 理系 / その他」の3バケットへ集約して選ばせる（学部・大学院を分けて絞り込むニーズは
// 現状のユーザー要求に含まれないため）。
type FacultyBucket = "文系" | "理系" | "その他";

function facultyBucket(facultyType: string): FacultyBucket {
  if (facultyType.startsWith("文系")) return "文系";
  if (facultyType.startsWith("理系")) return "理系";
  return "その他";
}

const FACULTY_BUCKETS: FacultyBucket[] = ["文系", "理系", "その他"];

const ALL = "all";

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
  const [universityCategoryFilter, setUniversityCategoryFilter] = useState<string>(ALL);
  const [facultyBucketFilter, setFacultyBucketFilter] = useState<string>(ALL);
  const [mbtiFilter, setMbtiFilter] = useState<string>(ALL);
  const [industryFilter, setIndustryFilter] = useState<string>(ALL);
  const [occupationFilter, setOccupationFilter] = useState<string>(ALL);

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
      if (universityCategoryFilter !== ALL && s.universityCategory !== universityCategoryFilter) return false;
      if (facultyBucketFilter !== ALL && facultyBucket(s.facultyType) !== facultyBucketFilter) return false;
      if (mbtiFilter !== ALL && s.mbti !== mbtiFilter) return false;
      if (industryFilter !== ALL && !s.industries.includes(industryFilter)) return false;
      if (occupationFilter !== ALL && !s.desiredOccupations.includes(occupationFilter)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q)
      );
    });
  }, [students, searchText, universityCategoryFilter, facultyBucketFilter, mbtiFilter, industryFilter, occupationFilter]);

  if (loadError) {
    return <p className="text-sm font-medium text-red-600">{loadError}</p>;
  }

  if (!students) {
    return <p className="text-sm text-gray-500">読み込み中...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="氏名・メール・大学名で検索"
          className="w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
        />
        <select
          value={universityCategoryFilter}
          onChange={(e) => setUniversityCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value={ALL}>大学区分: すべて</option>
          {UNIVERSITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={facultyBucketFilter}
          onChange={(e) => setFacultyBucketFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value={ALL}>文理: すべて</option>
          {FACULTY_BUCKETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={mbtiFilter}
          onChange={(e) => setMbtiFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value={ALL}>MBTI: すべて</option>
          {MBTI_TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.code}（{t.nickname}）
            </option>
          ))}
        </select>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value={ALL}>志望業界: すべて</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <select
          value={occupationFilter}
          onChange={(e) => setOccupationFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value={ALL}>志望職種: すべて</option>
          {DESIRED_OCCUPATIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
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
                <th className="px-3 py-2 font-semibold">MBTI</th>
                <th className="px-3 py-2 font-semibold">志望業界</th>
                <th className="px-3 py-2 font-semibold">志望職種</th>
                <th className="px-3 py-2 font-semibold">模試受験回数</th>
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
                  <td className="px-3 py-2">
                    <MbtiBadge code={s.mbti} />
                  </td>
                  <td className="max-w-[14rem] px-3 py-2 text-xs text-gray-700">
                    {s.industries.join(" / ")}
                  </td>
                  <td className="max-w-[14rem] px-3 py-2 text-xs text-gray-700">
                    {s.desiredOccupations.join(" / ")}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{s.examCount}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
