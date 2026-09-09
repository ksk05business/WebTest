---
name: cloudflare-pages-gotchas
description: Cloudflare Pages Functions・D1のこのプロジェクト特有のハマりどころを扱うときに読む。D1スキーマドリフト（ALTER TABLE運用）、本番デプロイ、メール送信（Cloudflare Email Sending）設定、wrangler.jsoncの取り扱いを含む。schema.sqlを変更する・本番D1にマイグレーションを適用する・メール機能に触るときは必読。
---

# Cloudflare Pages / D1 特有の注意点

## D1のスキーマドリフトに注意（実際に障害が発生した）

`schema.sql`の`CREATE TABLE IF NOT EXISTS`は**既存テーブルには効かない**。コードで新しいカラムを参照し始めても本番D1には反映されず、テーブル自体はあるがカラムが古いまま、という状態になりやすい。2026-08-20に実際にこれで障害が発生した（`users.terms_agreed_at`と`users.scout_consent`が本番`users`テーブルに存在せず、スカウト同意更新が500エラーになっていた）。

**教訓**: `schema.sql`のCREATE TABLE文にカラムを追加・変更したら、必ず`npx wrangler d1 execute webtest-db --remote --command "PRAGMA table_info(<table>)"`で本番の実カラムと突き合わせ、足りなければその場で`ALTER TABLE users ADD COLUMN ...`を実行する。「言われたら次回直す」ではなく、**スキーマ変更のたびに本番との差分確認をワークフローに組み込むこと**。新規テーブルは`schema.sql`の再実行（`wrangler d1 execute --remote --file=schema.sql`）で作成されるので問題ない（既存テーブルへのカラム追加のときだけ注意）。

`wrangler d1 execute --remote`が「Network connection lost」等のネットワークエラーで失敗した場合、D1は失敗時に自動的に元の状態へロールバックする仕様。`SELECT COUNT(*)`等で実際に書き込まれていないことを確認してから、同じファイルで安全に再試行できる。

## 開発サーバー: next dev は functions/ を配信しない

`npm run dev`（`next dev`）は**`functions/`配下のAPI（`/api/register`, `/api/login`等）を配信しない**。フロントエンドのUI・レイアウト確認だけなら`next dev`で十分だが、`fetch("/api/...")`を伴う動作確認（会員登録・ログイン等）をする場合は必ず**`npm run pages:dev`**（`next build && wrangler pages dev out`）を使うこと。これを守らないと`/api/register`が404になり、フロント側では「通信エラー」という紛らわしいメッセージになる。

## Pages Functionsの入れ子ルート命名衝突

同じベース名のファイルとディレクトリ（例: `functions/api/questions.ts`と`functions/api/questions/units.ts`）は共存できず、本番デプロイ後に404になる（`wrangler pages dev`のローカルエミュレーションでは動いてしまうため、ローカル確認だけでは気づけない）。新しい入れ子ルートを作る前に、同じベース名の`.ts`ファイルが既に存在しないか確認し、可能ならデプロイ後に本番URLへ直接curlして確認すること。詳細事例は`question-bank`スキルを参照。

## wrangler.jsonc / プロジェクト名は変更禁止

`wrangler.jsonc`の`"name": "spi-mock-app"`とCloudflare Pagesのプロジェクト名`webtest`は、ユーザーに見えない内部識別子だが**変更するとデプロイ先のバインディングが変わりかねないため意図的に触らないこと**（サービス名のリブランディング時も内部識別子はそのまま維持した実例がある）。`localStorage`のキー名（`spiUser`/`spiCompanyUser`）も同様に内部識別子として扱い、表示名の変更とは切り離す。

## メール送信（Cloudflare Email Sending）

`send_email`バインディング（Workers用）は**Cloudflare Pagesプロジェクトの設定検証で拒否される**（`wrangler pages deploy`が「Configuration file for Pages projects does not support "send_email"」で失敗した実例あり）ため使用不可。`functions/api/forgot-password.ts`は**Cloudflare Email SendingのREST API**（`fetch`＋Bearerトークン、`env.EMAIL_API_TOKEN`と`env.CLOUDFLARE_ACCOUNT_ID`）でOTPメールを送信する。

- `CLOUDFLARE_ACCOUNT_ID`は`wrangler.jsonc`の`vars`に平文設定済み（機密情報ではない）。
- `EMAIL_API_TOKEN`はPages Secretとして**現状未設定**（公開ローンチ前まで意図的に据え置き。`wrangler pages secret put EMAIL_API_TOKEN --project-name=webtest`で設定する。トークン値は対話プロンプトで入力させ、絶対にコマンド引数や会話に直接書かない）。トークンが無い場合やドメイン未オンボードの場合、OTP自体はD1に正しく保存されメールだけ届かない（API応答は成功のまま）。
- ドメインのオンボード（`wrangler email sending enable <domain>`）はOAuthトークンの権限制約で`Unauthorized [code: 2036]`になることがある。その場合ダッシュボード（Compute & AI > Email Service > Email Sending > Onboard Domain）からの手動オンボードが必要。
- 動作確認時にOTPの値を見たい場合は`forgot-password.ts`に一時的に`console.log`を仕込み、`wrangler pages dev`のログで確認してからコミット前に必ず削除すること。

**AIチャットボット（Cloudflare Workers AI）は過去に導入→撤回済み**（`"ai": {"binding": "AI"}`は削除済み）。現在の`SupportChatWidget.tsx`は外部通信を一切行わないハードコードFAQボットのみ。再導入する場合はAPIクレジット消費・レート制限の設計を再検討すること。
