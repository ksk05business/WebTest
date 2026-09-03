"use client";

import { useEffect, useState } from "react";
import { Copy, Check, X as CloseIcon } from "lucide-react";

// 吹き出しポップアップを一度閉じたら、同じブラウザタブのセッション中は再表示しない
// （sessionStorage。LP・マイページどちらで閉じても、以降は両方で表示しない挙動を意図している）。
const BUBBLE_DISMISSED_KEY = "shareBubbleDismissed";

// X（旧Twitter）・LINEの公式ブランドアイコン（Simple Icons由来のパスデータ、fill=currentColorで着色）。
// lucide-reactには正確なブランドロゴが含まれないため、SVGパスを直接埋め込んでいる。
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function LineLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

// LP・マイページ（成績画面）等から共用する汎用SNSシェアボタン。
// X（ブランドカラー: 黒）・LINE（ブランドカラー: #06C755）へのシェアリンクと、
// クリップボードへのURLコピー（成功時に「コピーしました」を一時表示）を提供する。
//
// variant="inline"（デフォルト）: ラベル付きの横並び。ページ本文中に埋め込む用途。
// variant="floating": 画面右下に固定表示する縦積みの浮遊ツールバー。
//   SupportChatWidget（fixed bottom-6 right-6, h-14のアイコン, z-50）の直上に積み重なるよう、
//   bottom-24（chatボタンの上端80px+余白16px）・right-6・z-40（チャットパネル展開時はそちらを優先）で配置する。
//   calloutTextを指定すると、ボタン群の上に拡散を促す吹き出しポップアップを表示する
//   （×で閉じるとsessionStorageに記録し、以降そのタブでは再表示しない。あわせて控えめな浮遊アニメーションを付与）。
type ShareButtonsProps = {
  // 未指定時は現在のページURLを使う（サーバー側レンダリング時はSITE_URLへフォールバック）。
  url?: string;
  text: string;
  className?: string;
  variant?: "inline" | "floating";
  calloutText?: string;
};

export function ShareButtons({
  url,
  text,
  className = "",
  variant = "inline",
  calloutText,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [bubbleVisible, setBubbleVisible] = useState(false);

  useEffect(() => {
    if (!calloutText) return;
    try {
      if (sessionStorage.getItem(BUBBLE_DISMISSED_KEY) !== "1") {
        setBubbleVisible(true);
      }
    } catch {
      // sessionStorageが使えない環境ではポップアップは表示しない（安全側に倒す）。
    }
  }, [calloutText]);

  function dismissBubble() {
    setBubbleVisible(false);
    try {
      sessionStorage.setItem(BUBBLE_DISMISSED_KEY, "1");
    } catch {
      // 保存できなくても、少なくとも今回の表示は閉じられるので問題ない。
    }
  }

  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "https://shukatsu-webtest.com");

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  const lineHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードAPIが使えない環境（非対応ブラウザ・権限拒否等）では何もしない。
    }
  }

  if (variant === "floating") {
    return (
      <div
        className={`fixed bottom-24 right-6 z-40 flex max-w-[calc(100vw-3rem)] flex-col items-end gap-3 ${className}`}
      >
        {bubbleVisible && calloutText && (
          <div className="relative max-w-[220px] animate-float-gentle rounded-2xl bg-white px-4 py-3 text-sm font-semibold leading-snug text-gray-800 shadow-xl ring-1 ring-gray-200">
            <button
              type="button"
              onClick={dismissBubble}
              aria-label="ポップアップを閉じる"
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-400 text-white shadow hover:bg-gray-500"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
            {calloutText}
            <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 bg-white ring-1 ring-gray-200" />
          </div>
        )}

        <div className="flex flex-col items-center gap-2 rounded-full border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
          <div className="relative">
            {copied && (
              <span className="absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-green-600 px-2 py-1 text-xs font-semibold text-white shadow">
                コピーしました
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="リンクをコピー"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <a
            href={lineHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LINEでシェア"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06C755] text-white shadow transition hover:opacity-80"
          >
            <LineLogo className="h-4 w-4" />
          </a>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Xでシェア"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow transition hover:opacity-80"
          >
            <XLogo className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-gray-600">シェアする</span>
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Xでシェア"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:opacity-80"
      >
        <XLogo className="h-4 w-4" />
      </a>
      <a
        href={lineHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINEでシェア"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06C755] text-white transition hover:opacity-80"
      >
        <LineLogo className="h-4 w-4" />
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="リンクをコピー"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
      {copied && (
        <span className="text-xs font-semibold text-green-600">コピーしました</span>
      )}
    </div>
  );
}
