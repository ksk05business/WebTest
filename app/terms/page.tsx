import Link from "next/link";
import { TermsContent } from "@/src/components/TermsContent";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <TermsContent />

      <Link href="/register" className="mt-6 text-sm text-blue-600 underline">
        会員登録に戻る
      </Link>
    </main>
  );
}
