"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// LPのBtoBセクション（id="business"）へのリンク。トップページ滞在中はページ遷移せずスムーススクロールし、
// 他の画面にいる場合は "/#business" へ遷移してから対象セクションへスクロールさせる。
export function BusinessLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById("business")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <Link href="/#business" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
