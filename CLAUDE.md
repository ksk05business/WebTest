@AGENTS.md

# プロジェクト概要

「本を買わない就活生向けのSPI WEB模試アプリ」。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。
画面は `/`（トップ）、`/register`（会員登録）、`/login`（ログイン）、`/test`（試験実行、ログイン必須）、`/result`（結果表示）。

## 開発サーバーに関する重要な注意

`npm run dev`（`next dev`）は **`functions/` 配下のAPI（`/api/register`, `/api/login`）を配信しない**。フロントエンドのUI・レイアウト確認だけなら`next dev`で十分だが、会員登録・ログインなど`fetch("/api/...")`を伴う動作確認をする場合は必ず **`npm run pages:dev`**（`next build && wrangler pages dev out`）を使うこと。これを守らないと`/api/register`が404になり、フロント側では「通信エラー」という紛らわしいメッセージになる（実際にこの不具合が一度発生している）。

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

- `src/data/questions.ts` の `Question` / `TableBlock` 型を正とし、問題データはこの型に準拠させる。
- 選択肢ラベルは `"A" | "B" | "C" | "D" | "E"` のUnion型で管理する（`string`型で緩めない）。
- `any` は使わない。表データ（`TableBlock.rows`）のセル値は `string | number` とする。
- 新しい問題データを追加する際は、既存の `id` と重複しないようにする（現在 id 1〜5 まで使用済み）。

# Tailwind CSS規約

- `app/globals.css` の背景・文字色は固定のライトテーマ（`@media (prefers-color-scheme: dark)` は追加しない）。ダークモード対応の装飾を入れると文字色とのコントラストが崩れるため、色を追加する際は必ず実際の見た目（背景色×文字色のコントラスト）を確認する。
- ボタン・カードは `rounded-lg` / `rounded-full`、余白は `px-4 py-3` 程度の既存トーンに合わせる。
- 表（`<table>`）を追加する場合は横幅オーバーフロー対策として親要素に `overflow-x-auto` を付ける。

# ページ責務

- `app/page.tsx`: サーバーコンポーネントのまま維持（`"use client"` 不要）。キャッチコピーと「新規登録」「ログイン」への導線。
- `app/register/page.tsx`: クライアントコンポーネント。会員登録フォーム。`/api/register`にPOSTする。
- `app/login/page.tsx`: クライアントコンポーネント。ログインフォーム。`/api/login`にPOSTし、成功時は`localStorage`の`spiUser`にログイン状態を保存する。
- `app/test/page.tsx`: クライアントコンポーネント。1問60秒のタイマー、回答判定、解説表示、表データのレンダリングを担当。マウント時に`localStorage`の`spiUser`を確認し、無ければ`/login`へリダイレクトする（未ログイン時は何も描画しない）。
- `app/result/page.tsx`: クライアントコンポーネント。`localStorage` の `spiResult` を読み、スコアと評価コメント、収益化バナー枠を表示。
- `functions/api/*.ts`: Cloudflare Pages Functions。D1（`env.DB`）へのユーザー登録・認証を担当。パスワードは`functions/_lib/password.ts`のPBKDF2でハッシュ化。
