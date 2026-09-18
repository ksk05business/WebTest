"use client";

import { useState } from "react";
import { INDUSTRY_GROUPS } from "@/src/data/formOptions";
import { TEST_TYPES } from "@/src/data/testTypes";
import type { AdminCompanyBorder } from "./CompanyBordersTab";

const BORDER_LEVELS = ["S", "A", "B", "C", "D"] as const;

// 新規登録・編集の両方で使う共通フォームモーダル。company が null なら新規登録、
// 値があれば編集（既存の全フィールドをプリフィルし、保存時は全フィールドを送る）。
export function CompanyBorderEditModal({
  company,
  adminToken,
  onClose,
  onSaved,
  onAuthError,
}: {
  company: AdminCompanyBorder | null;
  adminToken: string;
  onClose: () => void;
  onSaved: () => void;
  onAuthError: () => void;
}) {
  const [companyName, setCompanyName] = useState(company?.companyName ?? "");
  const [companyNameKana, setCompanyNameKana] = useState(company?.companyNameKana ?? "");
  const [industry, setIndustry] = useState(company?.industry ?? INDUSTRY_GROUPS[0].items[0]);
  const [testType, setTestType] = useState(company?.testType ?? "");
  const [borderLevel, setBorderLevel] = useState(company?.borderLevel ?? "");
  const [selectionTiming, setSelectionTiming] = useState(company?.selectionTiming ?? "");
  const [description, setDescription] = useState(
    company?.description ?? "この企業の適性検査・ボーダー情報は準備中です。判明次第アップデートします。"
  );
  const [hasEnglish, setHasEnglish] = useState(company?.hasEnglish ?? false);
  const [hasStructural, setHasStructural] = useState(company?.hasStructural ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!companyName.trim()) {
      setError("企業名は必須です");
      return;
    }
    if (!companyNameKana.trim()) {
      setError("ふりがな（ひらがな）は必須です");
      return;
    }
    if (!/^[ぁ-んー]+$/.test(companyNameKana.trim())) {
      setError("ふりがなはひらがなのみで入力してください（五十音順ソートのため）");
      return;
    }
    if (!description.trim()) {
      setError("説明文は必須です");
      return;
    }

    setSaving(true);
    try {
      const body = {
        companyName: companyName.trim(),
        companyNameKana: companyNameKana.trim(),
        industry,
        testType,
        borderLevel,
        selectionTiming: selectionTiming.trim(),
        description: description.trim(),
        hasEnglish,
        hasStructural,
      };
      const res = await fetch(
        company ? `/api/admin/company-borders/${company.id}` : "/api/admin/company-borders",
        {
          method: company ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "認証に失敗しました") {
          onAuthError();
          return;
        }
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      onSaved();
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" style={{ maxHeight: "90vh" }}>
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {company ? `企業を編集：${company.companyName}` : "企業を新規追加"}
        </h3>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">企業名</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="例: 三菱商事"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">ふりがな（ひらがな）</span>
              <input
                type="text"
                value={companyNameKana}
                onChange={(e) => setCompanyNameKana(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="例: みつびししょうじ"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">業界</span>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {INDUSTRY_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">検査種別</span>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">未設定（空欄）</option>
                {TEST_TYPES.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
                {/* 企業独自のWebテスト（既存の6種別に当てはまらないもの）用のラベル。
                    受験導線を持たないTEST_TYPESには含めず、ここにだけ追加する。 */}
                <option value="独自形式">独自形式</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">ボーダー難易度</span>
              <select
                value={borderLevel}
                onChange={(e) => setBorderLevel(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">未設定（空欄）</option>
                {BORDER_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">選考時期（任意、現在フロントエンドでは非表示）</span>
            <input
              type="text"
              value={selectionTiming}
              onChange={(e) => setSelectionTiming(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="例: 3月〜6月（本選考）"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-gray-700">説明文</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hasEnglish} onChange={(e) => setHasEnglish(e.target.checked)} />
              <span>SPI「英語」あり</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasStructural}
                onChange={(e) => setHasStructural(e.target.checked)}
              />
              <span>SPI「構造的把握力」あり</span>
            </label>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
