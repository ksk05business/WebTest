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
          本規約は、[運営者名]（以下「当社」）が提供する「Webテストナビ」（以下「本サービス」）の利用条件を定めるものです。ユーザーは、本規約に同意のうえ本サービスを利用するものとします。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第2条（本サービスの内容）</h2>
        <p className="text-sm text-gray-700">本サービスは、以下の機能から構成されます。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>SPI3・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOA等の適性検査対策のためのWebテスト模試・練習問題の提供</li>
          <li>
            学生ユーザーが個別に同意した場合に限り、その匿名化された成績・属性データを提携企業に公開し、企業からの匿名スカウトメッセージを受け取れる「2段階開示型スカウトサービス」（第7条）
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第3条（職業安定法上の位置づけ）
        </h2>
        <p className="text-sm text-gray-700">
          当社が提供するスカウトサービスは、職業安定法上の「募集情報等提供事業」に該当するものとして運営します。当社は同法に定める募集情報等提供事業者としての遵守事項（求人情報等の的確な表示、苦情処理体制の整備等）を遵守します。
        </p>
        <p className="text-sm text-gray-700">
          当社は、職業紹介事業者としての許可を得て個別のマッチング・あっせん・推薦を行う「職業紹介事業」は行いません。企業への情報提供および企業からユーザーへのスカウト送信、ユーザー本人による承諾・辞退の判断は、いずれもシステムを通じて自動的に処理され、当社が個別に候補者を選定・推薦することはありません。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第4条（利用登録）</h2>
        <p className="text-sm text-gray-700">
          利用希望者は本規約およびプライバシーポリシーに同意のうえ、当社の定める方法により利用登録を行うものとします。ユーザーは、登録情報について常に真実かつ正確な内容を届け出るものとし、1人につき1アカウントの作成を原則とします（第8条参照）。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第5条（収集する情報）</h2>
        <p className="text-sm text-gray-700">
          当社は、氏名（漢字・ローマ字）、メールアドレス、大学名・大学区分、学部・区分、志望業界、希望職種、卒業年月、模試の受験結果・成績データ等を取得します。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第6条（利用目的）</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>本サービス（模試・練習問題）の提供、成績管理・分析</li>
          <li>ユーザーからのお問い合わせ対応</li>
          <li>
            ユーザーが別途同意した場合に限り、提携する企業様への情報提供（第7条）
          </li>
        </ul>
      </section>

      <section id="scout" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第7条（第三者提供・スカウト目的でのデータ共有）
        </h2>
        <p className="text-sm text-gray-700">
          当社は、ユーザーが登録画面またはマイページで個別に同意した場合に限り、以下の情報を提携する企業様（以下「提携企業」）に提供することがあります。この提供は任意であり、同意しなくても本サービスの模試・練習問題機能は利用できます。同意はマイページからいつでも撤回できます。
        </p>
        <p className="text-sm text-gray-700">
          本サービスの提携企業は、求職者の直接採用（自社採用）を目的とする事業会社に限られます。求職者を他社へ紹介・仲介する人材紹介行為を目的とした利用、および取得した情報を第三者へ転売する目的での利用（就活エージェント・人材紹介会社等による利用）は、提携企業としての登録・利用を認めません。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>
            提供する情報（1段階目・匿名データのみ）: 大学区分 / 学部・区分（文理） / 志望業界 / 希望職種 / 模試の偏差値。氏名・メールアドレス等、個人を特定できる情報は含みません。
          </li>
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
        <h2 className="text-lg font-semibold text-gray-900">第8条（禁止事項）</h2>
        <p className="text-sm text-gray-700">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>他人になりすまして受験する、複数人で協力して解答するなど、模試・練習問題の成績を不正に取得する行為</li>
          <li>1人のユーザーが複数のアカウントを作成する行為</li>
          <li>
            提携企業から受け取ったスカウトメッセージの内容を、当該企業の許可なく第三者に転載・転送・公開する行為
          </li>
          <li>虚偽の情報を登録する行為</li>
          <li>本サービスのシステムに不正にアクセスする行為、リバースエンジニアリング等の解析行為</li>
          <li>法令、公序良俗に違反する行為、当社または第三者の権利を侵害する行為</li>
          <li>その他、当社が本サービスの運営上不適切と判断する行為</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第9条（本サービスの停止・変更・終了）
        </h2>
        <p className="text-sm text-gray-700">
          当社は、以下のいずれかに該当する場合、ユーザーへの事前の通知なく本サービスの全部または一部の提供を停止・中断できるものとします。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>システムの保守点検・更新を行う場合</li>
          <li>地震、火災、停電、天災等の不可抗力により本サービスの提供が困難な場合</li>
          <li>その他、当社が停止・中断を必要と判断した場合</li>
        </ul>
        <p className="text-sm text-gray-700">
          当社は、ユーザーへの事前の通知をもって、本サービスの内容を変更し、または本サービスの提供を終了できるものとします。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第10条（免責事項）</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>
            当社は、本サービスで提供する模試・練習問題の内容の正確性、実際の適性検査の出題内容との一致を保証するものではありません。
          </li>
          <li>
            当社は、スカウト機能を通じたユーザーと提携企業との間のやり取り、選考結果、内定その他一切の結果について保証・関与せず、責任を負いません。
          </li>
          <li>
            当社は、本サービスの中断・停止・終了、データの消失その他本サービスに関連してユーザーに生じた損害について、当社の故意または重過失による場合を除き、一切の責任を負いません。
          </li>
          <li>
            本サービスから他のウェブサイト等へのリンクまたは他のウェブサイト等から本サービスへのリンクにより提供される情報、サービス等について、当社は一切の責任を負いません。
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第11条（規約の変更）</h2>
        <p className="text-sm text-gray-700">
          当社は、必要と判断した場合には、ユーザーに通知することにより、本規約を変更できるものとします。
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第12条（準拠法・管轄）</h2>
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
