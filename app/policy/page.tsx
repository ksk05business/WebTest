import Link from "next/link";
import { PolicyContent } from "@/src/components/PolicyContent";

export default function PolicyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <PolicyContent />

      <Link href="/" className="mt-6 text-sm text-blue-600 underline">
        トップページに戻る
      </Link>
    </main>
  );
}
