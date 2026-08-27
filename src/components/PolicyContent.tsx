// /policy（単独ページ）専用の「問題作成ポリシーおよび非公式サービスに関するご案内」本文。
// 利用規約（TermsContent.tsx）第11条・第12条と同内容を、単独ページとして読みやすく整理して掲載する
// （フッター・利用規約の両方からアクセスできるようにするためのユーザー向け案内エリア）。
export function PolicyContent() {
  return (
    <>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">
        問題作成ポリシーおよび非公式サービスに関するご案内
      </h1>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          1. 問題の作成プロセスとオリジナル性について
        </h2>
        <p className="text-sm text-gray-700">
          当サービス上のすべての問題、選択肢、解説、テキストコンテンツは、生成AI技術と当社独自のプロンプト設計・アルゴリズムを活用してゼロから生成され、専門の監修プロセスを経て提供されているオリジナルコンテンツです。
        </p>
        <p className="text-sm text-gray-700">
          既存の市販参考書、出版物、他社Webサイト、または実際のテスト問題等の複製・転載・翻案ではありません。本サービス上のコンテンツに関する著作権その他の知的財産権は、すべて当社に帰属します。
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-900">
          2. 商標権表記および運営会社との関係について（非公式の明記）
        </h2>
        <p className="text-sm text-gray-700">
          当サービスは、各適性検査の出題傾向を独自に研究・分析して作成された「非公式の対策・学習支援ツール」であり、各テストの実施会社・開発元企業とは一切関係がありません。本サービスの内容について、以下各社が推奨・保証・提携しているものではありません。
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          <li>「SPI」「SPI3」は株式会社リクルートマネジメントソリューションズの登録商標です。</li>
          <li>「玉手箱」「GAB」「CAB」は日本エス・エイチ・エル株式会社の登録商標または商標です。</li>
          <li>「TG-WEB」は株式会社ヒューマネージの登録商標です。</li>
          <li>「SCOA」は株式会社日本総合適性職能点検協会の登録商標または商標です。</li>
        </ul>
      </section>

      <p className="mt-6 text-xs text-gray-500">
        本ページの内容は、利用規約第11条（知的財産権・問題作成ポリシー）および第12条（商標権表記・非公式サービスであることの明記）にも正式な条項として定めています。詳細は
        <a href="/terms" className="text-blue-600 underline">
          利用規約
        </a>
        をご確認ください。
      </p>
    </>
  );
}
