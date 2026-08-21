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
        <p className="text-sm text-gray-700">当社は、本サービスの提供にあたり、以下の情報を取得します。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>氏名（漢字・ローマ字）、メールアドレス、パスワード（ハッシュ化して保存）</li>
          <li>大学名・大学区分、学部・区分、志望業界、希望職種、卒業年月</li>
          <li>Webテスト（模試）の受験結果・成績データ（正答率、偏差値、分野別成績等）</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">2. 利用目的</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>本人確認、ログイン認証</li>
          <li>模試・練習問題の提供、成績（偏差値等）の算出・記録・表示</li>
          <li>お問い合わせへの対応</li>
          <li>
            ユーザーが個別に同意した場合の、提携企業への情報提供によるスカウト情報の配信（3.のとおり2段階で開示）
          </li>
          <li>本サービスの品質向上、不具合の調査・改善</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          3. 第三者提供（スカウト機能）に関する同意事項
        </h2>
        <p className="text-sm text-gray-700">
          当社は、法令に基づく場合を除き、ユーザーの同意なく個人データを第三者に提供しません。登録時またはマイページで「スカウト目的での情報提供」に個別に同意したユーザーについてのみ、以下の2段階に分けて提携企業に情報を提供します。同意は任意であり、同意しなくても模試・練習問題機能は利用できます。同意はマイページからいつでも撤回でき、撤回後は以後の新たな提供を停止します。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>
            <span className="font-semibold text-gray-900">1段階目（匿名化データの開示）: </span>
            提携企業が閲覧できるのは、氏名・メールアドレス等の連絡先を除外した匿名化データ（大学区分・学部区分（文理）・志望業界・希望職種・模試の偏差値）のみです。個人を特定できる情報は一切含まれません。
          </li>
          <li>
            <span className="font-semibold text-gray-900">2段階目（実名情報の開示）: </span>
            ユーザーが受け取ったスカウトに対して「承諾」した場合に限り、その提携企業に対してのみ氏名・メールアドレスを開示します。「辞退」した場合、または何も操作しない場合は開示されません。
          </li>
        </ul>
        <p className="text-sm text-gray-700">
          当社は、この情報提供に関連して提携企業から紹介手数料等の対価を受け取る場合があります。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">4. 第三者提供の記録</h2>
        <p className="text-sm text-gray-700">
          個人情報保護法に基づき、第三者への提供に関する記録（同意日時・撤回日時・提供先等）を作成・保管します。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">5. 安全管理措置</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>パスワードおよびパスワード再設定用のワンタイムパスワードは、いずれも不可逆なハッシュ化処理を施して保存し、平文では保持しません。</li>
          <li>通信は暗号化（HTTPS/TLS）した経路で行います。</li>
          <li>個人データへのアクセスは、業務上必要な範囲に限定します。</li>
          <li>[その他、委託先の監督体制等、実施している安全管理措置があれば記載]</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">6. 開示・訂正・削除等の請求</h2>
        <p className="text-sm text-gray-700">
          ユーザーは、当社が保有する自己の個人情報について、開示・訂正・利用停止・削除等を請求できます。氏名・大学・志望業界等の多くの項目はマイページからご自身で確認・修正いただけます。アカウントの削除等、マイページから対応できない請求については、[問い合わせ窓口]までご連絡ください。
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
