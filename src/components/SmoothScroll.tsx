"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    // BusinessLink等、ページ内アンカー遷移をLenisの慣性つきscrollTo経由にするための参照。
    // SmoothScrollが未マウント（reduced-motion環境等）の場合はundefinedのままで、
    // 呼び出し側はネイティブscrollIntoViewにフォールバックする。
    // ※ `window.lenis`はlenis本体が自身のdevtools検出用に別の型で予約済みのため使わない。
    lenisInstance?: Lenis;
  }
}

// LP（トップページ）専用のスクロール慣性演出。マウスホイール操作に「離した後スッと減速して止まる」
// 運動量（lerp補間）を付与する。タッチ操作（スマホ）はsyncTouch未指定＝デフォルトfalseのため
// ネイティブのスクロールのまま（指への1:1追従・OS標準の慣性/バウンスは元々良好なため変更しない）。
// prefers-reduced-motionはLenis自身がrespectReducedMotion（デフォルトtrue）で自動的に尊重し、
// その場合lerpが1に強制されて実質ネイティブスクロールと同じ挙動になる。
// スクロール位置は`--scroll-y`というCSS変数にも同期し、装飾要素のパララックス演出から参照できるようにする。
export function SmoothScroll() {
  useEffect(() => {
    // prefers-reduced-motion環境では慣性演出もパララックスも行わず、完全にネイティブスクロールのままにする
    // （--scroll-yを更新しなければ装飾要素はvar(--scroll-y, 0)のフォールバックで静止したままになる）。
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, duration: 1.1 });
    lenis.on("scroll", (instance: Lenis) => {
      document.documentElement.style.setProperty("--scroll-y", String(instance.scroll));
    });
    window.lenisInstance = lenis;
    return () => {
      lenis.destroy();
      window.lenisInstance = undefined;
    };
  }, []);

  return null;
}
