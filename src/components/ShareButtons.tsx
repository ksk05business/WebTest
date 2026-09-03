"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, XIcon } from "lucide-react";

// LP・マイページ（成績画面）等から共用する汎用SNSシェアボタン。
// X（ブランドカラー: 黒）・LINE（ブランドカラー: #06C755）へのシェアリンクと、
// クリップボードへのURLコピー（成功時に「コピーしました」を一時表示）を提供する。
type ShareButtonsProps = {
  // 未指定時は現在のページURLを使う（サーバー側レンダリング時はSITE_URLへフォールバック）。
  url?: string;
  text: string;
  className?: string;
};

export function ShareButtons({ url, text, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

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
        <XIcon className="h-4 w-4" />
      </a>
      <a
        href={lineHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINEでシェア"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06C755] text-white transition hover:opacity-80"
      >
        <MessageCircle className="h-4 w-4" />
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
