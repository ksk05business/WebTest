---
name: frontend-architecture
description: app/配下の各ページの役割分担・データ授受・Tailwind CSSのスタイリング規約を確認するときに読む。新しいページの追加、既存ページの改修、コンポーネントの見た目調整をするときに参照。個別機能の詳細（認証・スカウト・企業機能・練習/復習モード・会員登録フォーム）はそれぞれ専用skillを見ること。ここはページ一覧の見取り図とTailwindの共通トーンのみを扱う。
---

# フロントエンドの構成（ページ責務・スタイリング規約）

## ページ責務

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

## ページ間のデータ授受

ページ間でデータを引き継ぐ必要がある場合（例: `/test` → `/result` のスコア）は `localStorage` を使う（Redux・Zustand等の状態管理ライブラリは導入しない、状態管理はReactの`useState`/`useEffect`のみ）。

## Tailwind CSS規約

- `app/globals.css` の背景・文字色は固定のライトテーマ（`@media (prefers-color-scheme: dark)` は追加しない）。ダークモード対応の装飾を入れると文字色とのコントラストが崩れるため、色を追加する際は必ず実際の見た目（背景色×文字色のコントラスト）を確認する。
- ボタン・カードは `rounded-lg` / `rounded-full`、余白は `px-4 py-3` 程度の既存トーンに合わせる。
- 表（`<table>`）を追加する場合は横幅オーバーフロー対策として親要素に `overflow-x-auto` を付ける。
- 過剰な装飾・アニメーション・抽象化は避け、MVPとして機能することを最優先する。

## GA4カスタムイベント
- 送信は `src/lib/analytics.ts` の `trackEvent(name, params)` に統一する（直接 `gtag` を呼ばない）。
- 現在のイベント: `cta_click`（記事内CallToActionCTA、および全ページの「/register」への登録ボタン（トップ・/guide・/blog・/test/*）=`TrackedLink`の`location`付き。`page_path`付き）、`sign_up`（メール/Google/LINEの新規登録成功、`method`=email|google|line。Google/LINEは同意画面 `/auth/*-signup` の成功時に送る。既存ユーザーのログインでは送らない）、`exam_complete`（模試完走、`test_type`/`score`/`total`）。
- GA管理画面でこれらを「キーイベント」に指定して初めてコンバージョンとして集計される（コードだけでは未設定）。

## /guide の例題（example）
- `src/data/guideArticles.ts` の `GuideArticle.example`（problem/choices/answer/explanation）を設定すると、ガイドページに「例題で確認」が描画される。順位10〜20位で伸び悩む単元ページの内容を厚くする用途。問題文の改行は文字列内の `
`（`whitespace-pre-line`で表示）。問題はオリジナルで作り、解説の根拠が正しいか確認すること。
- 新しく「/register」へのCTAを置くときは `<Link>` ではなく `TrackedLink`（`location`必須: header/hero/footer等）を使う。
