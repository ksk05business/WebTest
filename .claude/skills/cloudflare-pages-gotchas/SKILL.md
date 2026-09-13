---
name: cloudflare-pages-gotchas
description: Cloudflare Pages Functions・D1のこのプロジェクト特有のハマりどころを扱うときに読む。D1スキーマドリフト（ALTER TABLE運用）、本番デプロイ、メール送信（Cloudflare Email Sending）設定、wrangler.jsoncの取り扱い、D1のN+1回避（batch）、エッジキャッシュ（Cache API）、フロントのfetchリトライ規約を含む。schema.sqlを変更する・本番D1にマイグレーションを適用する・メール機能に触るときは必読。
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

## D1のN+1回避（batch）

D1はPostgresのようなコネクションプールを持つDBではなく（Prisma/Drizzle/PgBouncer等の概念はそもそも当てはまらない）、1回のawaitが1往復のHTTPライクなラウンドトリップになる。1回答=1行のような「配列をfor文でawait直列INSERT/UPSERT」するコードは、件数が多い（模試1パート最大130問、練習の「未回答のみ」等は最大300問）ほどレイテンシが積み上がり、通信エラー・タイムアウトの原因になる（2026-09-13に実際にこれが原因の不安定化を修正した実例: `functions/api/practice/history.ts`のuser_question_history一括INSERT、`functions/api/exam-results.ts`のenqueueWrongAnswers・exam_result_answers一括INSERT）。

**同じユーザーの複数行を書き込む場合は、必ず`db.batch([stmt1, stmt2, ...])`を使う**（`db.prepare(sql)`で1つのPreparedStatementを作り、`.bind(...)`した配列を`db.batch()`に渡す。1リクエストにまとめて送信され、トランザクションとして実行される）。新しく「配列をループしてDBに書き込む」コードを書く前に、既存のbatch実装を参考にすること。

## エッジキャッシュ（Cache API）

ユーザーに依存しない全員共通のGETレスポンス（例: `functions/api/question-units.ts`の単元別収録問題数）は、Cloudflareの`caches.default`（Cache API）でキャッシュしD1への問い合わせを削減する。パターン:

```ts
const cache = caches.default;
const cacheKey = new Request(context.request.url, context.request);
const cached = await cache.match(cacheKey);
if (cached) return cached;
// ...DBクエリ...
const response = Response.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
context.waitUntil(cache.put(cacheKey, response.clone()));
return response;
```

認証ユーザー固有のデータ（`getAuthenticatedSubjectId`を呼ぶ全エンドポイント）には使わない（他人のデータが返る事故になる）。管理者が問題を追加した直後は最大`max-age`秒だけ単元一覧の件数表示が古いままになり得るが、意図的なトレードオフ（`question-bank`スキル参照）。

## フロントのfetchリトライ規約

`src/lib/fetchWithRetry.ts`は、一時的な通信エラー（ネットワーク断・D1側の5xx/429）を指数バックオフで自動再試行する`fetch`の薄いラッパー（デフォルト計3回試行、4xxは再試行しない）。**ボタンの活性化・出題開始など「取得できないとUIが詰む」GETフェッチには素の`fetch`ではなくこれを使う**。以前は`.catch(() => {})`で握りつぶすだけの実装が複数箇所にあり、一時的な通信エラー1回でstateが`null`のまま固まり「ボタンが押せない・何度もリロードしないと直らない」不具合の主因になっていた（`ExamModeSelectModal.tsx`・`app/test/page.tsx`・`UnitStatusSummaryModal.tsx`等で2026-09-13に修正）。

再試行を使い果たしてもなお失敗した場合に備え、`eligibilityFailed`のような専用stateを持たせ、赤文字エラー＋「再試行」ボタン（同じ読み込み関数を再度呼ぶだけ）を出すこと。再試行中はボタンをdisabled化し、`lucide-react`の`Loader2`（`animate-spin`、既存は`QuotationDownloadButton.tsx`が先例）でローディング中であることを示す。POST（`/api/exam-results`・`/api/practice/history`のPOST等、非冪等な書き込み）には自動リトライを使わない（レスポンス消失後の再試行で二重登録になり得るため、失敗時は素の`fetch`のままユーザーに任せる）。
