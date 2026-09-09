import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ブログ記事（MDX）内から <CallToActionCTA /> として埋め込む会員登録導線。
// MDXWrapperのcomponentsマップ経由でMDXコンテンツ内から直接呼び出せる。
export function CallToActionCTA({
  title = "参考書はもう不要！スマホでWebテスト対策",
  description = "高精度模試・忘却曲線復習・企業スカウトまで、学生は完全無料で使えます。",
  buttonText = "完全無料で今すぐ始める",
}: {
  title?: string;
  description?: string;
  buttonText?: string;
}) {
  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 px-5 py-5 text-center">
      <p className="text-base font-bold text-gray-900 sm:text-lg">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
      <Link
        href="/register"
        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        {buttonText}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
