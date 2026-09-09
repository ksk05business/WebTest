---
name: auth-sessions
description: ログイン・セッション認証・本人確認・管理者トークンまわりを扱うときに読む。学生/企業向けAPIの認可、functions/_lib/session.ts、x-admin-token、IDOR対策のセキュリティ設計を含む。新しいAPIエンドポイントで「誰の操作か」を判定するロジックを書くときは必読。
---

# 認証・セッション設計

## 現在のモデル（2026-08-22のセキュリティ監査で刷新済み）

`sessions`テーブル（`token, subject_type('user'|'company'), subject_id, expires_at`）とHttpOnly・Secure・SameSite=LaxのCookie（学生=`session`、企業=`company_session`、別名で共存）による認証。ログイン/新規登録時にランダムな256bitトークンを発行してCookieとして返す。

保護対象のAPIは**必ず**`functions/_lib/session.ts`の`getAuthenticatedSubjectId(db, request, "user"|"company")`でCookieを検証し、**そこで得られたIDのみを本人確認の根拠として使う**こと。クライアントがリクエストボディ/クエリで送ってくる`email`/`companyEmail`は本人確認に使わない（表示用途などに限定する）。

ログアウトは`POST /api/logout`・`POST /api/company/logout`（DBのセッション行を削除＋Cookieクリア）。

フロントエンドの対応: 同一オリジンの`fetch()`はデフォルトでCookieを自動送信するため、fetch呼び出し自体の変更は不要。「セッションが無効/期限切れだった場合」の処理として`src/lib/authRedirect.ts`の`redirectToLogin()`/`redirectToCompanyLogin()`を使う。APIが`{error:"ログインが必要です"}`（401）を返したら、ローカルの`spiUser`/`spiCompanyUser`を破棄してログイン画面へ戻す。

## なぜこの設計になったか（IDOR脆弱性の教訓）

2026-08-22以前は`functions/api/scouts.ts`・`me.ts`・`consent.ts`・`exam-results.ts`・`review.ts`・`practice/history.ts`（学生向け）と`company/scouts.ts`・`company/sent-scouts.ts`（企業向け）の8ファイルすべてが、**クライアントから送られてきた`email`/`companyEmail`という文字列をそのまま「本人確認」として信用していた**（パスワードやトークンによる検証が一切無い）。他人のメールアドレスさえ知っていれば、そのAPIを直接叩くことで他人の模試結果・スカウト・プロフィール・復習履歴を読み書きできる状態だった（IDOR = Insecure Direct Object Reference）。

**新しいAPIエンドポイントを書くときは、この過ちを繰り返さないこと**: リクエストのbody/queryに含まれる識別子（email等）を信頼して認可判定に使わない。必ず`getAuthenticatedSubjectId`で得たIDをWHERE句の主体として使う。

セッション方式変更の実ユーザーへの影響: 修正前にログイン済みだった実ユーザーはセッションCookieを持っていないため、デプロイ後に一度401→ログイン画面へ戻される（再ログインで解消）。今後同種の認証方式変更をする際は、強制再ログインの影響を毎回考慮すること。

## 管理者トークン方式（`x-admin-token`）

このアプリには管理者ログイン機構（DBベースのアカウント）が無い。`ADMIN_API_TOKEN`（Pages Secret）と一致する`x-admin-token`ヘッダーを持つリクエストのみを許可する簡易ゲート方式。検証ロジックは`functions/_lib/adminAuth.ts`の`checkAdminAuth()`に一本化されている（新しい管理者用APIを作る際は必ずこれを使う。ローカル定義で重複実装しない）。

フロント側（`/admin/companies`・`/admin/dashboard`）は`sessionStorage`にトークンを保存し、全リクエストに`x-admin-token`として付与する。`output:"export"`静的サイトのため真のサーバーサイドセッション検証（ミドルウェア等）が使えない設計上の制約であり、「クライアント側リダイレクト＋API側の実トークン検証」の二段構えで安全性を担保している。

ローカル開発時のトークンは`.dev.vars`の`ADMIN_API_TOKEN`。本番の値は`.env.admin.local`（`.gitignore`済み、リポジトリに含まれない）にのみ保存されている。**トークン値をチャットの応答やコミットに直接書かないこと。**

## 動作検証パターン

セッション周りを変更したら、被害者役・攻撃者役の2つのテストアカウントを作り、「攻撃者のセッションCookieのまま、リクエストボディ/クエリに被害者の識別子を指定してAPIを叩く」攻撃シナリオで再現し、**攻撃者自身のデータにのみ作用し被害者のデータに影響しないこと**を確認する。あわせてCookie無しアクセスの401、ログアウト後の旧Cookie失効も確認する。検証用アカウントは本番から必ず削除すること。
