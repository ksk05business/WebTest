"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyHeader } from "@/src/components/CompanyHeader";
import { BackLink } from "@/src/components/BackLink";
import { redirectToCompanyLogin } from "@/src/lib/authRedirect";
import { formatDateTime } from "@/src/lib/formatDate";

const TOKEN_PACKS = [
  { id: "mini", name: "ミニパック", tokens: 50, priceYen: 40000, unitPriceYen: 800, highlight: false },
  {
    id: "standard",
    name: "スタンダードパック",
    tokens: 100,
    priceYen: 60000,
    unitPriceYen: 600,
    highlight: true,
  },
  { id: "volume", name: "ボリュームパック", tokens: 300, priceYen: 150000, unitPriceYen: 500, highlight: false },
] as const;

const PROMOTION_DAY_OPTIONS = [7, 14, 30] as const;

const REASON_LABEL: Record<string, string> = {
  review_bonus: "審査承認特典",
  pack_purchase: "パック購入",
  scout_send: "スカウト送信",
  recommendation_feature: "おすすめ表示",
};

type TokenLog = { id: number; delta: number; reason: string; createdAt: string };

export default function CompanyTokensPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [featuredUntil, setFeaturedUntil] = useState<string | null>(null);
  const [logs, setLogs] = useState<TokenLog[]>([]);

  const [purchaseRequestedPackId, setPurchaseRequestedPackId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);

  const [selectedDays, setSelectedDays] = useState<number>(PROMOTION_DAY_OPTIONS[0]);
  const [promotionSubmitting, setPromotionSubmitting] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [promotionSuccess, setPromotionSuccess] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("spiCompanyUser");
    if (!raw) {
      router.replace("/company/login");
      return;
    }
    const company = JSON.parse(raw) as { companyName?: string; contactName?: string; email?: string };
    if (!company.email) {
      router.replace("/company/login");
      return;
    }
    setCompanyName(company.companyName ?? "");
    setContactName(company.contactName ?? "");
    setCompanyEmail(company.email);
    setAuthChecked(true);
  }, [router]);

  function loadTokens() {
    fetch("/api/company/tokens")
      .then((res) => res.json())
      .then(
        (data: {
          error?: string;
          tokenBalance?: number;
          tokenExpiresAt?: string | null;
          featuredUntil?: string | null;
          logs?: TokenLog[];
        }) => {
          if (data.error) {
            if (data.error === "ログインが必要です") {
              redirectToCompanyLogin(router);
              return;
            }
            setLoadError(data.error);
            return;
          }
          setTokenBalance(data.tokenBalance ?? 0);
          setTokenExpiresAt(data.tokenExpiresAt ?? null);
          setFeaturedUntil(data.featuredUntil ?? null);
          setLogs(data.logs ?? []);
        }
      )
      .catch(() => setLoadError("トークン情報の取得に失敗しました"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authChecked) return;
    loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  async function handlePurchaseRequest(pack: (typeof TOKEN_PACKS)[number]) {
    setPurchaseError(null);
    setPurchasingPackId(pack.id);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName || companyName,
          email: companyEmail,
          message: `【トークンパック購入申し込み】\n企業名: ${companyName}\nパック: ${pack.name}（${pack.tokens}トークン / ${pack.priceYen.toLocaleString()}円）\n\nこちらのパックの購入を希望します。お手続き方法をご案内ください。`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPurchaseError(data.error ?? `送信に失敗しました（status: ${res.status}）`);
        return;
      }
      setPurchaseRequestedPackId(pack.id);
    } catch {
      setPurchaseError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setPurchasingPackId(null);
    }
  }

  async function handlePromotionSubmit() {
    setPromotionError(null);
    setPromotionSuccess(false);
    setPromotionSubmitting(true);
    try {
      const res = await fetch("/api/company/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: selectedDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          redirectToCompanyLogin(router);
          return;
        }
        setPromotionError(data.error ?? `設定に失敗しました（status: ${res.status}）`);
        return;
      }
      setFeaturedUntil(data.featuredUntil ?? null);
      setPromotionSuccess(true);
      loadTokens();
    } catch {
      setPromotionError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setPromotionSubmitting(false);
    }
  }

  if (!authChecked) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <CompanyHeader companyName={companyName} />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <BackLink href="/company/dashboard" label="ダッシュボードへ戻る" />
        <h1 className="text-lg font-bold text-gray-900">トークン</h1>

        {loading ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : loadError ? (
          <p className="text-sm font-medium text-red-600">{loadError}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">現在のトークン残高</p>
                <p className="text-2xl font-bold text-blue-700">{tokenBalance}トークン</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">トークン有効期限</p>
                <p className="text-sm font-medium text-gray-900">
                  {tokenExpiresAt ? formatDateTime(tokenExpiresAt) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">おすすめ表示 有効期限</p>
                <p className="text-sm font-medium text-gray-900">
                  {featuredUntil && new Date(`${featuredUntil.replace(" ", "T")}Z`).getTime() > Date.now()
                    ? formatDateTime(featuredUntil)
                    : "設定なし"}
                </p>
              </div>
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-gray-900">トークンパックを購入する</h2>
              <p className="text-xs text-gray-500">
                購入したトークンは、お申し込み確定日から180日間有効です。1スカウト送信につき1トークンを消費します。
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {TOKEN_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={`flex flex-col gap-2 rounded-xl border p-5 ${
                      pack.highlight ? "border-2 border-blue-500 bg-blue-50/40" : "border-gray-200 bg-white"
                    }`}
                  >
                    {pack.highlight && (
                      <span className="w-fit rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        おすすめ
                      </span>
                    )}
                    <p className="text-sm font-bold text-gray-900">{pack.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{pack.tokens}トークン</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {pack.priceYen.toLocaleString()}円
                    </p>
                    <p className="text-xs text-gray-500">単価{pack.unitPriceYen.toLocaleString()}円 / トークン</p>

                    {purchaseRequestedPackId === pack.id ? (
                      <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                        お申し込みを受け付けました。運営より決済方法をご案内いたします。
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePurchaseRequest(pack)}
                        disabled={purchasingPackId === pack.id}
                        className="mt-2 min-h-11 rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {purchasingPackId === pack.id ? "送信中..." : "購入を申し込む"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {purchaseError && <p className="text-sm font-medium text-red-600">{purchaseError}</p>}
              <p className="text-xs text-gray-400">
                ※ 決済連携（Stripe）は準備中のため、現在は購入お申し込み後に運営より個別にご案内しております。
              </p>
            </section>

            <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-base font-bold text-gray-900">おすすめ表示を設定する</h2>
              <p className="text-xs text-gray-500">
                学生マイページの「あなたへのおすすめ企業」に優先表示されます（1日あたり1トークン消費）。
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {PROMOTION_DAY_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSelectedDays(days)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                      selectedDays === days
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {days}日間（{days}トークン）
                  </button>
                ))}
              </div>
              {promotionError && <p className="text-sm font-medium text-red-600">{promotionError}</p>}
              {promotionSuccess && (
                <p className="text-sm font-medium text-green-600">
                  おすすめ表示を設定しました（{featuredUntil ? formatDateTime(featuredUntil) : ""}まで）。
                </p>
              )}
              <button
                type="button"
                onClick={handlePromotionSubmit}
                disabled={promotionSubmitting}
                className="w-fit min-h-11 rounded-full bg-gray-800 px-6 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {promotionSubmitting ? "設定中..." : "この内容で設定する"}
              </button>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-base font-bold text-gray-900">トークン利用履歴</h2>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">利用履歴はまだありません。</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {REASON_LABEL[log.reason] ?? log.reason}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${
                              log.delta >= 0 ? "text-green-600" : "text-gray-700"
                            }`}
                          >
                            {log.delta >= 0 ? `+${log.delta}` : log.delta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
