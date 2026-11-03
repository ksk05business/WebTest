"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/src/lib/analytics";

// サーバーコンポーネント（/guide 等）から使える、クリック時に cta_click をGAへ送るリンク。
// location には同一ページ内のCTA位置（header / bottom 等）を渡す。
export function TrackedLink({
  location,
  children,
  ...props
}: ComponentProps<typeof Link> & { location: string }) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      onClick={() => trackEvent("cta_click", { page_path: pathname, location })}
    >
      {children}
    </Link>
  );
}
