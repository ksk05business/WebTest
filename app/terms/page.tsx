import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-bold">これは仮ドラフトです。</p>
        <p className="mt-1">
          実際の公開前に、必ず弁護士（可能であれば職業安定法にも詳しい方）のレビューを受けてください。特に第三者提供・スカウト目的でのデータ共有に関する条項は、事業モデル（有料職業紹介事業の許可要否を含む）とあわせて確認が必要です。
        </p>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">利用規約</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第1条（適用）</h2>
        <p className="text-sm text-gray-700">
          本規約は、[運営者名]（以下「当社」）が提供する「SPIナビ」（以下「本サービス」）の利用条件を定めるものです。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第2条（利用登録）</h2>
        <p className="text-sm text-gray-700">
          利用希望者は本規約およびプライバシーポリシーに同意のうえ、当社の定める方法により利用登録を行うものとします。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第3条（収集する情報）</h2>
        <p className="text-sm text-gray-700">
          当社は、氏名、メールアドレス、大学名、学部・区分、志望業界、卒業年月、模試の成績等を取得します。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第4条（利用目的）</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>本サービス（模試・練習問題）の提供、成績管理</li>
          <li>ユーザーからのお問い合わせ対応</li>
          <li>
            ユーザーが別途同意した場合に限り、提携する就活エージェント・企業への情報提供（第5条）
          </li>
        </ul>
      </section>

      <section id="scout" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第5条（第三者提供・スカウト目的でのデータ共有）
        </h2>
        <p className="text-sm text-gray-700">
          当社は、ユーザーが登録画面またはマイページで個別に同意した場合に限り、以下の情報を提携する就活エージェント・企業（以下「提携企業」）に提供することがあります。この提供は任意であり、同意しなくても本サービスの模試・練習問題機能は利用できます。同意はマイページからいつでも撤回できます。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>提供する情報（1段階目・匿名データのみ）: 大学区分 / 学部・区分（文理） / 志望業界 / 模試の偏差値。氏名・メールアドレス等、個人を特定できる情報は含みません。</li>
          <li>提供先: [提携企業の範囲・選定基準を記載]</li>
          <li>提供の目的: 提携企業からユーザーへのスカウト・求人情報の案内</li>
          <li>
            当社は、この情報提供に関連して提携企業から紹介手数料等の対価を受け取る場合があります。
          </li>
        </ul>
        <p className="text-sm font-semibold text-gray-900">2段階開示の仕組み</p>
        <p className="text-sm text-gray-700">
          本サービスのスカウト機能は、個人を特定できない匿名データの開示（1段階目）と、ユーザー本人の承諾後に限り行われる氏名・連絡先の開示（2段階目）の2段階で構成されます。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>
            1段階目: 提携企業が閲覧できるのは、上記の匿名データのみです。ユーザーの氏名・メールアドレス等は一切開示されません。提携企業は匿名データをもとに、特定のユーザーに対して匿名のスカウトメッセージを送ることができます。
          </li>
          <li>
            2段階目: ユーザーがマイページでスカウトを確認し「承諾」を選択した場合に限り、その提携企業に対してのみ氏名・メールアドレスが開示されます。「辞退」した場合は開示されません。当社は個別のマッチング・推薦・面談調整を行わず、開示の可否はユーザー本人の操作のみで決まります。
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第6条（禁止事項）</h2>
        <p className="text-sm text-gray-700">[一般的な禁止事項を記載]</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第7条（免責事項）</h2>
        <p className="text-sm text-gray-700">[免責事項を記載]</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第8条（規約の変更）</h2>
        <p className="text-sm text-gray-700">
          当社は、必要と判断した場合には、ユーザーに通知することにより、本規約を変更できるものとします。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第9条（準拠法・管轄）</h2>
        <p className="text-sm text-gray-700">
          本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、[管轄裁判所]を専属的合意管轄とします。
        </p>
      </section>

      <p className="text-sm text-gray-500">最終改定日: [YYYY年MM月DD日]</p>

      <Link href="/register" className="text-sm text-blue-600 underline">
        会員登録に戻る
      </Link>
    </main>
  );
}
