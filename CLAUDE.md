@AGENTS.md

# プロジェクト概要

「本を買わない就活生向けのSPI WEB模試アプリ」。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。
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
- `questions` / `question_choices`: D1ベースの問題バンク（分野・難易度・オリジナリティメモ・レビューステータス付き）。**現状`/test`は`src/data/questions.ts`のTS配列を使い続けており、このテーブルへの移行・読み込みAPIはまだ実装していない**。`originality_note`は市販本の文章を書き写さず、解法アイデアの要約のみを記録する運用にすること。

## スカウトAPI

- `functions/api/scouts.ts`（学生向け・emailで本人確認）: GET `?email=`で自分宛のスカウト一覧（企業名・メッセージ・状態は常に見える。企業に自分の実名が開示されているかは`isAnonymous`で判定）。PUT `{email, scoutId, action:'accept'|'decline'}`で応答（`status='sent'`のものにしか作用しない）。
- `functions/api/company/login.ts`: 企業ログイン（email/password、PBKDF2検証）。`approved=false`でもログイン自体は成功させ、`/company/dashboard`側で「承認待ち」表示に留める（候補者検索・スカウト送信・履歴閲覧のAPI側で`approved`を強制する設計）。
- `functions/api/company/scouts.ts`（企業向け・`companyEmail`で本人確認、`approved=1`必須）: GET `?companyEmail=`で`scout_consent=1`の学生を匿名属性のみで一覧取得（氏名・メール等は一切含まない）。`universityCategory`/`facultyType`/`industry`（第一〜第三志望のいずれかに一致）/`minDeviation`のクエリパラメータでフィルタ可能。POST `{companyEmail, studentId, message?}`でスカウト送信（`status='sent'`の重複送信は409で拒否）。
- `functions/api/company/sent-scouts.ts`（企業向け・`approved=1`必須）: GET `?companyEmail=`で自社が送信した全スカウトを返す。`is_anonymous=0`（学生承諾済み）の行だけ`lastName`/`firstName`/`email`をSQLのCASE式で開示し、それ以外は`null`。
- `app/register/page.tsx`のスカウト同意チェックボックスは**デフォルトOFFを維持**（第三者提供の同意をデフォルトON・「登録により同意したとみなす」形にするのは個人情報保護法27条の同意要件・リクナビ事件の教訓に照らして避けた。ユーザーの明示的な判断でこの方針とした）。チェックボックス直下と`/terms#scout`に2段階開示の説明文を明記している。

**本番D1へは`schema.sql`の再実行だけでは`users.university_category`は追加されない**（`users`テーブルは既に存在するため`CREATE TABLE IF NOT EXISTS`がno-opになる）。追加するには一度だけ次を実行する必要がある: `wrangler d1 execute webtest-db --remote --command "ALTER TABLE users ADD COLUMN university_category TEXT"`。新規テーブル（`company_profiles`, `scouts`, `exam_results`, `questions`, `question_choices`）は`schema.sql`の再実行で作成される。**`exam_results`が既に本番に作成済みの場合、`accuracy_rate`/`category_scores_json`列も同様にALTER TABLEが必要**（`ALTER TABLE exam_results ADD COLUMN accuracy_rate REAL NOT NULL DEFAULT 0; ALTER TABLE exam_results ADD COLUMN category_scores_json TEXT;`）。

## 模試結果のD1保存（`functions/api/exam-results.ts`）

- POST: `{email, testType?, score, total, categoryScores?}`を受け取り、`users`をemailで引いて`exam_results`に保存する。`test_type`ごとに**その回より前の全受験者の正答率**を母集団として偏差値を算出する（サンプル2件未満または標準偏差0の場合は50固定）。過去の受験結果の偏差値は遡って再計算しない簡易実装。
- GET: `?email=`で受験履歴（最大20件、新しい順）・最新偏差値・最高正答率・受験回数を返す。`app/dashboard/page.tsx`と`app/mypage/page.tsx`の両方がこれを叩いて表示している。
- `app/test/page.tsx`は`src/data/questions.ts`の`Question.category`（分野）ごとに正誤を集計し、試験終了時に`categoryScores`として送信する。localStorageへの保存（`spiResult`/`spiResultHistory`）は従来通り維持しており、D1保存が失敗しても結果画面表示は継続する（fire-and-forgetでtry/catch）。

# 応答・進め方のルール

- ユーザーへの応答は常に日本語で行う。
- **トークン節約を最優先**する。目的達成に不要なファイル・コンポーネント・ドキュメントは作らない。
- 既存ファイルの編集で済む場合は新規ファイルを作らない（Edit優先、Write/新規作成は最小限に）。
- 変更後は `npx next build` で型エラー・ビルドエラーが無いことを確認してから完了報告する。`functions/` を変更した場合は `npx tsc --noEmit -p functions/tsconfig.json` も実行する。
- `/register` や `/login` などAPI呼び出しを伴う変更は、`npm run pages:dev` でローカルD1に対して実際に登録・ログインを試し、動作確認してから完了報告する（`next build`だけでは不十分）。

# アーキテクチャ制約（変更時は必ず守る）

- 外部データベース（Supabase等）は接続しない。問題データは `src/data/questions.ts` にTypeScript配列として直書きする。
- 状態管理はReactの `useState` / `useEffect` のみを使う。Redux・Zustand等の状態管理ライブラリは導入しない。
- ページ間でデータを引き継ぐ必要がある場合（例: `/test` → `/result` のスコア）は `localStorage` を使う。
- 過剰な装飾・アニメーション・抽象化は避け、MVPとして機能することを最優先する。

# TypeScript規約

- `src/data/questions.ts` の `Question` / `TableBlock` 型を正とし、問題データはこの型に準拠させる。`category`は分野別成績集計（`exam_results.category_scores_json`）に使うため、新しい問題を追加する際は必ず設定する。
- 選択肢ラベルは `"A" | "B" | "C" | "D" | "E"` のUnion型で管理する（`string`型で緩めない）。
- `any` は使わない。表データ（`TableBlock.rows`）のセル値は `string | number` とする。
- 新しい問題データを追加する際は、既存の `id` と重複しないようにする（現在 id 1〜5 まで使用済み）。

# Tailwind CSS規約

- `app/globals.css` の背景・文字色は固定のライトテーマ（`@media (prefers-color-scheme: dark)` は追加しない）。ダークモード対応の装飾を入れると文字色とのコントラストが崩れるため、色を追加する際は必ず実際の見た目（背景色×文字色のコントラスト）を確認する。
- ボタン・カードは `rounded-lg` / `rounded-full`、余白は `px-4 py-3` 程度の既存トーンに合わせる。
- 表（`<table>`）を追加する場合は横幅オーバーフロー対策として親要素に `overflow-x-auto` を付ける。

# ページ責務

- `app/page.tsx`: サーバーコンポーネントのまま維持（`"use client"` 不要）。キャッチコピーと「新規登録」「ログイン」への導線。
- `app/register/page.tsx`: クライアントコンポーネント。会員登録フォーム。`/api/register`にPOSTし、成功時は`spiUser`を保存して`/dashboard`へ遷移する。
- `app/login/page.tsx`: クライアントコンポーネント。ログインフォーム。`/api/login`にPOSTし、成功時は`spiUser`を保存して`/dashboard`へ遷移する。
- `app/dashboard/page.tsx`: クライアントコンポーネント。ログイン必須（`spiUser`が無ければ`/login`へリダイレクト）。`/test`への導線、`/api/exam-results`から取得した成績サマリー（最新偏差値・最高正答率・受験回数）、`localStorage`の`spiResultHistory`（過去の受験結果、最大20件）を表示する。
- `app/test/page.tsx`: クライアントコンポーネント。1問60秒のタイマー、回答判定、解説表示、表データのレンダリングを担当。マウント時に`localStorage`の`spiUser`を確認し、無ければ`/login`へリダイレクトする（未ログイン時は何も描画しない）。試験終了時に`spiResult`/`spiResultHistory`（localStorage）を更新しつつ、`/api/exam-results`にもPOSTしてD1へ保存する（失敗しても結果画面表示は継続）。
- `app/result/page.tsx`: クライアントコンポーネント。`localStorage` の `spiResult` を読み、スコアと評価コメント、収益化バナー枠、`/dashboard`への導線を表示。
- `app/forgot-password/page.tsx`: クライアントコンポーネント。メール送信→OTP入力＋新パスワード設定の2ステップ。`/api/forgot-password`と`/api/reset-password`を呼ぶ。
- `app/mypage/page.tsx`: プロフィール編集・スカウト同意トグル（`/api/consent`）・成績サマリー（`/api/exam-results`）に加え、`/api/scouts`から取得した「届いたスカウト」一覧と承諾/辞退ボタンを表示する。
- `app/terms/page.tsx` / `app/privacy/page.tsx`: 利用規約・プライバシーポリシーの下書き（要弁護士レビュー）。
- `app/company/login/page.tsx`: 企業ログインフォーム。成功時は`localStorage`の`spiCompanyUser`（`companyName`/`email`/`approved`）を保存して`/company/dashboard`へ遷移する。
- `app/company/dashboard/page.tsx`: 企業向けダッシュボード。ログイン必須（`spiCompanyUser`が無ければ`/company/login`へリダイレクト）。`approved=false`の場合は承認待ち表示のみ。承認済みなら大学区分・文理・志望業界・偏差値下限でのフィルタ検索（`/api/company/scouts`）、候補者ごとのメッセージ付きスカウト送信、送信済みスカウトの状態・開示情報一覧（`/api/company/sent-scouts`）を表示する。
- `functions/api/*.ts`: Cloudflare Pages Functions。D1（`env.DB`）へのユーザー登録・認証・プロフィール取得更新（`me.ts`）・パスワード再設定（`forgot-password.ts`, `reset-password.ts`）・スカウト同意更新（`consent.ts`）・模試結果の保存/取得（`exam-results.ts`）・スカウト応答（`scouts.ts`）を担当。`functions/api/company/*.ts`は企業向け（ログイン・候補者検索・スカウト送信・送信済み一覧）。パスワードもOTPも`functions/_lib/password.ts`のPBKDF2でハッシュ化。登録・ログインとも成功時は`name`（姓名結合済み）を返す。

## 希望職種（`src/data/formOptions.ts`の`DESIRED_OCCUPATIONS`）

2026-08-21に追加。9つの固定選択肢（営業・顧客交渉／企画・マーケティング・事業開発／IT・エンジニア・Web制作／研究・開発・技術職／コンサルタント・アナリスト／コーポレート・管理部門／クリエイティブ・編集・デザイン／サービス・店舗運営・各種専門職／こだわりなし・幅広く検討したい）から**最大3つまで**選択させる仕様。`users.desired_occupations`にJSON文字列配列として保存する（`category_scores_json`等と同じJSON-in-TEXTパターン）。バリデーションは`functions/_lib/desiredOccupations.ts`の`parseDesiredOccupations()`（配列・1〜3件・マスタ一覧に含まれる値のみ・重複無しを検証し、不正なら`null`を返す）に集約し、`register.ts`・`me.ts`のPUT双方から呼ぶ。**マスタ一覧は`functions/_lib/desiredOccupations.ts`と`src/data/formOptions.ts`に別々に定義してあり、選択肢を増減する際は両方を修正すること**（`functions/*.ts`から`src/data/*`を相対importしている既存例もあるため、本来は一本化できたが今回は独立させたまま実装した）。

フロント側は`src/components/LimitedCheckboxGroup.tsx`（チェックボックス、`max`件を超えて選択しようとすると赤字で警告を出し選択自体をブロックする）を`/register`・`/mypage`の両方で使用。企業側`/company/dashboard`の検索フィルタは既存の汎用`CheckboxGroup`（件数上限なし、OR条件）を流用し、`functions/api/company/scouts.ts`のGETに`desiredOccupation`パラメータ（複数指定可、OR条件）を追加した。`desired_occupations`はJSON配列カラムのため`IN`句が使えず、選択値ごとに`u.desired_occupations LIKE '%"<値>"%'`をOR結合する方式にした（値に`"`を含む選択肢が無い前提）。候補者カード・送信済みスカウト一覧（`functions/api/company/sent-scouts.ts`）双方の匿名プロフィールにも希望職種をタグ表示する。

エンドポイントは新規作成せず、既存の`/api/me`（学生プロフィール取得・更新）・`/api/company/scouts`（候補者検索・スカウト送信）を拡張する方針にした（ユーザー指示で「等」「や」と柔軟に書かれていたため、ロジック重複を避ける既存パターン踏襲を優先）。

## 志望業界の分類（`src/data/formOptions.ts`）

学生が選びやすく・企業とのマッチング率を上げるため、2026-08-20に**10グループ・計43業種（`INDUSTRY_GROUPS`）から大分類10種類のフラットな配列（`INDUSTRIES`）に変更**した。`IndustrySelect`は単純な`<select>`に、企業ダッシュボードのフィルタも汎用`CheckboxGroup`に統一されている。**この変更前に登録された既存ユーザーの`industry_first/second/third`には旧分類の値が残る**（マイページの`<select>`ではどの選択肢にも一致せず空欄表示になる）。汎用の自動移行スクリプトは書いていない（変更時点で本番の実ユーザーは1件のみだったため、そのレコードだけ手動で新分類に更新した）。旧→新のおおまかな対応は: コンサル系→「コンサル・シンクタンク」、金融系（外資/日系問わず）→「金融（銀行・証券・保険・投資）」、メーカー系→「メーカー（自動車・食品・化学・製薬等）」、商社→「商社（総合・専門）」、IT・通信系→「IT・通信・Web」、マスコミ・広告系→「マスコミ・広告・出版」、不動産・建設系→「不動産・建設・デベロッパー」、公的機関→「公的機関・公務員」、それ以外のサービス系（運輸・エネルギー・人材・旅行・小売等）→「サービス・インフラ（運輸・エネルギー・人材・旅行等）」。
