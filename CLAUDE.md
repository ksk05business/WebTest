@AGENTS.md

# プロジェクト概要

サービス名「Webテストナビ」。「本を買わない就活生向けのWebテスト模試アプリ」。SPI3のほか玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOAにも対応する想定。実際に受験できる（`questions`テーブルにデータがあり`/test`で出題される）のは**SPI（3パート）とSCOA（言語分野のみ）**で、他（玉手箱・TG-WEB・GAB/C-GAB・CAB）は`src/data/testTypes.ts`の`TEST_TYPES`で`available: false`（練習問題のみ、または準備中）としてLP・ダッシュボードに掲載している。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。

画面は `/`（トップ）、`/register`（会員登録）、`/login`（ログイン）、`/dashboard`（ログイン後のホーム、ログイン必須）、`/test`（試験実行、ログイン必須）、`/result`（結果表示）。登録・ログインに成功すると`localStorage`の`spiUser`にセットし、そのまま`/dashboard`へ遷移する（別途ログインを挟まない）。

企業向けには`/company/apply`（利用審査申請）→承認後`/company/login`→`/company/dashboard`（候補者検索・スカウト送信）があり、学生の成績・属性をもとにした「スカウト」機能（匿名2段階開示）が収益源の中心。

# 詳細情報は関連skillを参照

このファイルはプロジェクトの根幹（常に必要な規約）のみを載せている。特定の機能領域を触るときは、着手前に該当skillを読むこと（過去の設計判断の経緯・DBスキーマの詳細・実際に起きた障害の教訓が書かれている）。

| 触る機能 | 読むskill |
|---|---|
| D1の`questions`テーブル、問題の追加・投入、category/sub_category命名、長文のグループ出題、画像問題 | `question-bank` |
| ログイン・セッション認証・本人確認・管理者トークン | `auth-sessions` |
| スカウト機能（学生↔企業のマッチング）、個人情報の第三者提供同意 | `scout-system` |
| 企業アカウント（申請・承認・プロフィール・トークン課金・見積作成）、運営用管理画面 | `company-platform` |
| 練習問題/模試モードのUI、単元選択、忘却曲線復習・誤答復習 | `practice-review-modes` |
| 会員登録フォーム、大学名・希望職種・志望業界の選択肢とマッピング | `student-registration` |
| D1スキーマ変更・本番マイグレーション、Pages Functionsのルーティング、メール送信設定 | `cloudflare-pages-gotchas` |
| SEOブログ（/blog）記事の新規作成・編集、MDXカスタムコンポーネント追加 | `seo-blog-authoring` |
| SNSショート動画（TikTok/Shorts/Reels）の構成・台本作成 | `generate-short-script` |

# 応答・進め方のルール

- ユーザーへの応答は常に日本語で行う。
- **トークン節約を最優先**する。目的達成に不要なファイル・コンポーネント・ドキュメントは作らない。
- 既存ファイルの編集で済む場合は新規ファイルを作らない（Edit優先、Write/新規作成は最小限に）。
- 変更後は `npx next build` で型エラー・ビルドエラーが無いことを確認してから完了報告する。`functions/` を変更した場合は `npx tsc --noEmit -p functions/tsconfig.json` も実行する。ローカルでのこの確認は省略しない（下記CIはpush後の保険であり、事前確認の代わりにはしない）。
- `/register` や `/login` などAPI呼び出しを伴う変更は、`npm run pages:dev` でローカルD1に対して実際に登録・ログインを試し、動作確認してから完了報告する（`next build`だけでは不十分。理由は`cloudflare-pages-gotchas`スキル参照）。
- `.github/workflows/ci.yml`でGitHub Actions CIを実行している（push/pull_request時、`tsc --noEmit`×2・`next build`・lintは既存の指摘が多いため`continue-on-error`で非ブロッキング）。CIはpush後にコミットのステータスとして結果が残るだけで、マージやデプロイを止める仕組みではない（Cloudflare Pagesの自動デプロイとは独立）。

# アーキテクチャ制約（変更時は必ず守る）

- 外部データベース（Supabase等）は接続しない。データはCloudflare D1（`env.DB`）のみを使う。問題データの構造・投入方法は`question-bank`スキルを参照。
- 状態管理はReactの `useState` / `useEffect` のみを使う。Redux・Zustand等の状態管理ライブラリは導入しない。
- ページ間でデータを引き継ぐ必要がある場合（例: `/test` → `/result` のスコア）は `localStorage` を使う。
- 過剰な装飾・アニメーション・抽象化は避け、MVPとして機能することを最優先する。
- `wrangler.jsonc`の`name`、Cloudflare Pagesのプロジェクト名、`localStorage`のキー名（`spiUser`/`spiCompanyUser`）はユーザーに見えない内部識別子のため変更しない（詳細は`cloudflare-pages-gotchas`スキル）。

# TypeScript規約

- `src/data/questions.ts` の `Question` / `TableBlock` 型を正とし、`GET /api/questions` のレスポンス（およびクライアント側の型）はこの型に準拠させる。
- 選択肢ラベルは `"A" | "B" | "C" | "D" | "E"` のUnion型で管理する（`string`型で緩めない）。D1の`options`はラベル無しのJSON配列で保持し、API側でインデックス順にA〜Eを付与する。
- `any` は使わない。表データ（`TableBlock.rows`）のセル値は `string | number` とする。
- 新しい問題を追加する際は `POST /api/admin/questions`（`x-admin-token`ヘッダー必須）を使う。詳細な投入フローは`question-bank`スキルを参照。

# Tailwind CSS規約

- `app/globals.css` の背景・文字色は固定のライトテーマ（`@media (prefers-color-scheme: dark)` は追加しない）。ダークモード対応の装飾を入れると文字色とのコントラストが崩れるため、色を追加する際は必ず実際の見た目（背景色×文字色のコントラスト）を確認する。
- ボタン・カードは `rounded-lg` / `rounded-full`、余白は `px-4 py-3` 程度の既存トーンに合わせる。
- 表（`<table>`）を追加する場合は横幅オーバーフロー対策として親要素に `overflow-x-auto` を付ける。

# ページ責務

- `app/page.tsx`: サーバーコンポーネント（`"use client"` 不要）。LP。sticky簡易ヘッダー→ヒーロー→対応Webテスト網羅セクション（`TEST_TYPES`から算出）→完全無料バナー→3特徴カード→利用の流れ→ボトムCTA。
- `app/register/page.tsx` / `app/login/page.tsx`: クライアントコンポーネント。`/api/register` / `/api/login`にPOSTし、成功時は`spiUser`を保存して`/dashboard`へ遷移する。フォーム詳細は`student-registration`スキル参照。
- `app/dashboard/page.tsx`: クライアントコンポーネント。ログイン必須。試験種別選択（カードクリックで`ExamModeSelectModal`）・成績ダッシュボード（`PerformanceDashboard`）・スカウト受信ボックス（`ScoutInbox`）を1画面に統合。
- `app/test/page.tsx`: クライアントコンポーネント（模擬試験＝本番モード）。ログイン必須。`GET /api/questions`から取得、1問60秒タイマー、終了時`spiResult`（localStorage）更新＋`/api/exam-results`へPOST。
- `app/practice/page.tsx`: クライアントコンポーネント（練習問題＝トレーニングモード）。`/test`と出題ロジックは共有するが、カウントアップ・画面内完了サマリー・localStorage不更新という違いがある。詳細は`practice-review-modes`スキル参照。
- `app/result/page.tsx`: クライアントコンポーネント。`localStorage`の`spiResult`を読み、スコア・評価コメント・`/dashboard`への導線を表示。
- `app/forgot-password/page.tsx`: メール送信→OTP入力→新パスワード設定の2ステップ。メール送信の制約は`cloudflare-pages-gotchas`スキル参照。
- `app/mypage/page.tsx`（画面タイトル「プロフィール設定」）: 個人属性情報（氏名・大学・学部・志望業界・希望職種・卒業年月）専用の管理画面。閲覧/編集2モード制。`GET/PUT /api/me`を使用。
- `app/review/page.tsx`: エビングハウスの忘却曲線に基づく反復復習モード。詳細は`practice-review-modes`スキル参照。
- `app/terms/page.tsx` / `app/privacy/page.tsx`: 利用規約・プライバシーポリシー（弁護士レビュー済みの正式版。運営者は福井敬介）。
- `app/company/*`: 企業向け画面一式（ログイン・申請・ダッシュボード・スカウト履歴・プロフィール・トークン・見積作成）。詳細は`company-platform`・`scout-system`スキル参照。
- `app/admin/*`: 運営専用管理画面（`x-admin-token`ゲート）。詳細は`company-platform`・`auth-sessions`スキル参照。
- `functions/api/*.ts`: Cloudflare Pages Functions。D1（`env.DB`）へのユーザー登録・認証・プロフィール・パスワード再設定・スカウト・模試結果を担当。`functions/api/company/*.ts`は企業向け。パスワードもOTPも`functions/_lib/password.ts`のPBKDF2でハッシュ化。
