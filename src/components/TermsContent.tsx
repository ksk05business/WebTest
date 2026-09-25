// /terms（単独ページ）と会員登録画面の規約確認モーダルの両方から共用する、利用規約の本文。
// 二重管理による内容の食い違いを防ぐため、テキストはここに一本化する。
export function TermsContent() {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900">利用規約</h1>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第1条（適用）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            本規約は、Nika（以下「当方」といいます）が提供する「Webテストナビ」（以下「本サービス」）の利用条件を定めるものです。ユーザーは、本規約に同意のうえ本サービスを利用するものとします。
          </li>
          <li>本規約のほか、本サービス上に掲載するプライバシーポリシー、ガイドライン、ヘルプ等も本規約の一部を構成するものとします。</li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第2条（本サービスの内容）</h2>
        <p className="text-sm text-gray-700">本サービスは、以下の機能から構成されます。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>SPI・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOA等の適性検査対策のためのWebテスト模試・練習問題の提供</li>
          <li>
            学生ユーザーが個別に明示的な同意をした場合に限り、その制限された属性データ・成績データを提携企業に公開し、企業からのスカウトメッセージを受け取れる「2段階開示型スカウトサービス」（第7条）
          </li>
        </ul>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第3条（職業安定法上の位置づけおよび遵守）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            当方が提供するスカウト機能は、職業安定法第43条の2に定める「募集情報等提供事業」として運営されます。当方は、同法および関連法令・省令・ガイドラインを遵守し、募集情報等提供事業者としての責務（情報の的確な表示、苦情処理体制の整備、個人情報の適切な管理等）を果たします。
          </li>
          <li>
            当方は、求職者と求人企業との間における個別のあっせん、推薦、交渉等を行う「職業紹介事業」は行いません。本サービスにおける情報提供、スカウト送信、承諾または辞退の判定等はすべてシステムにより自動的に処理され、当方が特定の候補者を選定または推薦することはありません。
          </li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第4条（利用登録・アカウント管理）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>利用希望者は、本規約およびプライバシーポリシーに同意のうえ、当方の定める方法により利用登録を行うものとします。</li>
          <li>未成年者が利用登録を行う場合は、親権者等の法定代理人の同意を得た上で登録を行うものとします。</li>
          <li>ユーザーは、登録情報について常に真実かつ正確な内容を登録するものとし、変更が生じた場合は遅滞なく修正するものとします。</li>
          <li>1人のユーザーが複数のアカウントを作成する行為、および複数人で1つのアカウントを共有する行為は禁止します。</li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第5条（収集および処理する情報）</h2>
        <p className="text-sm text-gray-700">当方は、本サービスの提供にあたり、ユーザーから以下の情報を取得・処理します。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>アカウント情報: 氏名（漢字・ローマ字）、メールアドレス、大学名・学部・区分（文理）、卒業予定年月等</li>
          <li>属性・適性情報: 志望業界、希望職種、MBTI適性情報（任意入力）等</li>
          <li>成績・利用履歴データ: 模試・練習問題の受験結果、偏差値、正答率、学習履歴等</li>
        </ul>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第6条（利用目的）</h2>
        <p className="text-sm text-gray-700">当方は、取得した情報を以下の目的で利用します。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>本サービス（模試・練習問題等）の提供、成績管理・分析および精度向上</li>
          <li>ユーザーからの問い合わせ対応および重要なお知らせの送信</li>
          <li>ユーザーが第7条に基づき個別に明示の同意をした場合における、提携企業への情報提供</li>
        </ul>
      </section>

      <section id="scout" className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第7条（第三者提供・2段階開示型スカウトサービス）
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            当方は、ユーザーがマイページ等で個別に同意（オプトイン）した場合に限り、以下の規定に従って提携企業へ情報を開示・提供します。本同意は任意であり、同意しない場合であっても本サービスの模試・練習問題機能は制約なく利用できます。同意はマイページよりいつでも撤回（オプトアウト）可能です。
          </li>
          <li>
            本サービスの提携企業は、自社による直接採用（自社雇用の募集）を目的とする事業会社に限られます。職業紹介事業者・就活エージェント・人材派遣会社等による他社への紹介・転売目的での利用は一切認めません。
          </li>
          <li>
            【スカウト機能における2段階開示の仕組み】
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold text-gray-900">第1段階（匿名データの共有）:</span>{" "}
                ユーザーの個別同意に基づき、提携企業に対し、個人を特定できない情報（大学区分・文理区分・志望業界・希望職種・MBTI適性情報・模試の偏差値等）のみを開示します。氏名、メールアドレス等の個人識別情報は含まれません。提携企業はこの匿名データをもとに、特定のユーザーに対してシステムを通じて匿名スカウトを送信できます。
              </li>
              <li>
                <span className="font-semibold text-gray-900">第2段階（個人情報の開示）:</span>{" "}
                ユーザーが受信したスカウトを確認し、システム上で「承諾」を選択した場合に限り、その選択された提携企業に対してのみ、ユーザーの氏名およびメールアドレス等の個人情報が開示されます。「辞退」を選択した場合、個人情報は開示されません。
              </li>
            </ul>
          </li>
          <li>当方は、本サービスにおける情報提供に関連して、提携企業からシステム利用料または成果報酬等の対価を受領することがあります。</li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第8条（禁止事項）</h2>
        <p className="text-sm text-gray-700">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>他人になりすまして受験する行為、または複数人で協力して模試・問題の解答を行う不整行為</li>
          <li>複数アカウントの作成・保持、または第三者へのアカウントの譲渡・貸与行為</li>
          <li>虚偽の学歴、成績、属性情報を登録・提供する行為</li>
          <li>提携企業から受け取ったスカウトメッセージ、選考情報等を当方の事前承諾なく第三者に転載・公開・漏洩する行為</li>
          <li>本サービスのコンテンツ、システム、プログラムのリバースエンジニアリング、スクレイピング、不正アクセス等、当方の事業活動を妨害する行為</li>
          <li>法令、公序良俗に違反する行為、または当方もしくは第三者の権利を侵害する行為</li>
        </ul>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第9条（本サービスの停止・変更・終了）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            当方は、以下のいずれかに該当する場合、ユーザーへの事前通知なく本サービスの全部または一部の提供を停止または中断できるものとします。
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>システムの保守、点検、更新を定期的にまたは緊急に行う場合</li>
              <li>火災、停電、天災地変、通信回線の障害等の不可抗力により本サービスの提供が困難な場合</li>
              <li>その他、当方が運用上または技術上、停止または中断が必要と判断した場合</li>
            </ul>
          </li>
          <li>当方は、当方の都合により、事前の周知期間をもって本サービスの内容を変更し、または本サービスの提供を終了することができるものとします。</li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第10条（免責事項）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            当方は、本サービスで提供する模試・練習問題の内容の正確性、完全性、最新性、および実際の適性検査における出題傾向や結果との一致を何ら保証するものではありません。
          </li>
          <li>
            当方は、スカウト機能を通じたユーザーと提携企業との間のコミュニケーション、面談、選考結果、採用契約の成否等について一切関与せず、これらに起因するトラブルや損害について責任を負いません。
          </li>
          <li>
            当方がユーザーに対して責任を負う場合（当方の故意または重過失による場合を除く）、当方の賠償責任は、ユーザーに直接かつ現実に生じた通常の損害に限られるものとします。
          </li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第11条（知的財産権・問題作成ポリシー）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            本サービス上で提供されるすべての問題、解説、テキスト、画像、プログラム等のコンテンツに関する著作権その他一切の知的財産権は、当方または正当な権利を有する第三者に帰属します。
          </li>
          <li>
            当方は、生成AI技術等を活用し、独自のプロンプトおよびアルゴリズムに基づいて完全オリジナルのコンテンツを作成・監修しています。既存の著作物を不当に複製・翻案したものではありません。
          </li>
          <li>ユーザーは、当方の事前の書面による許諾なく、本サービスのコンテンツを複製、転載、公衆送信、改変、二次利用してはなりません。</li>
        </ol>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          第12条（商標権表記・非公式サービスであることの明記）
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            本サービスで言及する各適性検査名称の商標権は、それぞれの権利者に帰属します。
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>「SPI」「SPI3」は、株式会社リクルートマネジメントソリューションズの登録商標です。</li>
              <li>「玉手箱」「GAB」「CAB」は、日本エス・エイチ・エル株式会社（SHL）の登録商標または商標です。</li>
              <li>「TG-WEB」は、株式会社ヒューマネージの登録商標です。</li>
              <li>「SCOA」は、株式会社日本総合適性職能点検協会の登録商標または商標です。</li>
            </ul>
          </li>
          <li>
            本サービスは、各テストの出題形式・傾向を独自に分析して作成された「非公式の学習・演習ツール」であり、上記各社その他のテスト実施・開発企業とは一切関係がありません。また、上記各社による推奨、保証、提携を受けるものではありません。
          </li>
        </ol>
        <p className="text-sm text-gray-700">
          問題の作成プロセスと商標権表記の詳細については、
          <a href="/policy" className="text-blue-600 underline">
            問題作成ポリシーおよび非公式サービスに関するご案内
          </a>
          もあわせてご確認ください。
        </p>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第13条（規約の変更）</h2>
        <p className="text-sm text-gray-700">
          当方は、必要と判断した場合には、本サービス上への掲示その他の適切な方法によりユーザーに周知することにより、本規約を変更できるものとします。変更後の規約は、掲示された効力発生時期より効力を生じるものとします。
        </p>
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">第14条（準拠法および管轄裁判所）</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
          <li>
            本サービスに関して当方とユーザーとの間で紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </li>
        </ol>
      </section>

      <p className="mt-4 text-xs text-gray-500">
        ※当サイトは各適性検査の運営会社とは関係のない非公式の対策サービスです。「SPI」は株式会社リクルートマネジメントソリューションズ等、各社の登録商標または商標です。
      </p>

      <p className="mt-4 text-sm text-gray-500">最終改定日: 2026年9月3日</p>
    </>
  );
}
