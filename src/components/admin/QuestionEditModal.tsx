"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { AdminQuestion } from "./QuestionAuditTab";

const DIFFICULTIES = [1, 2, 3, 4, 5];
const STATUSES = [
  { value: "published", label: "公開中" },
  { value: "draft", label: "下書き" },
  { value: "archived", label: "非公開" },
] as const;

export function QuestionEditModal({
  question,
  adminToken,
  onClose,
  onSaved,
  onAuthError,
}: {
  question: AdminQuestion;
  adminToken: string;
  onClose: () => void;
  onSaved: (updated: AdminQuestion) => void;
  onAuthError: () => void;
}) {
  const [title, setTitle] = useState(question.title ?? "");
  const [questionText, setQuestionText] = useState(question.questionText);
  const [options, setOptions] = useState<string[]>([...question.options]);
  const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer);
  const [explanationText, setExplanationText] = useState(question.explanation.join("\n"));
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [status, setStatus] = useState(question.status);
  const [isReviewed, setIsReviewed] = useState(question.isReviewed);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctAnswer === index) setCorrectAnswer(0);
    else if (correctAnswer > index) setCorrectAnswer((c) => c - 1);
  }

  function addOption() {
    if (options.length >= 5) return;
    setOptions((prev) => [...prev, ""]);
  }

  async function handleSave() {
    setError(null);
    if (!questionText.trim()) {
      setError("問題文は必須です");
      return;
    }
    const trimmedOptions = options.map((o) => o.trim());
    if (trimmedOptions.some((o) => !o)) {
      setError("すべての選択肢を入力してください");
      return;
    }
    const explanation = explanationText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (explanation.length === 0) {
      setError("解説は必須です");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({
          category: question.category,
          subCategory: question.subCategory,
          title: title.trim() || null,
          questionText: questionText.trim(),
          tables: question.tables,
          options: trimmedOptions,
          correctAnswer,
          explanation,
          difficulty,
          status,
          originalityNote: question.originalityNote,
          passageGroupId: question.passageGroupId,
          imageDataUri: question.imageDataUri,
          isReviewed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        setError(data.error ?? `保存に失敗しました（status: ${res.status}）`);
        return;
      }
      onSaved({
        ...question,
        title: title.trim() || null,
        questionText: questionText.trim(),
        options: trimmedOptions,
        correctAnswer,
        explanation,
        difficulty,
        status,
        isReviewed,
      });
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">問題を編集（ID: {question.id}）</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {question.category} / {question.subCategory}（この2項目はここでは変更できません）
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            見出し（任意）
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            問題文
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={6}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">
              選択肢（ラジオボタンで選んだものが正解になります）
            </p>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer === i}
                  onChange={() => setCorrectAnswer(i)}
                  className="h-4 w-4 accent-green-600"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm text-gray-900 ${
                    correctAnswer === i ? "border-green-400 bg-green-50" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 2}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="この選択肢を削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {options.length < 5 && (
              <button
                type="button"
                onClick={addOption}
                className="w-fit rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                + 選択肢を追加
              </button>
            )}
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            解説（1行1ステップとして保存されます）
            <textarea
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              rows={5}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              難易度
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              公開ステータス
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isReviewed}
                onChange={(e) => setIsReviewed(e.target.checked)}
                className="h-4 w-4 accent-green-600"
              />
              レビュー済みにする
            </label>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
