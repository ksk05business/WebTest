"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MULTI_PART_EXAM_PARTS, type TestType } from "@/src/data/testTypes";
import { PRACTICE_UNIT_GROUPS_BY_TEST } from "@/src/data/practiceUnits";
import { formatJapaneseDate } from "@/src/lib/formatDate";
import { fetchWithRetry } from "@/src/lib/fetchWithRetry";

type PartEligibility = {
  eligible: boolean;
  lastTakenAt: string | null;
  nextResetAt: string;
  profileCompleted: boolean;
};

// 受験回数制限に関する注意文言（アイコン＋警告色で強調）。スタートボタンの直前に必ず表示する。
function ExamLimitNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-xs text-red-800">
      <span aria-hidden className="text-base leading-none">
        ⚠️
      </span>
      <p>
        <span className="font-bold">【重要】</span>
        本番想定の模試は、各テスト種別につき「2ヶ月に1回」のみ受験可能です。途中で中断・放棄した場合も1回分としてカウントされますのでご注意ください。
      </p>
    </div>
  );
}

// SQLiteのdatetime('now')（"YYYY-MM-DD HH:MM:SS"、UTC）から日付部分（YYYY-MM-DD）だけを取り出す。
function toIsoDatePart(sqliteUtc: string): string {
  return sqliteUtc.slice(0, 10);
}

export function ExamModeSelectModal({
  testType,
  onClose,
}: {
  testType: TestType;
  onClose: () => void;
}) {
  const router = useRouter();
  const hasPracticeContent = Boolean(PRACTICE_UNIT_GROUPS_BY_TEST[testType.id]);
  // SPI・玉手箱・TG-WEB・GAB/C-GABは形式・セクションごとに個別選択して受験する複数パート方式
  // （MULTI_PART_EXAM_PARTS参照）。SCOA等、単一パートのテスト種別はここに含まれない。
  const multiParts = MULTI_PART_EXAM_PARTS[testType.id];
  const isMultiPart = Boolean(multiParts);

  // テスト種別ごとに2ヶ月に1回（奇数月1日に一斉リセット）のみ受験可能。
  const [eligibility, setEligibility] = useState<PartEligibility | null>(null);
  // 複数パート方式のテスト種別は、パートごとに受験可否を個別に持つ。
  const [multiPartEligibility, setMultiPartEligibility] = useState<Record<string, PartEligibility>>(
    {}
  );
  // 一時的な通信エラーはfetchWithRetryが自動リトライするため、ここがtrueになるのは
  // 再試行を使い果たしてもなお失敗した場合のみ。スタートボタンを永久に非活性のまま
  // 放置せず、原因と再試行手段をユーザーに示す。
  const [eligibilityFailed, setEligibilityFailed] = useState(false);
  const [multiPartEligibilityFailed, setMultiPartEligibilityFailed] = useState<
    Record<string, boolean>
  >({});

  // 中断データ（exam_sessions）が残っているパート/テスト種別は、スタートボタンの文言を
  // 「前回の続きから再開」に変える。再開ロジック自体はapp/test/page.tsx側が自動判定するため、
  // ここではボタンの遷移先を変える必要はなく表示だけを切り替える。
  const [hasResumeSession, setHasResumeSession] = useState(false);
  const [multiPartResumeSession, setMultiPartResumeSession] = useState<Record<string, boolean>>({});

  const loadSingleEligibility = useCallback(() => {
    setEligibility(null);
    setEligibilityFailed(false);
    fetchWithRetry(`/api/exam-eligibility?testType=${encodeURIComponent(testType.id)}`)
      .then((res) => res.json())
      .then(
        (data: {
          eligible?: boolean;
          lastTakenAt?: string | null;
          nextResetAt?: string;
          profileCompleted?: boolean;
          error?: string;
        }) => {
          if (data.error) {
            setEligibilityFailed(true);
            return;
          }
          setEligibility({
            eligible: Boolean(data.eligible),
            lastTakenAt: data.lastTakenAt ?? null,
            nextResetAt: data.nextResetAt ?? "",
            profileCompleted: data.profileCompleted ?? true,
          });
        }
      )
      .catch(() => setEligibilityFailed(true));
    fetchWithRetry(`/api/exam-session?testType=${encodeURIComponent(testType.id)}`)
      .then((res) => res.json())
      .then((data: { session?: unknown; error?: string }) => {
        if (data.error) return;
        setHasResumeSession(Boolean(data.session));
      })
      .catch(() => {});
  }, [testType.id]);

  useEffect(() => {
    if (!testType.available || isMultiPart) return;
    loadSingleEligibility();
  }, [testType.available, isMultiPart, loadSingleEligibility]);

  const loadPartEligibility = useCallback(
    (partId: string) => {
      setMultiPartEligibility((prev) => {
        const next = { ...prev };
        delete next[partId];
        return next;
      });
      setMultiPartEligibilityFailed((prev) => ({ ...prev, [partId]: false }));
      fetchWithRetry(`/api/exam-eligibility?testType=${partId}`)
        .then((res) => res.json())
        .then(
          (data: {
            eligible?: boolean;
            lastTakenAt?: string | null;
            nextResetAt?: string;
            profileCompleted?: boolean;
            error?: string;
          }) => {
            if (data.error) {
              setMultiPartEligibilityFailed((prev) => ({ ...prev, [partId]: true }));
              return;
            }
            setMultiPartEligibility((prev) => ({
              ...prev,
              [partId]: {
                eligible: Boolean(data.eligible),
                lastTakenAt: data.lastTakenAt ?? null,
                nextResetAt: data.nextResetAt ?? "",
                profileCompleted: data.profileCompleted ?? true,
              },
            }));
          }
        )
        .catch(() => setMultiPartEligibilityFailed((prev) => ({ ...prev, [partId]: true })));
      fetchWithRetry(`/api/exam-session?testType=${partId}`)
        .then((res) => res.json())
        .then((data: { session?: unknown; error?: string }) => {
          if (data.error) return;
          setMultiPartResumeSession((prev) => ({ ...prev, [partId]: Boolean(data.session) }));
        })
        .catch(() => {});
    },
    []
  );

  useEffect(() => {
    if (!testType.available || !multiParts) return;
    multiParts.forEach((part) => loadPartEligibility(part.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType.available, multiParts]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">{testType.name} 対策</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {!testType.available && !hasPracticeContent ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            現在問題コンテンツを順次準備中です。公開まで今しばらくお待ちください。
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
              <p className="font-bold text-gray-900">模擬試験（本番モード）</p>
              {!testType.available ? (
                <p className="mt-1 rounded-full bg-gray-100 py-2.5 text-center text-sm font-semibold text-gray-400">
                  本番模試は準備中です
                </p>
              ) : multiParts ? (
                <div className="mt-1 flex flex-col gap-2">
                  <ExamLimitNotice />
                  {multiParts.map((part) => {
                    const partEligibility = multiPartEligibility[part.id];
                    return (
                      <div
                        key={part.id}
                        className="flex flex-col gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-3"
                      >
                        <p className="text-sm font-semibold text-gray-800">{part.label}</p>
                        {partEligibility && !partEligibility.profileCompleted ? (
                          <div className="flex flex-col gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                            プロフィール情報の登録が必要です
                            <Link
                              href="/mypage"
                              className="rounded-full bg-amber-600 py-1.5 font-semibold text-white hover:bg-amber-700"
                            >
                              プロフィールを入力する
                            </Link>
                          </div>
                        ) : partEligibility && !partEligibility.eligible ? (
                          <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                            このテストは2ヶ月に1回のみ受験可能です
                            <br />
                            {partEligibility.lastTakenAt && (
                              <>
                                前回の受験日: {formatJapaneseDate(toIsoDatePart(partEligibility.lastTakenAt))}
                                <br />
                              </>
                            )}
                            次回受験可能日: {formatJapaneseDate(partEligibility.nextResetAt)}以降
                          </div>
                        ) : multiPartEligibilityFailed[part.id] ? (
                          <div className="flex flex-col gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                            受験可否の確認に失敗しました。通信環境をご確認のうえ再試行してください。
                            <button
                              type="button"
                              onClick={() => loadPartEligibility(part.id)}
                              className="rounded-full border border-red-300 py-1.5 font-semibold hover:bg-red-100"
                            >
                              再試行
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => router.push(`/test?part=${part.id}`)}
                            disabled={!partEligibility}
                            className="flex items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {!partEligibility ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                確認中...
                              </>
                            ) : multiPartResumeSession[part.id] ? (
                              "前回の続きから再開"
                            ) : (
                              "スタート"
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : eligibilityFailed ? (
                <>
                  <ExamLimitNotice />
                  <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-700">
                    受験可否の確認に失敗しました。通信環境をご確認のうえ再試行してください。
                    <button
                      type="button"
                      onClick={loadSingleEligibility}
                      className="rounded-full border border-red-300 py-1.5 font-semibold hover:bg-red-100"
                    >
                      再試行
                    </button>
                  </div>
                </>
              ) : eligibility && !eligibility.profileCompleted ? (
                <div className="mt-1 flex flex-col gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-center text-xs font-semibold text-amber-800">
                  プロフィール情報の登録が必要です
                  <Link
                    href="/mypage"
                    className="rounded-full bg-amber-600 py-1.5 font-semibold text-white hover:bg-amber-700"
                  >
                    プロフィールを入力する
                  </Link>
                </div>
              ) : eligibility && !eligibility.eligible ? (
                <>
                  <ExamLimitNotice />
                  <div className="mt-1 rounded-lg bg-amber-50 px-3 py-2.5 text-center text-xs font-semibold text-amber-800">
                    このテストは2ヶ月に1回のみ受験可能です
                    <br />
                    {eligibility.lastTakenAt && (
                      <>
                        前回の受験日: {formatJapaneseDate(toIsoDatePart(eligibility.lastTakenAt))}
                        <br />
                      </>
                    )}
                    次回受験可能日: {formatJapaneseDate(eligibility.nextResetAt)}以降
                  </div>
                </>
              ) : (
                <>
                  <ExamLimitNotice />
                  <button
                    type="button"
                    onClick={() => router.push(testType.href)}
                    disabled={!eligibility}
                    className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {!eligibility ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        受験可否を確認中...
                      </>
                    ) : hasResumeSession ? (
                      "前回の続きから再開"
                    ) : (
                      "模擬試験をスタート"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
