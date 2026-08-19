import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-bold">これは仮ドラフトです。</p>
        <p className="mt-1">
          実際の公開前に、必ず弁護士のレビューを受けてください。個人情報保護法（第三者提供の同意・記録義務・オプトアウト等）に照らした確認が必要です。
        </p>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">プライバシーポリシー</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">1. 取得する個人情報</h2>
        <p className="text-sm text-gray-700">
          氏名（漢字・ローマ字）、メールアドレス、パスワード（ハッシュ化して保存）、大学名、学部・区分、志望業界、卒業年月、模試の受験結果。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">2. 利用目的</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>本人確認、ログイン認証</li>
          <li>模試・練習問題の提供、成績の記録・表示</li>
          <li>お問い合わせへの対応</li>
          <li>
            ユーザーが個別に同意した場合の、提携企業へのスカウト目的での情報提供
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">3. 第三者提供について</h2>
        <p className="text-sm text-gray-700">
          当社は、法令に基づく場合を除き、ユーザーの同意なく個人データを第三者に提供しません。登録時またはマイページで「スカウト目的での情報提供」に同意したユーザーについてのみ、提携企業に対して該当情報を提供します。同意はいつでも撤回可能です。撤回後は、以後の新たな提供を停止します。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">4. 第三者提供の記録</h2>
        <p className="text-sm text-gray-700">
          個人情報保護法に基づき、第三者への提供に関する記録を作成・保管します。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">5. 安全管理措置</h2>
        <p className="text-sm text-gray-700">
          パスワードはハッシュ化して保存し、平文では保持しません。[その他の安全管理措置を記載]
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">6. 開示・訂正・利用停止等の請求</h2>
        <p className="text-sm text-gray-700">
          ユーザーは、当社が保有する自己の個人情報について、開示・訂正・利用停止等を請求できます。マイページから多くの項目をご自身で確認・修正いただけるほか、[問い合わせ窓口]までご連絡ください。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">7. お問い合わせ窓口</h2>
        <p className="text-sm text-gray-700">[運営者名 / 住所 / 連絡先を記載]</p>
      </section>

      <p className="text-sm text-gray-500">最終改定日: [YYYY年MM月DD日]</p>

      <Link href="/register" className="text-sm text-blue-600 underline">
        会員登録に戻る
      </Link>
    </main>
  );
}
