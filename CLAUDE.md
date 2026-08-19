@AGENTS.md

# プロジェクト概要

「本を買わない就活生向けのSPI WEB模試アプリ」。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。
画面は `/`（トップ）、`/register`（会員登録）、`/login`（ログイン）、`/dashboard`（ログイン後のホーム、ログイン必須）、`/test`（試験実行、ログイン必須）、`/result`（結果表示）。
登録・ログインに成功すると`localStorage`の`spiUser`にセットし、そのまま`/dashboard`へ遷移する（別途ログインを挟まない）。

## 開発サーバーに関する重要な注意

`npm run dev`（`next dev`）は **`functions/` 配下のAPI（`/api/register`, `/api/login`等）を配信しない**。フロントエンドのUI・レイアウト確認だけなら`next dev`で十分だが、会員登録・ログインなど`fetch("/api/...")`を伴う動作確認をする場合は必ず **`npm run pages:dev`**（`next build && wrangler pages dev out`）を使うこと。これを守らないと`/api/register`が404になり、フロント側では「通信エラー」という紛らわしいメッセージになる（実際にこの不具合が一度発生している）。

## メール送信（パスワード再設定）に関する前提

`functions/api/forgot-password.ts`は`env.EMAIL.send()`（Cloudflare Email Sending の`send_email`バインディング）でOTPメールを送る設計だが、**`send_email`はCloudflare Pagesプロジェクトの設定検証で現状拒否される**（`wrangler pages deploy`が「Configuration file for Pages projects does not support "send_email"」で失敗した実例あり）ため、`wrangler.jsonc`からは`send_email`を削除済み。そのため現状`context.env.EMAIL`はバインドされておらず、メール送信はtry/catchで握りつぶされて常に失敗する（OTP自体はD1に正しく保存されるためAPI応答自体は成功する）。実際にメールを送るには、Workersバインディングではなく**REST API**（APIトークンをPages Secretとして設定し`fetch`で呼ぶ方式）に書き換える必要がある。動作確認時にOTPの値を見たい場合は`forgot-password.ts`に一時的に`console.log`を仕込み、`wrangler pages dev`のログで確認してからコミット前に必ず削除すること（実際にこの手順で検証済み）。

## スカウト（第三者提供）機能の同意設計に関する重要な注意

将来的に学生の成績・個人情報を提携企業（就活エージェント等）へスカウト目的で提供し、その対価を収益源とする計画がある。個人情報保護法上、第三者提供には本人の明確な同意が必須であり、リクナビ内定辞退率問題（2019年）を直接の教訓として、以下の設計方針を必ず守ること。

- 「利用規約・プライバシーポリシーへの同意」（`agreedTerms`、必須）と「スカウト目的での第三者提供への同意」（`scoutConsent`、任意・デフォルトOFF）は**チェックボックスを分離**し、後者を本サービス利用の必須条件にしない。
- スカウト同意は`/mypage`からいつでも撤回できるようにする（`functions/api/consent.ts`）。
- 同意・撤回は`consent_events`テーブルに履歴として記録する（個人情報保護法29条の第三者提供記録の裏付けとして）。
- `app/terms/page.tsx`・`app/privacy/page.tsx`は弁護士レビュー前提の下書き。実際に第三者提供を開始する前に、文面と事業モデル（職業紹介事業許可の要否を含む）について弁護士のレビューを必ず受けること。

## スカウト機能・問題DBのスキーマ（schema.sql、API未実装）

`schema.sql`に以下を追加済み。**API・フロントエンドはまだ実装していない**（スキーマ定義のみ）。

- `company_profiles`: 企業アカウント。職業安定法上「募集情報等提供事業」として運営する前提（`provider_business_type`）。なりすまし対策として`approved`が1になるまで候補者閲覧・スカウト送信はさせない設計にすること。
- `scouts`: スカウト本体。**2段階開示フラグ`is_anonymous`**が要。企業は`users.scout_consent = 1`の学生の匿名属性（`university_category` / `faculty_type` / `industry_first`〜`third` / `exam_results.deviation_score`）のみを見て匿名スカウトを送る。学生が`status='accepted'`で承諾したときに限り`is_anonymous`を0にし、そのスカウトについてのみ氏名・メールを開示する。運営側で手動マッチングや推薦は行わない（システムが状態遷移を処理するのみ）。
- `exam_results`: 模試結果のサーバー側記録。**書き込み・読み取りAPIは実装済み**（`functions/api/exam-results.ts`、下記参照）。
- `users.university_category`: 匿名開示用の大学区分（大学名そのものは開示しない）。カテゴリのマッピングロジックは未実装。
- `questions` / `question_choices`: D1ベースの問題バンク（分野・難易度・オリジナリティメモ・レビューステータス付き）。**現状`/test`は`src/data/questions.ts`のTS配列を使い続けており、このテーブルへの移行・読み込みAPIはまだ実装していない**。`originality_note`は市販本の文章を書き写さず、解法アイデアの要約のみを記録する運用にすること。

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
- `app/mypage/page.tsx`: プロフィール編集・スカウト同意トグル（`/api/consent`）に加え、`/api/exam-results`から取得した成績サマリーを表示する。
- `app/terms/page.tsx` / `app/privacy/page.tsx`: 利用規約・プライバシーポリシーの下書き（要弁護士レビュー）。
- `functions/api/*.ts`: Cloudflare Pages Functions。D1（`env.DB`）へのユーザー登録・認証・プロフィール取得更新（`me.ts`）・パスワード再設定（`forgot-password.ts`, `reset-password.ts`）・スカウト同意更新（`consent.ts`）・模試結果の保存/取得（`exam-results.ts`）を担当。パスワードもOTPも`functions/_lib/password.ts`のPBKDF2でハッシュ化。登録・ログインとも成功時は`name`（姓名結合済み）を返す。
