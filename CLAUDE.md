@AGENTS.md

# プロジェクト概要

サービス名「Webテストナビ」（2026-08-21に「SPIナビ」から改称）。「本を買わない就活生向けのWebテスト模試アプリ」。SPI3のほか玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOAにも対応する想定だが、実際に受験できる（`questions`テーブルにデータがあり`/test`で出題される）のは現状SPIのみで、他は`src/data/testTypes.ts`の`TEST_TYPES`で`available: false`（準備中）としてLP・ダッシュボードに掲載している。**2026-08-21にラインナップを整理し、従来別カードだった「GAB」「C-GAB」を`id: "gab_cgab"`の1カード「GAB / C-GAB」に統合、新たに`id: "scoa"`の「SCOA」を追加した**（公務員・地銀・中堅企業で頻出のSCOA性格・能力検査）。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。
画面は `/`（トップ）、`/register`（会員登録）、`/login`（ログイン）、`/dashboard`（ログイン後のホーム、ログイン必須）、`/test`（試験実行、ログイン必須）、`/result`（結果表示）。
登録・ログインに成功すると`localStorage`の`spiUser`にセットし、そのまま`/dashboard`へ遷移する（別途ログインを挟まない）。

## 本番D1のスキーマドリフトに注意（実際に発生した障害）

`schema.sql`の`CREATE TABLE IF NOT EXISTS`は既存テーブルには効かないため、コードで新しいカラムを参照し始めても本番D1には反映されず、テーブルは作られるがカラムが古いまま、という状態になりやすい。2026-08-20に実際にこれで障害が発生した：`users.terms_agreed_at`と`users.scout_consent`が本番`users`テーブルに存在しないまま`functions/api/register.ts`・`functions/api/consent.ts`がこれらを参照しており、新規登録は他カラムのおかげで見かけ上動いていたが（実際は登録自体が失敗していた可能性が高い）、マイページのスカウト同意更新は500エラーで「更新に失敗しました」となっていた。`ALTER TABLE users ADD COLUMN ...`で復旧済み。

**教訓**: `schema.sql`のCREATE TABLE文にカラムを追加・変更したら、必ず`npx wrangler d1 execute webtest-db --remote --command "PRAGMA table_info(<table>)"`で本番の実カラムと突き合わせ、足りなければその場で`ALTER TABLE`を実行すること。「言われたら次回直す」ではなく、スキーマ変更のたびに本番との差分確認をワークフローに組み込む。このセッションでは`wrangler d1 execute --remote`が認証済みで実行できたため、気づいた時点で直接修正して検証まで行った。

## 開発サーバーに関する重要な注意

`npm run dev`（`next dev`）は **`functions/` 配下のAPI（`/api/register`, `/api/login`等）を配信しない**。フロントエンドのUI・レイアウト確認だけなら`next dev`で十分だが、会員登録・ログインなど`fetch("/api/...")`を伴う動作確認をする場合は必ず **`npm run pages:dev`**（`next build && wrangler pages dev out`）を使うこと。これを守らないと`/api/register`が404になり、フロント側では「通信エラー」という紛らわしいメッセージになる（実際にこの不具合が一度発生している）。

## メール送信（パスワード再設定）に関する前提

`send_email`バインディング（Workers用）は**Cloudflare Pagesプロジェクトの設定検証で拒否される**（`wrangler pages deploy`が「Configuration file for Pages projects does not support "send_email"」で失敗した実例あり）ため使用不可。`functions/api/forgot-password.ts`は**Cloudflare Email SendingのREST API**（`fetch`＋Bearerトークン、`env.EMAIL_API_TOKEN`と`env.CLOUDFLARE_ACCOUNT_ID`を使用）でOTPメールを送信する。`CLOUDFLARE_ACCOUNT_ID`は`wrangler.jsonc`の`vars`に平文で設定済み（機密情報ではない）。**`EMAIL_API_TOKEN`はPages Secretとして未設定**（`wrangler pages secret put EMAIL_API_TOKEN --project-name=webtest`で設定する必要がある。トークン値は対話プロンプトで入力させ、絶対にコマンド引数や会話に直接書かない）。トークンが無い場合やドメインが未オンボードの場合は`sendOtpEmail`内でエラーがログに出るだけで、OTP自体はD1に正しく保存されメールだけ届かない（API応答は成功のまま）。

**ドメインのオンボード（`wrangler email sending enable shukatsu-webtest.com`）はこのセッションのOAuthトークンでは`Unauthorized [code: 2036]`で失敗する**（`wrangler email sending list/dns get/enable`いずれも同様、beta CLIコマンドの権限制約と思われる）。ダッシュボード（Compute & AI > Email Service > Email Sending > Onboard Domain）からの手動オンボードが必要。APIトークンの作成（Account > Email Sending > Edit権限）もダッシュボード側の操作が必要。

動作確認時にOTPの値を見たい場合は`forgot-password.ts`に一時的に`console.log`を仕込み、`wrangler pages dev`のログで確認してからコミット前に必ず削除すること（実際にこの手順で検証済み）。

## スカウト（第三者提供）機能の同意設計に関する重要な注意

将来的に学生の成績・個人情報を提携企業（就活エージェント等）へスカウト目的で提供し、その対価を収益源とする計画がある。個人情報保護法上、第三者提供には本人の明確な同意が必須であり、リクナビ内定辞退率問題（2019年）を直接の教訓として、以下の設計方針を必ず守ること。

- 「利用規約・プライバシーポリシーへの同意」（`agreedTerms`、必須）と「スカウト目的での第三者提供への同意」（`scoutConsent`、任意・デフォルトOFF）は**チェックボックスを分離**し、後者を本サービス利用の必須条件にしない。
- スカウト同意は`/mypage`からいつでも撤回できるようにする（`functions/api/consent.ts`）。
- 同意・撤回は`consent_events`テーブルに履歴として記録する（個人情報保護法29条の第三者提供記録の裏付けとして）。
- `app/terms/page.tsx`・`app/privacy/page.tsx`は弁護士レビュー前提の下書き。実際に第三者提供を開始する前に、文面と事業モデル（職業紹介事業許可の要否を含む）について弁護士のレビューを必ず受けること。

## スカウト機能・問題DBのスキーマ（schema.sql）

- `company_profiles`: 企業アカウント。職業安定法上「募集情報等提供事業」として運営する前提（`provider_business_type`）。`approved = 1`になるまで候補者閲覧・スカウト送信・スカウト履歴閲覧ができない。**企業の自己登録UIはまだ無く**、アカウントは`INSERT INTO company_profiles (..., approved)`で運営が直接作成する運用（パスワードは`functions/_lib/password.ts`のPBKDF2ハッシュで手動生成する必要がある）。ログイン画面（`/company/login`）・API（`functions/api/company/login.ts`）は実装済み。
- `scouts`: スカウト本体。**2段階開示フラグ`is_anonymous`**。企業は`users.scout_consent = 1`の学生の匿名属性（`university_category` / `faculty_type` / `industry_first`〜`third` / `exam_results.deviation_score`）のみを見て匿名スカウトを送る（`is_anonymous=1`で作成）。学生が`/mypage`で「承諾」した場合のみ`status='accepted'`かつ`is_anonymous=0`に更新し、そのスカウトに限り氏名・メールが開示される想定。「辞退」は`status='declined'`のまま`is_anonymous`は1を維持し開示しない。運営は手動マッチング・推薦を行わず、システムが状態遷移を処理するのみ。企業側が承諾済みスカウトの実名を取得するAPI（`functions/api/company/sent-scouts.ts`）も実装済み。
- `exam_results`: 模試結果のサーバー側記録。書き込み・読み取りAPI実装済み（`functions/api/exam-results.ts`）。
- `users.university_category`: 匿名開示用の大学区分（大学名そのものは開示しない）。`src/data/universityCategories.ts`の`getUniversityCategory()`で大学名からマッピングし、`register.ts`・`me.ts`のPUTで自動的に算出・保存する（実装済み）。2026-08-20に**就活で一般的な大学群の通称11区分に変更**: 旧帝一科（旧帝7校+一橋+東京科学大学）/ TOCKY（筑波・お茶の水・千葉・神戸・横浜国立）/ 電農名繊（電気通信・東京農工・名古屋工業・京都工芸繊維）/ その他国公立大学 / 早慶上理 / GMARCH / 関関同立 / 日東駒専 / 産近甲龍 / その他私立大学 / 海外大学。これらの通称に含まれる大学（九州大学・東京農工大学・東洋大学・甲南大学）は`src/data/universities.ts`の`UNIVERSITIES`に無かったため追加した。`src/data/universityCategories.ts`の全100校が漏れなくマッピングされていることをスクリプトで検証済み。既存ユーザー分は登録・プロフィール更新のタイミングでしか埋まらないため、古いレコードはNULLの可能性がある。

**手動入力大学の区分（2026-08-20対応）**: 一覧に無い大学は「その他国公立大学」「その他私立大学」「海外大学」の3択（`MANUAL_ENTRY_UNIVERSITIES`）から選んでから自由入力する。**この選んだ区分がそのまま`university_category`として保存される**（`register.ts`/`me.ts`が`manualUniversityCategory`をリクエストボディで受け取り、`MANUAL_ENTRY_UNIVERSITIES`に含まれる値ならそれを優先し、無ければ`getUniversityCategory(university)`にフォールバックする）。`UniversityField`は`onManualCategoryChange`で選択区分を親に伝え、マイページでは`/api/me`のGETが返す`university_category`を見て、一覧に無い大学＋手動区分に該当する場合のみ`initialManualCategory`として渡し、再保存時も区分が失われないようにしている。**この仕組みが無いと、手動入力大学は常に`getUniversityCategory`のフォールバック値（その他私立大学）に丸められてしまう**（海外大学を手動入力した場合も同様の不具合が過去にあった）。
- `questions`: SPI問題バンク（2026-08-21にD1へ移行済み、`/test`が実際にここから取得している）。詳細は「問題データのD1移行」の節を参照。`originality_note`は市販本の文章を書き写さず、解法アイデアの要約のみを記録する運用にすること。

## 企業・エージェント向け利用審査申請フロー & 管理者承認システム（2026-08-21）

いたずら登録防止のため、企業アカウントは「自己申請（status='pending'）→ 管理者が承認/却下」の2段階フローに変更した。**新規に`company_applications`テーブルは作らず、既存の`company_profiles`テーブルに`status`カラムを追加する方式**を選んだ（ユーザー要求で両案が許容されていたため、既存テーブル・既存の企業ログイン/スカウトAPIをそのまま使い回せる方を採用）。

**`company_profiles`のスキーマ変更**: `department`（部署）・`job_title`（役職）・`phone_number`・`corporate_site_url`・`account_type`（'direct_hire'|'agency'）・`inquiry_message`・`status`（'pending'|'active'|'rejected'、デフォルト'pending'）・`reviewed_at`を追加した。旧`approved INTEGER`カラムは**非推奨として残置**（SQLite/D1のALTER TABLEでは列のNOT NULL制約変更やDROPが安全に行いづらいため、削除はせず単にコード側で参照しなくした）。本番D1へは`ALTER TABLE`でカラム追加後、`UPDATE company_profiles SET status = 'active' WHERE approved = 1`で既存の承認済みアカウント（デモアカウント等）を`active`に昇格させる移行が必須（`schema.sql`の再実行だけでは反映されない、恒例のスキーマドリフト注意）。`password_hash`/`password_salt`は元々`NOT NULL`だが、申請時点ではまだパスワードが無いため空文字列`''`をプレースホルダーとしてINSERTしている（列定義自体は変更していない）。

**`POST /api/company/apply`**（公開、認証不要）: 会社名・担当者氏名/部署/役職・会社用メール・電話番号・コーポレートサイトURL・アカウント種別が必須、問い合わせメッセージは任意。会社用メールは`functions/_lib/freeEmailDomains.ts`のブロックリスト（gmail.com, yahoo.co.jp等、非網羅的な簡易リスト）でフリーメールを拒否し、コーポレートサイトURLは`http(s)://`形式かを`URL`コンストラクタで検証する。メール重複時は409を返す。成功時は`status='pending'`・`password_hash`/`password_salt`は空文字で企業レコードを作成するのみで、この時点ではログイン・スカウト機能には一切アクセスできない。

**管理者API**（`functions/api/admin/companies.ts`、GET一覧・POST承認/却下）: 既存の`POST /api/admin/questions`と同じ`x-admin-token`ヘッダー＋`ADMIN_API_TOKEN`（Pages Secret）による簡易認証を再利用している。承認（`action:'approve'`）時のみ`functions/_lib/password.ts`の`generateInitialPassword()`（英数字12桁）で初期パスワードを新規発行し、ハッシュ化して保存したうえで**平文パスワードをこのAPIレスポンスの中だけ**で返す（他のどこにも保持しない）。`status='pending'`の申請にしかapprove/rejectを実行できない（既に審査済みのものへの再操作は409で拒否、承認取り消し・再審査UIは今回実装していない）。

**`/admin/companies`ページ**: サーバー側セッションが無いこの構成に合わせ、`sessionStorage`に保存した管理APIトークンをそのまま`x-admin-token`として全リクエストに付与する簡易ゲート方式にした（ブラウザタブを閉じると再入力が必要）。承認直後は発行された初期パスワードを画面に一度だけ表示する専用バナーを出す。**メール送信機能（Cloudflare Email Sending）は公開ローンチまで未設定のまま据え置く方針のため、初期パスワードの企業への通知は運営担当者が画面表示された値を手動で連絡する運用を前提としている**（自動メール送信は行わない）。

**`/company/apply`**: 未ログイン向けの公開申請フォーム。送信後は「担当者より個別にご連絡いたします」という完了画面を表示する（自動メール通知は行わないため、この文言にしている）。

**アクセス制御の変更点**: `functions/api/company/login.ts`はパスワード照合の**前に**`status !== 'active'`を確認し、pending/rejectedいずれも「現在アカウントの審査中または無効化されています」を返してログイン自体を拒否する（以前は`approved=0`でもログインだけはでき、ダッシュボード側で「承認待ち」表示にとどめていたが、今回の要求で「ログイン自体を完全遮断」に強化した）。`functions/api/company/scouts.ts`・`sent-scouts.ts`も`approved`ではなく`status === 'active'`をチェックするよう更新済み（多層防御として維持。通常フローではログインで既に弾かれるため到達しないはずだが、念のため残している）。フロントエンド（`/company/dashboard`・`/company/scouts`・`localStorage`の`spiCompanyUser.approved`）は変更していない（ログイン成功時は常に`approved: true`が返る前提のまま動く）。

**LPへのBtoB導線追加**: `Footer`に「企業・就活エージェント様はこちら」リンク（`/company/apply`へ直接遷移）、「ご利用の流れ」と「ボトムCTA」の間に採用担当者向け価値訴求セクション（`id="business"`、`scroll-mt-20`でsticky headerに隠れないようスクロール位置を調整済み。「無料デモ・資料請求はこちら」＋「企業様ログイン」の2ボタン）を追加した。**ヘッダー内の同名リンクだけは`/company/apply`への直接遷移ではなく、`src/components/BusinessLink.tsx`（2026-08-21追加のクライアントコンポーネント）経由でLP内`#business`セクションへスムーススクロールする**（`usePathname()`で`/`にいる場合のみ`e.preventDefault()`＋`scrollIntoView({behavior:"smooth"})`、それ以外のページでは通常の`<Link href="/#business">`遷移に委ねる）。ヘッダーの3リンク（企業様リンク／ログイン／無料登録）の間隔は`gap-3`から`gap-6`に広げた。

## 模擬試験/練習問題モード選択ダイアログ（2026-08-21）

`/dashboard`の「試験の種類」カードは、直接`/test`へリンクする方式をやめ、クリックすると`src/components/ExamModeSelectModal.tsx`を開く方式にした。`available=false`（準備中）のカードもクリックできるようにし、モーダル内で「現在問題コンテンツを順次準備中です。公開まで今しばらくお待ちください。」と案内する（以前は非活性のdivだったが、今はボタンにしてどちらの状態でもモーダルを介す統一UIにした）。`available=true`（現状SPIのみ）の場合のみ、モーダル内に「模擬試験（本番モード、`/test`へ）」「練習問題（トレーニングモード、`/practice`へ）」の2択を表示する。

**現状SPI以外にテスト本体のコンテンツが無い**ため（`questions`テーブルに`test_type`列自体が無く、全問題が実質SPI向け）、モーダルの遷移先URLに`testType`などのクエリパラメータは付けていない。将来他のテスト種別に実データを追加する際は、`questions`テーブルへの`test_type`列追加や、`/test`・`/practice`側でのクエリパラメータに応じたフィルタリング実装が別途必要になる。

**`/practice`**（新規、`app/practice/page.tsx`）: `/test`とほぼ同じ問題フロー（`GET /api/questions`で取得、選択肢クリックで即座に正解/不正解と解説を表示）だが、①60秒カウントダウンではなく経過時間のカウントアップ表示、②終了後は`/result`へ遷移せず画面内で完了サマリー（正解数・経過時間）を表示、③`localStorage`の`spiResult`/`spiResultHistory`は一切更新しない（本番模試の最新結果表示と混同させないため）、という3点が異なる。「もう一度練習する」ボタンはページ遷移・リロードを伴わず、state を初期化して`/api/questions`を再取得するだけの実装にしている。

**`POST /api/exam-results`の`isPractice`拡張**: 練習モードは`isPractice: true`を付けて同じエンドポイントに送信する。`isPractice=true`の場合、`exam_results`へのINSERT（＝偏差値推移・カテゴリ別分析・受検回数に反映される「正式な記録」）は行わないが、間違えた言語(verbal)問題の復習キュー登録（`enqueueWrongVerbalAnswers`）は本番模試と同じロジックで実行する。これはユーザー要求の「回答履歴も...復習データの対象として保存できるように」を満たしつつ、「偏差値推移への影響有無は選択可」の部分は"影響しない"を選んだ結果（モーダル自体が模擬試験＝「成績・偏差値が記録される」練習問題＝そうした説明なし、と明確に書き分けているため、その約束と一致させた）。新規に専用エンドポイントは作らず、既存の`/api/exam-results`を拡張する形にした。

## LPの危機感訴求セクション・無料訴求の調整（2026-08-21）

ヒーロー直下に「危機感訴求」セクション（`app/page.tsx`）を追加した。他セクションの青〜紫グラデーションとは対照的に`bg-gray-900`のダーク背景＋赤系アクセント（`AlertTriangle`アイコン、赤〜アンバーのグラデーションテキスト、赤系CTAボタン）にして視覚的に警告色として際立たせている。「学生は完全無料」バナーからは運営モデルの説明文（「企業からのスカウト掲載料で運営されているため〜」）を完全に削除し、「学生は完全無料（全機能￥0）」の一文のみを大きく強調する形に変更した。バッジ文言も「SP/PC対応」→「スマホ / PC対応」に微調整した。

## サービス名リブランディング「SPIナビ」→「Webテストナビ」（2026-08-21）

ヘッダーロゴ（`DashboardHeader`/`CompanyHeader`/`AuthLayout`）、フッター（`Footer`）、`app/layout.tsx`のmetadata（title/description/OGP/Twitterカード）、パスワード再設定メールの送信者名・件名（`functions/api/forgot-password.ts`）、利用規約第1条・第2条（`app/terms/page.tsx`）を「Webテストナビ」に統一した。`app/privacy/page.tsx`には元々サービス名の直書きが無かったため変更不要（確認済み）。**`localStorage`のキー名`spiUser`/`spiCompanyUser`、`wrangler.jsonc`の`"name": "spi-mock-app"`、Cloudflare Pagesのプロジェクト名`webtest`は、ユーザーに見えない内部識別子のため意図的に変更していない**（特に`wrangler.jsonc`の`name`やCloudflareのプロジェクト名を変えるとデプロイ先のバインディングが変わりかねないため触らないこと）。

サービス名変更に合わせ、単一の「SPI」テストに閉じた文言を「主要Webテスト全般」に対応する文言へ広げた（例: 利用規約第2条「SPI等の適性検査対策」→「SPI3・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOA等の適性検査対策」、LPのヒーローコピー・ステップ説明等。2026-08-21のラインナップ整理でGAB/C-GABの表記統合・SCOA追加に合わせてさらに更新済み）。実際に受験可能なのは現状SPIのみという状態は変わっていない（上記プロジェクト概要を参照）。

## ファビコン・ログイン/会員登録画面のデザイン刷新（2026-08-21）

**ファビコン**: `app/favicon.ico`（デフォルトのVercelロゴ）を削除し、`app/icon.svg`（Next.jsのファイル規約による自動アイコン検出）に置き換えた。青(`#3b82f6`)→紫(`#8b5cf6`)グラデーションの角丸正方形に、白いコンパス針（N-Sを不透明・E-Wを半透明にした4方向の菱形）を重ねたデザイン。PNG/ICOへのラスタライズが必要な`apple-icon.png`は、画像変換ツールがこの環境に無いため作成していない（iOSのホーム画面追加時のアイコンはブラウザ既定にフォールバックする）。`app/layout.tsx`の`metadata`にタイトル「SPIナビ | 就活生のWebテスト対策＆スカウト」・description・`icons.icon`を設定し、`<html lang="en">`を`lang="ja"`に修正した（今までデフォルトの"Create Next App"のままだった）。

**`/login`・`/register`のUI刷新**: 新規`src/components/AuthLayout.tsx`（両ページ共通のラッパー）が、`lg:`以上でグラデーション（blue→indigo→purple）のビジュアルパネル（キャッチコピー・強み3点をLucideアイコン付きで表示、`lg:sticky lg:top-0 lg:h-screen`でスクロールしても固定）とガラスモーフィズム風フォームカードの2カラムを構成する。モバイル（`lg:`未満）ではビジュアルパネルを完全に非表示にし、フォーム上部にロゴのみのコンパクトな見出しを出す（`/register`は項目数が多く、フル高さの2カラムがモバイルで崩れるため）。`src/components/IconInput.tsx`（Lucideアイコン付き入力欄、フォーカス時に`ring-4 ring-blue-500/10`のアニメーション）を氏名・メール・パスワードの各欄に使用。`UniversityField`・`IndustrySelect`・`LimitedCheckboxGroup`など既存の複合コンポーネントは内部スタイルを変更していない（`/mypage`の編集フォームでも共用されているため、意図せず影響が及ばないようにするため）。**両ページともバリデーション・API呼び出し・state管理ロジックは一切変更しておらず、見た目のみの刷新**。

## 成績ダッシュボード・エビングハウス反復復習機能（2026-08-21）

**成績ダッシュボード**（`src/components/PerformanceDashboard.tsx`、`/mypage`から`email`を渡して描画）: サマリーカード（最高偏差値・直近偏差値・累計受検回数・評価ランクS〜D）、偏差値推移の折れ線グラフ（`recharts`を新規導入。`ResponsiveContainer`+`LineChart`、`app/layout.tsx`同様`"use client"`コンポーネント内でのみ使用）、カテゴリ別（言語/非言語/構造的把握）の正解率・偏差値バーと得意分野/弱点タグを表示する。復習リマインドカード（`今日復習すべき問題（N件）`、`GET /api/review`の件数がベース）もこのコンポーネント内にまとめて置いた。

**カテゴリ別偏差値の算出方法**: `functions/api/exam-results.ts`のGETで、`questions`テーブルから`DISTINCT category, sub_category`を取得して小分類→大分類（`non_verbal`/`verbal`/`structural`）の対応表を作り、ユーザー自身の`category_scores_json`履歴（直近20件）をこの対応表で大分類ごとに集計する。母集団は「直近500件の`exam_results.category_scores_json`を同じ対応表で大分類ごとにバケット化した、受験ごとの正答率のリスト」とし、既存の`calculateDeviationScore()`（母集団の平均・標準偏差との比較）をそのまま流用して大分類別の偏差値を出す。**全体の偏差値と同じ「簡易実装」であり、サンプルが少ない/母集団が無い場合は50固定になる**（既存の全体偏差値ロジックと同じ制約）。`GET /api/exam-results`のレスポンスに`bestDeviationScore`・`categoryBreakdown`（`{category, correct, total, accuracyRate, deviationScore}[]`）を追加した。評価ランク（S〜D）は`latestDeviationScore`からクライアント側（`PerformanceDashboard`の`getRank()`）で算出しており、サーバー側には持たない。

**エビングハウスの忘却曲線に基づく反復復習**: `user_question_reviews`テーブル（`schema.sql`）を新設。ユーザー×問題ごとに1行のみ保持し、復習のたびに`review_stage`（完了済み復習回数、0〜4）と`next_review_at`を上書き更新する方式（履歴は積まない）。スケジュールは`functions/_lib/reviewSchedule.ts`の`nextIntervalDaysAfterStage()`に集約: キュー追加時（stage0）→1日後に1回目、1回目正解（stage1）→3日後に2回目、2回目正解（stage2）→7日後に3回目、3回目正解（stage3）→14日後に4回目、4回目正解（stage4）で`status='mastered'`となり出題対象から外れる。不正解の場合は`review_stage`を0に戻し`status='active'`のまま翌日（+1日）に再スケジュールする（mastered済みの問題を後で間違えた場合も同様にreactivateされる）。

**言語カテゴリのみを対象とする理由と実装**: ユーザー要求「言語・知識系問題向けに」に対応するため、`/test`（`functions/api/exam-results.ts`のPOST）で間違えた問題のうち`questions.category = 'verbal'`のものだけを復習キューへ`INSERT ... ON CONFLICT(user_id, question_id) DO UPDATE`でupsertする（`enqueueWrongVerbalAnswers()`）。この判定はクライアントを信用せず、サーバー側で`questionId`から`questions`テーブルを再照会して行う。**この機能が実際に動作を確認できるよう、`verbal`カテゴリの問題が1問も無かった当初のシードデータに、`POST /api/admin/questions`で語彙問題を2問追加した**（ローカル・本番とも）。

**`/test`側の変更**: 回答結果`results`ステートに`questionId`を追加し（既存の`category`/`correct`はそのまま）、`POST /api/exam-results`のボディに`answers: {questionId, correct}[]`を追加で送るようにした（`categoryScores`の集計ロジック自体は変更していない）。

**新規API**:
- `GET /api/review?email=`: `status='active'`かつ`next_review_at <= now`の復習対象を`next_review_at`昇順で返す。DB行→クライアント形状への変換は`functions/_lib/questionFormat.ts`の`toClientQuestion()`（`functions/api/questions.ts`と共通化）を再利用している。
- `POST /api/review`: `{email, reviewId, result: 'correct'|'incorrect'}`。`reviewId`の所有者（`user_id`）を検証してから更新する。

**`/review`ページ**（`app/review/page.tsx`）: 認証チェック後に`GET /api/review`で当日分を取得し、1問1答形式（タイマー無し）で出題する。回答するたびに即座に`POST /api/review`を送るため、セッションを離脱しても進捗は保存される。0件の場合と全問終了後の完了画面をそれぞれ用意した。

ユーザー要求では`/api/mypage`という新エンドポイント名が示されていたが、既存の`GET /api/exam-results`が既にほぼ同じ情報（偏差値推移履歴・受験回数）を返していたため、そこにカテゴリ別内訳とベスト偏差値を追加する形で拡張した（重複するDB往復・エンドポイントを増やさないための判断）。「今日復習が必要な問題数」は`GET /api/review`の配列長をそのままカウントとして`PerformanceDashboard`側で使っており、専用のカウント返却フィールドは設けていない。

## 問題データのD1移行（2026-08-21）

`src/data/questions.ts`にハードコードしていたSPI問題を`questions`テーブル（D1）へ完全移行した。旧`questions`/`question_choices`テーブル（未使用・0件）は`DROP TABLE`してから作り直した（本番D1へも同様に適用済み、実データが無かったため安全に実施できた）。

**新schema**: `id, category（大分類。"non_verbal"|"verbal"|"structural"）, sub_category（小分類。例:"損益算","推論","資料の読み取り"）, title（任意）, question_text, tables_json（表問題のみ、JSON文字列）, options（選択肢のJSON配列）, correct_answer（optionsの0始まりインデックス）, explanation（解説ステップのJSON文字列配列）, difficulty（1〜5）, status（'draft'|'published'|'archived'、デフォルト'published'）, originality_note（任意）, created_at`。旧設計にあった`question_choices`（選択肢を別テーブルに分離する方式）は廃止し、`options`のJSON配列に一本化した。

**移行スクリプト**: `scripts/generate-seed-questions.mts`（Node 24のネイティブTS実行で`node scripts/generate-seed-questions.mts`と直接実行）が`src/data/questions.ts`の配列を読み、`seed_questions.sql`（INSERT文5件）を生成した。**移行後、`src/data/questions.ts`からは配列本体を削除し、型定義（`Question`/`TableBlock`）のみを残した**（`/test`が今もこの型をクライアント側の形状として使うため）。したがってこのスクリプトはもう再実行できない一度きりの移行アーティファクトであり、`scripts/`は`tsconfig.json`の`exclude`に追加してNext.jsのビルド時型チェック対象から外している。`seed_questions.sql`は`wrangler d1 execute webtest-db --remote --file seed_questions.sql`でそのまま再投入可能な形で残してある。

**GET `/api/questions`**（`functions/api/questions.ts`）: `status='published'`の問題を`ORDER BY RANDOM()`でランダム取得する。`?category=`（複数指定でOR）・`?difficulty=`・`?limit=`（デフォルト10、最大50）に対応。DB行はクライアント向けに`Question`型（選択肢へA〜Eラベルを付与、`correct_answer`インデックスをラベルへ変換、`explanation`/`tables_json`をJSONパース、`category`フィールドには`sub_category`の値を返す）へ変換して返す。ユーザーの指定は`/api/test/questions`または`/api/questions`のいずれでもよいという柔軟な書き方だったため、既存の`functions/api/*.ts`のフラットな配置慣習に合わせて`/api/questions`を採用した。

**POST `/api/admin/questions`**（`functions/api/admin/questions.ts`）: 単発（1オブジェクト）または一括（`{questions: [...]}`配列）で新問題を追加できる。このアプリには管理者ログイン機構が無いため、`x-admin-token`ヘッダーと`ADMIN_API_TOKEN`（Pages Secret）の一致で簡易認証している。**トークン値はチャットに出力していない**。ローカルでは`.dev.vars`の`ADMIN_API_TOKEN`（`.gitignore`済み）、本番では`wrangler pages secret put ADMIN_API_TOKEN`で設定済みで、値は`.env.admin.local`（`.gitignore`の`.env*`パターンに一致、リポジトリには含まれない）にのみ保存してある。

**`/test`のリファクタ**（`app/test/page.tsx`）: `import { questions } from "@/src/data/questions"`の静的配列参照を廃止し、認証チェック後に`GET /api/questions`を叩いて取得する`useState<Question[] | null>`に変更した。取得中は「問題を読み込んでいます...」、0件時・通信エラー時はエラーメッセージを表示し、以降の問題選択・タイマー・採点・解説表示ロジックは既存のまま維持している。

## スカウト送信UI・送信履歴管理画面（2026-08-21追加）

企業側のスカウト送信は`src/components/ScoutSendModal.tsx`（モーダル）に集約した。件名（`title`）・本文（`message`）・簡易テンプレート選択（コンポーネント内`SCOUT_TEMPLATES`定数、「カジュアル面談のご案内」「特別選考ルートのご案内」等）を持ち、`/company/dashboard`の候補者カードから開く。`scouts`テーブルに`title TEXT NOT NULL DEFAULT ''`を追加した（本番D1へは別途`ALTER TABLE`が必要、`schema.sql`再実行だけでは反映されない）。POST `/api/company/scouts`は`title`・`message`をどちらも必須（空文字不可）に変更した。

送信済みスカウトの一覧・ステータス管理は新規ページ`/company/scouts`（`app/company/scouts/page.tsx`）に独立させた。以前は`/company/dashboard`に埋め込んでいたが、検索・送信画面と履歴管理画面の責務を分離するため移動した。`CompanyHeader`に「候補者検索」「送信履歴」のナビリンクを追加済み。ステータスバッジは「返信待ち」「承諾（実名開示済み）」「辞退」の表記（学生側`/mypage`の表記「未対応/承諾済み/辞退済み」とは別。企業向け画面の要求文言に合わせた）。ステータスでの絞り込みボタン、送信メッセージの開閉表示、`is_anonymous=0`時の氏名・メールアドレス開示切り替えを実装。**取得APIは新規に`GET /api/company/scouts`を使わず、既存の`GET /api/company/sent-scouts`をそのまま利用した**（`scouts.ts`のGETは候補者検索用に既に別の応答形状で使われているため、履歴取得と検索を同じエンドポイントに混在させると壊れるため分離を維持）。

電話番号によるPII開示は未実装（`users`テーブルに電話番号カラム自体が存在せず、登録フローでも収集していないため）。氏名・メールアドレスのみを2段階開示の対象としている。

## 学生側スカウト受信UIのブラッシュアップ（2026-08-21追加）

`scouts`テーブルに`is_read INTEGER NOT NULL DEFAULT 0`を追加した（本番D1へは別途`ALTER TABLE`が必要）。学生がスカウト詳細を開いた時点で既読にする。PUT `/api/scouts`の`action`に新たに`'read'`を追加し（既存の`'accept'|'decline'`と同じ本人確認モデルを流用）、`status`に関わらず（対応済みでも）`is_read=1`にできる冪等な操作にした。承諾・辞退時も同じUPDATE文で`is_read=1`を同時に設定する。**新規に`PUT /api/scouts/[id]/read`という別ルートは作らず、既存の`/api/scouts`のPUTアクションとして実装した**（学生側はセッションが無くメールアドレスをボディで渡す認証モデルのため、新しい動的ルートを増やすより既存エンドポイントの拡張の方が一貫性がある）。

UIは`src/components/ScoutDetailModal.tsx`（新規）に集約: カード一覧はクリックでこのモーダルを開き、未読なら開いた瞬間に既読PUTを発行する。モーダル内は「詳細表示 → 承諾確認 → 辞退確認」の3ビューを1つのモーダル内で切り替える構成（`view`ステート）。承諾確認ビューは「企業と連絡を取る準備はOKですか？」という前向きな文言＋開示される情報（氏名・メールアドレスのみ。電話番号は収集していないため文言から除外）を明示、辞退確認ビューは「辞退しても企業に失礼にならない」旨を明記している。タグ表示はメッセージ本文からのキーワード抽出（`deriveScoutTags()`、「特別選考」「面談確約」等の固定キーワードリストとの部分一致）による簡易実装で、志望業界とのマッチ度タグは実装していない（scoutsテーブルにどの検索条件でヒットしたかを保存していないため、正確なマッチ度を算出するデータが無い）。

未読件数バッジは`ScoutInbox`（`/dashboard`）の「届いたスカウト」見出し横（`新着N件`）と、`DashboardHeader`のロゴ（「SPIナビ」→`/dashboard`リンク、右上の丸バッジ）の両方に表示する。`DashboardHeader`はマウント時に`localStorage`の`spiUser`から`email`を読み、`/api/scouts`を叩いて`status==='sent' && !isRead`の件数を計算する（`/dashboard`・`/mypage`どちらのページでも自動的に効く）。**2026-08-21にスカウト受信ボックスを`/mypage`から`/dashboard`へ移したのに合わせ、バッジの表示先も「マイページ」リンク（現在の文言は「プロフィール」）からロゴ側へ変更した**（プロフィール画面はもうスカウトを表示しないため）。

## スカウトAPI

- `functions/api/scouts.ts`（学生向け・emailで本人確認）: GET `?email=`で自分宛のスカウト一覧（企業名・メッセージ・状態は常に見える。企業に自分の実名が開示されているかは`isAnonymous`で判定）。PUT `{email, scoutId, action:'accept'|'decline'}`で応答（`status='sent'`のものにしか作用しない）。
- `functions/api/company/login.ts`: 企業ログイン（email/password、PBKDF2検証）。`approved=false`でもログイン自体は成功させ、`/company/dashboard`側で「承認待ち」表示に留める（候補者検索・スカウト送信・履歴閲覧のAPI側で`approved`を強制する設計）。
- `functions/api/company/scouts.ts`（企業向け・`companyEmail`で本人確認、`approved=1`必須）: GET `?companyEmail=`で`scout_consent=1`の学生を匿名属性のみで一覧取得（氏名・メール等は一切含まない）。`universityCategory`/`facultyType`/`industry`（第一〜第三志望のいずれかに一致）/`minDeviation`のクエリパラメータでフィルタ可能。POST `{companyEmail, studentId, message?}`でスカウト送信（`status='sent'`の重複送信は409で拒否）。
- `functions/api/company/sent-scouts.ts`（企業向け・`approved=1`必須）: GET `?companyEmail=`で自社が送信した全スカウトを返す。`is_anonymous=0`（学生承諾済み）の行だけ`lastName`/`firstName`/`email`をSQLのCASE式で開示し、それ以外は`null`。
- `app/register/page.tsx`のスカウト同意チェックボックスは**デフォルトOFFを維持**（第三者提供の同意をデフォルトON・「登録により同意したとみなす」形にするのは個人情報保護法27条の同意要件・リクナビ事件の教訓に照らして避けた。ユーザーの明示的な判断でこの方針とした）。チェックボックス直下と`/terms#scout`に2段階開示の説明文を明記している。

**本番D1へは`schema.sql`の再実行だけでは`users.university_category`は追加されない**（`users`テーブルは既に存在するため`CREATE TABLE IF NOT EXISTS`がno-opになる）。追加するには一度だけ次を実行する必要がある: `wrangler d1 execute webtest-db --remote --command "ALTER TABLE users ADD COLUMN university_category TEXT"`。新規テーブル（`company_profiles`, `scouts`, `exam_results`, `questions`, `question_choices`）は`schema.sql`の再実行で作成される。**`exam_results`が既に本番に作成済みの場合、`accuracy_rate`/`category_scores_json`列も同様にALTER TABLEが必要**（`ALTER TABLE exam_results ADD COLUMN accuracy_rate REAL NOT NULL DEFAULT 0; ALTER TABLE exam_results ADD COLUMN category_scores_json TEXT;`）。

## 模試結果のD1保存（`functions/api/exam-results.ts`）

- POST: `{email, testType?, score, total, categoryScores?}`を受け取り、`users`をemailで引いて`exam_results`に保存する。`test_type`ごとに**その回より前の全受験者の正答率**を母集団として偏差値を算出する（サンプル2件未満または標準偏差0の場合は50固定）。過去の受験結果の偏差値は遡って再計算しない簡易実装。
- GET: `?email=`で受験履歴（最大20件、新しい順）・最新偏差値・最高正答率・受験回数・カテゴリ別内訳等を返す。`src/components/PerformanceDashboard.tsx`（`/dashboard`から描画）がこれを叩いて表示している（`/mypage`はプロフィール専用画面になったため2026-08-21にこの呼び出しを削除）。
- `app/test/page.tsx`は`src/data/questions.ts`の`Question.category`（分野）ごとに正誤を集計し、試験終了時に`categoryScores`として送信する。localStorageへの保存（`spiResult`/`spiResultHistory`）は従来通り維持しており、D1保存が失敗しても結果画面表示は継続する（fire-and-forgetでtry/catch）。

# 応答・進め方のルール

- ユーザーへの応答は常に日本語で行う。
- **トークン節約を最優先**する。目的達成に不要なファイル・コンポーネント・ドキュメントは作らない。
- 既存ファイルの編集で済む場合は新規ファイルを作らない（Edit優先、Write/新規作成は最小限に）。
- 変更後は `npx next build` で型エラー・ビルドエラーが無いことを確認してから完了報告する。`functions/` を変更した場合は `npx tsc --noEmit -p functions/tsconfig.json` も実行する。
- `/register` や `/login` などAPI呼び出しを伴う変更は、`npm run pages:dev` でローカルD1に対して実際に登録・ログインを試し、動作確認してから完了報告する（`next build`だけでは不十分）。

# アーキテクチャ制約（変更時は必ず守る）

- 外部データベース（Supabase等）は接続しない。データはCloudflare D1（`env.DB`）のみを使う。問題データは2026-08-21にD1の`questions`テーブルへ移行済み（「問題データのD1移行」の節を参照）。
- 状態管理はReactの `useState` / `useEffect` のみを使う。Redux・Zustand等の状態管理ライブラリは導入しない。
- ページ間でデータを引き継ぐ必要がある場合（例: `/test` → `/result` のスコア）は `localStorage` を使う。
- 過剰な装飾・アニメーション・抽象化は避け、MVPとして機能することを最優先する。

# TypeScript規約

- `src/data/questions.ts` の `Question` / `TableBlock` 型を正とし、`GET /api/questions` のレスポンス（およびクライアント側の型）はこの型に準拠させる。`category`（`sub_category`の値）は分野別成績集計（`exam_results.category_scores_json`）に使うため、新しい問題を追加する際は必ず設定する。
- 選択肢ラベルは `"A" | "B" | "C" | "D" | "E"` のUnion型で管理する（`string`型で緩めない）。D1の`options`はラベル無しのJSON配列で保持し、API側でインデックス順にA〜Eを付与する。
- `any` は使わない。表データ（`TableBlock.rows`）のセル値は `string | number` とする。
- 新しい問題を追加する際は `POST /api/admin/questions`（`x-admin-token`ヘッダー必須）を使う。手動でSQLを書く場合は既存の`id`と重複しないことをD1側で確認する（AUTOINCREMENTのため通常は自動で回避される）。

# Tailwind CSS規約

- `app/globals.css` の背景・文字色は固定のライトテーマ（`@media (prefers-color-scheme: dark)` は追加しない）。ダークモード対応の装飾を入れると文字色とのコントラストが崩れるため、色を追加する際は必ず実際の見た目（背景色×文字色のコントラスト）を確認する。
- ボタン・カードは `rounded-lg` / `rounded-full`、余白は `px-4 py-3` 程度の既存トーンに合わせる。
- 表（`<table>`）を追加する場合は横幅オーバーフロー対策として親要素に `overflow-x-auto` を付ける。

# ページ責務

- `app/page.tsx`: サーバーコンポーネントのまま維持（`"use client"` 不要、インタラクションはCSSの`hover:`だけで完結させている）。2026-08-21にCVR訴求型のLPへ刷新（さらに同日中に「主要Webテスト全網羅」訴求へ再刷新、下記「サービス名リブランディング」の節を参照）: sticky簡易ヘッダー→ヒーロー（キャッチコピー＋グラデーション大型CTA）→対応Webテスト網羅セクション（`src/data/testTypes.ts`の`TEST_TYPES`から対応状況バッジを算出）→完全無料・安心感バナー→3特徴カード（模試・復習機能・特別スカウト、`hover:-translate-y-1`でホバー浮き上がり）→利用の流れ4ステップ→ボトムCTA、の一枚構成。旧バージョンにあった`/test`への未ログインお試しリンクは、`/test`が認証必須化されて久しく実質的に無意味だったため削除した。
- `app/register/page.tsx`: クライアントコンポーネント。会員登録フォーム。`/api/register`にPOSTし、成功時は`spiUser`を保存して`/dashboard`へ遷移する。バリデーション・送信ロジックは2026-08-21のUI刷新でも変更していない（`src/components/AuthLayout.tsx`でラップし、`IconInput`でスタイルを差し替えただけ）。
- `app/login/page.tsx`: クライアントコンポーネント。ログインフォーム。`/api/login`にPOSTし、成功時は`spiUser`を保存して`/dashboard`へ遷移する。register同様、2026-08-21のUI刷新でロジックは変更していない。
- `app/dashboard/page.tsx`: クライアントコンポーネント。ログイン必須（`spiUser`が無ければ`/login`へリダイレクト）。ログイン後のトップページとして、試験種別選択（`TEST_TYPES`。カードクリックで`ExamModeSelectModal`を開く、直接`/test`へは遷移しない）・成績ダッシュボード（`PerformanceDashboard`）・スカウト受信ボックス（`ScoutInbox`）を1画面に統合している（2026-08-21に`/mypage`から成績・復習・スカウトの表示をこちらへ移動）。旧`localStorage`の`spiResultHistory`に基づく簡易履歴テーブルは、D1ベースの`PerformanceDashboard`に置き換える形で廃止した。
- `app/test/page.tsx`: クライアントコンポーネント（模擬試験＝本番モード）。1問60秒のタイマー、回答判定、解説表示、表データのレンダリングを担当。マウント時に`localStorage`の`spiUser`を確認し、無ければ`/login`へリダイレクトする（未ログイン時は何も描画しない）。認証確認後に`GET /api/questions`から問題セットを取得する（`src/data/questions.ts`の静的配列は2026-08-21に廃止、型定義のみ残存）。試験終了時に`spiResult`/`spiResultHistory`（localStorage）を更新しつつ、`/api/exam-results`にもPOSTしてD1へ保存する（失敗しても結果画面表示は継続）。
- `app/practice/page.tsx`: クライアントコンポーネント（練習問題＝トレーニングモード）。`/test`と同じ出題・即時採点・解説表示ロジックだが、カウントダウンではなく経過時間のカウントアップ、終了後は`/result`に遷移せず画面内完了サマリー、`spiResult`/`spiResultHistory`は更新しない、という違いがある。`POST /api/exam-results`には`isPractice: true`を付けて送信し、偏差値・受検回数には反映されないが復習キューへの登録だけは行われる。
- `app/result/page.tsx`: クライアントコンポーネント。`localStorage` の `spiResult` を読み、スコアと評価コメント、収益化バナー枠、`/dashboard`への導線を表示。
- `app/forgot-password/page.tsx`: クライアントコンポーネント。メール送信→OTP入力＋新パスワード設定の2ステップ。`/api/forgot-password`と`/api/reset-password`を呼ぶ。
- `app/mypage/page.tsx`（画面タイトル「プロフィール設定」、ヘッダーのリンク文言は「プロフィール」、URLは既存の`/mypage`のまま）: 個人属性情報（氏名・大学・学部・志望業界・希望職種・卒業年月）専用の管理画面。2026-08-21に成績ダッシュボード・スカウト受信ボックスを`/dashboard`へ移動し、このページからは削除した（スカウト目的でのデータ共有トグルのみ、個人の同意設定としてこのページに残している）。**閲覧/編集の2モード制**（`mode: "view" | "edit"`）: 初期表示は`<dl>`によるテキスト閲覧のみで、「プロフィールを編集」ボタンで編集フォームに切り替わる。編集フォーム内の「編集をキャンセル」は`savedProfile`（最後にサーバーから取得/保存した値のスナップショット）から`applyProfile()`で各フィールドを復元してから閲覧モードへ戻す。「変更を保存」で`PUT /api/me`を呼び、成功時はローカルの`savedProfile`も更新したうえで閲覧モードへ自動的に戻る。ユーザー要求では更新APIとして`/api/user/profile`が例示されていたが、既存の`/api/me`（GET/PUT）がまったく同じ機能を持つため、新規エンドポイントは作らずそのまま使っている。
- `app/review/page.tsx`: エビングハウスの忘却曲線に基づく反復復習モード。`GET /api/review`で当日分を取得し、1問1答形式で出題・`POST /api/review`で結果を即時送信する。
- `app/terms/page.tsx` / `app/privacy/page.tsx`: 利用規約・プライバシーポリシーの下書き（要弁護士レビュー）。
- `app/company/login/page.tsx`: 企業ログインフォーム。成功時は`localStorage`の`spiCompanyUser`（`companyName`/`email`/`approved`）を保存して`/company/dashboard`へ遷移する。未登録者向けに`/company/apply`への導線を表示する。
- `app/company/apply/page.tsx`: 企業・エージェント向けの公開利用審査申請フォーム。`POST /api/company/apply`を呼ぶだけで、ログイン等の状態は持たない。
- `app/admin/companies/page.tsx`: 管理者用の審査申請一覧・承認/却下画面。`sessionStorage`の管理APIトークンで`GET/POST /api/admin/companies`を叩く（詳細は「企業・エージェント向け利用審査申請フロー」の節を参照）。
- `app/company/dashboard/page.tsx`: 企業向けダッシュボード。ログイン必須（`spiCompanyUser`が無ければ`/company/login`へリダイレクト）。`approved=false`の場合は承認待ち表示のみ。承認済みなら大学区分・文理・志望業界・希望職種・偏差値下限でのフィルタ検索（`/api/company/scouts`のGET）を行い、候補者カードの「スカウトを送信する」ボタンから`ScoutSendModal`を開いて送信する（POSTも同エンドポイント）。
- `app/company/scouts/page.tsx`: 送信済みスカウトの履歴・ステータス管理画面（`/api/company/sent-scouts`のGETを利用）。ステータス絞り込み・メッセージ確認・承諾済みスカウトの実名開示表示を行う。
- `functions/api/*.ts`: Cloudflare Pages Functions。D1（`env.DB`）へのユーザー登録・認証・プロフィール取得更新（`me.ts`）・パスワード再設定（`forgot-password.ts`, `reset-password.ts`）・スカウト同意更新（`consent.ts`）・模試結果の保存/取得（`exam-results.ts`）・スカウト応答（`scouts.ts`）を担当。`functions/api/company/*.ts`は企業向け（ログイン・候補者検索・スカウト送信・送信済み一覧）。パスワードもOTPも`functions/_lib/password.ts`のPBKDF2でハッシュ化。登録・ログインとも成功時は`name`（姓名結合済み）を返す。

## 希望職種（`src/data/formOptions.ts`の`DESIRED_OCCUPATIONS`）

2026-08-21に追加。9つの固定選択肢（営業・顧客交渉／企画・マーケティング・事業開発／IT・エンジニア・Web制作／研究・開発・技術職／コンサルタント・アナリスト／コーポレート・管理部門／クリエイティブ・編集・デザイン／サービス・店舗運営・各種専門職／こだわりなし・幅広く検討したい）から**最大3つまで**選択させる仕様。`users.desired_occupations`にJSON文字列配列として保存する（`category_scores_json`等と同じJSON-in-TEXTパターン）。バリデーションは`functions/_lib/desiredOccupations.ts`の`parseDesiredOccupations()`（配列・1〜3件・マスタ一覧に含まれる値のみ・重複無しを検証し、不正なら`null`を返す）に集約し、`register.ts`・`me.ts`のPUT双方から呼ぶ。**マスタ一覧は`functions/_lib/desiredOccupations.ts`と`src/data/formOptions.ts`に別々に定義してあり、選択肢を増減する際は両方を修正すること**（`functions/*.ts`から`src/data/*`を相対importしている既存例もあるため、本来は一本化できたが今回は独立させたまま実装した）。

フロント側は`src/components/LimitedCheckboxGroup.tsx`（チェックボックス、`max`件を超えて選択しようとすると赤字で警告を出し選択自体をブロックする）を`/register`・`/mypage`の両方で使用。企業側`/company/dashboard`の検索フィルタは既存の汎用`CheckboxGroup`（件数上限なし、OR条件）を流用し、`functions/api/company/scouts.ts`のGETに`desiredOccupation`パラメータ（複数指定可、OR条件）を追加した。`desired_occupations`はJSON配列カラムのため`IN`句が使えず、選択値ごとに`u.desired_occupations LIKE '%"<値>"%'`をOR結合する方式にした（値に`"`を含む選択肢が無い前提）。候補者カード・送信済みスカウト一覧（`functions/api/company/sent-scouts.ts`）双方の匿名プロフィールにも希望職種をタグ表示する。

エンドポイントは新規作成せず、既存の`/api/me`（学生プロフィール取得・更新）・`/api/company/scouts`（候補者検索・スカウト送信）を拡張する方針にした（ユーザー指示で「等」「や」と柔軟に書かれていたため、ロジック重複を避ける既存パターン踏襲を優先）。

## 志望業界の分類（`src/data/formOptions.ts`）

学生が選びやすく・企業とのマッチング率を上げるため、2026-08-20に**10グループ・計43業種（`INDUSTRY_GROUPS`）から大分類10種類のフラットな配列（`INDUSTRIES`）に変更**した。`IndustrySelect`は単純な`<select>`に、企業ダッシュボードのフィルタも汎用`CheckboxGroup`に統一されている。**この変更前に登録された既存ユーザーの`industry_first/second/third`には旧分類の値が残る**（マイページの`<select>`ではどの選択肢にも一致せず空欄表示になる）。汎用の自動移行スクリプトは書いていない（変更時点で本番の実ユーザーは1件のみだったため、そのレコードだけ手動で新分類に更新した）。旧→新のおおまかな対応は: コンサル系→「コンサル・シンクタンク」、金融系（外資/日系問わず）→「金融（銀行・証券・保険・投資）」、メーカー系→「メーカー（自動車・食品・化学・製薬等）」、商社→「商社（総合・専門）」、IT・通信系→「IT・通信・Web」、マスコミ・広告系→「マスコミ・広告・出版」、不動産・建設系→「不動産・建設・デベロッパー」、公的機関→「公的機関・公務員」、それ以外のサービス系（運輸・エネルギー・人材・旅行・小売等）→「サービス・インフラ（運輸・エネルギー・人材・旅行等）」。
