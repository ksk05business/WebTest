@AGENTS.md

# プロジェクト概要

サービス名「Webテストナビ」。「本を買わない就活生向けのWebテスト模試アプリ」。SPI3・玉手箱・TG-WEB・GAB/C-GAB・SCOAに加え、2026-09-29にWeb-CAB（四則逆算・法則性・命令表の3科目、暗号は問題データ未投入のため対象外）も本番模試に対応した。`src/data/testTypes.ts`の`TEST_TYPES`は全件`available: true`（`href`は全テスト共通で`/test`。SPI・玉手箱・TG-WEB・GAB/C-GAB・CABは形式・セクションごとに個別受験する複数パート方式で`MULTI_PART_EXAM_PARTS`を参照、SCOAのみ単一の統合模試）。新しいテスト種別・科目を追加する際は`src/data/examParts.ts`（出題数・制限時間）と`src/data/examStockTargets.ts`（模試専用プールの在庫目標）の両方を必ず同期させること。Next.js (App Router, `output: "export"`静的サイト) + TypeScript + Tailwind CSS + Cloudflare Pages Functions（`functions/`）+ D1。

画面は `/`（トップ）、`/register`（会員登録）、`/login`（ログイン）、`/dashboard`（ログイン後のホーム、ログイン必須）、`/test`（試験実行、ログイン必須）、`/result`（結果表示）。登録・ログインに成功すると`localStorage`の`spiUser`にセットし、そのまま`/dashboard`へ遷移する（別途ログインを挟まない）。

企業向けには`/company/apply`（利用審査申請）→承認後`/company/login`→`/company/dashboard`（候補者検索・スカウト送信）があり、学生の成績・属性をもとにした「スカウト」機能（匿名2段階開示）が収益源の中心。

# 詳細情報は関連skillを参照

このファイルはプロジェクトの根幹（常に必要な規約）のみを載せている。ページごとの役割・DBスキーマ・UIコンポーネントのprops規約・過去に起きた障害の教訓など機能領域ごとの詳細はすべてskillに分けてある。特定の機能領域を触るときは、着手前に該当skillを読むこと。**skillの一覧と使い方（人間向け）は [`.claude/skills/README.md`](.claude/skills/README.md) を参照。**

| 触る機能 | 読むskill |
|---|---|
| D1の`questions`テーブル、問題の追加・投入、category/sub_category命名、長文のグループ出題、画像問題、選択肢ラベル等クライアント側の型規約 | `question-bank` |
| ログイン・セッション認証・本人確認・管理者トークン | `auth-sessions` |
| スカウト機能（学生↔企業のマッチング）、個人情報の第三者提供同意 | `scout-system` |
| 企業アカウント（申請・承認・プロフィール・トークン課金・見積作成）、運営用管理画面 | `company-platform` |
| 練習問題/模試モードのUI、単元選択、忘却曲線復習・誤答復習 | `practice-review-modes` |
| 会員登録フォーム、大学名・希望職種・志望業界の選択肢とマッピング | `student-registration` |
| D1スキーマ変更・本番マイグレーション、Pages Functionsのルーティング、メール送信設定 | `cloudflare-pages-gotchas` |
| SEOブログ（/blog）記事の新規作成・編集、MDXカスタムコンポーネント追加 | `seo-blog-authoring` |
| SNSショート動画（TikTok/Shorts/Reels）の構成・台本作成 | `generate-short-script` |
| ページ一覧・各画面の役割分担、Tailwind CSSのスタイリング規約 | `frontend-architecture` |

# 応答・進め方のルール

- ユーザーへの応答は常に日本語で行う。
- **トークン節約を最優先**する。目的達成に不要なファイル・コンポーネント・ドキュメントは作らない。
- 既存ファイルの編集で済む場合は新規ファイルを作らない（Edit優先、Write/新規作成は最小限に）。ただし次の2点はこの原則の例外ではなく、むしろ積極的に行うべき対応である。
  - **肥大化したファイルは分割する**: 1ファイルが複数の無関係な関心事を抱えて巨大化している場合は、指示を待たずに小さく焦点の絞られた複数ファイルへ分割する。
  - **共通処理は1箇所にまとめる**: 同じロジックが複数箇所にコピペで重複している場合は、共有のヘルパー・コンポーネントへ抽出し、各呼び出し元をそちらに差し替える。
  - 判断基準は「本当に肥大化・重複を解消するための分割/抽出か、それとも単なる過剰な抽象化・スコープ拡大か」。後者は従来通り避けること。
- 変更後は `npx next build` で型エラー・ビルドエラーが無いことを確認してから完了報告する。`functions/` を変更した場合は `npx tsc --noEmit -p functions/tsconfig.json` も実行する。ローカルでのこの確認は省略しない（下記CIはpush後の保険であり、事前確認の代わりにはしない）。
- `/register` や `/login` などAPI呼び出しを伴う変更は、`npm run pages:dev` でローカルD1に対して実際に登録・ログインを試し、動作確認してから完了報告する（`next build`だけでは不十分。理由は`cloudflare-pages-gotchas`スキル参照）。
- `.github/workflows/ci.yml`でGitHub Actions CIを実行している（push/pull_request時、`tsc --noEmit`×2・`next build`・lintは既存の指摘が多いため`continue-on-error`で非ブロッキング）。CIはpush後にコミットのステータスとして結果が残るだけで、マージやデプロイを止める仕組みではない（Cloudflare Pagesの自動デプロイとは独立）。

# アーキテクチャ制約（変更時は必ず守る）

- 外部データベース（Supabase等）は接続しない。データはCloudflare D1（`env.DB`）のみを使う。問題データの構造・投入方法は`question-bank`スキルを参照。
- 状態管理はReactの `useState` / `useEffect` のみを使う。Redux・Zustand等の状態管理ライブラリは導入しない。
- ページ間でデータを引き継ぐ必要がある場合（例: `/test` → `/result` のスコア）は `localStorage` を使う。
- 過剰な装飾・アニメーション・抽象化は避け、MVPとして機能することを最優先する。
- `wrangler.jsonc`の`name`、Cloudflare Pagesのプロジェクト名、`localStorage`のキー名（`spiUser`/`spiCompanyUser`）はユーザーに見えない内部識別子のため変更しない（詳細は`cloudflare-pages-gotchas`スキル）。
