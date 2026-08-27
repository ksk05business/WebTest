import Link from "next/link";
import { PrivacyContent } from "@/src/components/PrivacyContent";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <PrivacyContent />

      <Link href="/register" className="mt-6 text-sm text-blue-600 underline">
        会員登録に戻る
      </Link>
    </main>
  );
}
