---
name: company-platform
description: 企業向け機能（アカウント申請・審査承認・企業プロフィール・トークン課金・見積作成・運営用管理画面）を扱うときに読む。company_profiles、company_token_logs、/admin/companies、/admin/dashboard、/company/tokens、/company/quotationを含む。
---

# 企業向けプラットフォーム

## アカウントのライフサイクル

企業アカウントは「自己申請（`status='pending'`）→ 管理者が承認/却下」の2段階フロー。`company_applications`という別テーブルは作らず、既存の`company_profiles`テーブルに`status`（'pending'|'active'|'rejected'、デフォルト'pending'）カラムを追加する方式にした。

- `POST /api/company/apply`（公開・認証不要）: 会社名・担当者氏名/部署/役職・会社用メール・電話番号・コーポレートサイトURL・アカウント種別が必須。会社用メールは`functions/_lib/freeEmailDomains.ts`のブロックリストでフリーメールを拒否。成功時は`password_hash`/`password_salt`が空文字のレコードを作るのみで、この時点ではログイン・スカウト機能に一切アクセスできない。
- **管理者API** `functions/api/admin/companies.ts`（GET一覧・POST承認/却下、`checkAdminAuth()`使用）: 承認時のみ`functions/_lib/password.ts`の`generateInitialPassword()`で初期パスワードを新規発行し、**平文パスワードをこのAPIレスポンスの中だけ**で返す（他のどこにも保持しない）。同時に`grantTokens(db, companyId, APPROVAL_BONUS_TOKENS=30, "review_bonus")`で無料トークン30枚を付与する。`status='pending'`の申請にしかapprove/rejectできない。
- **アクセス制御**: `functions/api/company/login.ts`はパスワード照合の**前に**`status !== 'active'`を確認し、pending/rejectedいずれもログイン自体を拒否する。`company/scouts.ts`・`sent-scouts.ts`・`promotion.ts`も多層防御として`status === 'active'`をチェックする。
- 旧`approved INTEGER`カラムは非推奨として残置（D1のALTER TABLEでは列のNOT NULL制約変更やDROPが安全に行いづらいため削除していない）。コード側では参照しない。

**メール送信機能は公開ローンチまで未設定のまま据え置く方針**（初期パスワードの通知・審査結果の連絡は運営担当者が画面表示された値を手動で連絡する運用）。

## 企業向け画面

- `/company/apply`: 未ログイン向けの公開申請フォーム。
- `/company/login` → `/company/dashboard`: 承認済み企業のホーム。候補者検索・スカウト送信。
- `/company/scouts`: 送信済みスカウトの履歴・ステータス管理。
- `/company/profile`: 氏名・会社用メール・学生向け「おすすめ企業」25字メッセージ・アピールタグ（`APPEAL_TAGS`）の編集、パスワード変更。API: `functions/api/company/profile.ts`（GET/PUT）・`change-password.ts`。
- `/company/tokens`: トークンパック購入UI（ミニ50/¥40,000・スタンダード100/¥60,000・ボリューム300/¥150,000）。**実際のStripe決済連携は未実装**、「購入を申し込む」は既存の`POST /api/contact`にパック内容を整形して送信するのみ（運営がD1を直接確認して手動でトークン付与・決済案内する運用）。
- `/company/quotation`: 御見積書自動作成フォーム（企業名・プラン・利用人数→リアルタイム計算→PDF）。`src/components/QuotationSimulator.tsx`（共通コンポーネント、`/enterprise/quotation`という非ログイン向けページからも同じものを呼ぶ）＋`src/components/pdf/`（`@react-pdf/renderer`、日本語フォントはGoogle Fonts CSS2 APIから取得した静的ttf直リンクを`Font.register`で使用、`PDFDownloadLink`はSSR/静的プリレンダリング時にハイドレーションエラーを起こすため`useEffect`のmountedフラグでクライアント限定レンダリングにする）。料金プラン定義は`src/data/quotationPlans.ts`が唯一の情報源。

`CompanyHeader.tsx`のナビ「見積作成」リンクは`/company/quotation`へ遷移する（旧「トークン」リンクから変更済み。右上の「残りNトークン」残高バッジは別要素として引き続き`/company/tokens`へリンクする）。

## トークン消費型マネタイズ

企業向け課金モデルは「トークン購入・消費型」。増減は必ず`functions/_lib/companyTokens.ts`（`grantTokens()`/`consumeTokens()`/`getEffectiveTokenBalance()`）経由で行い、`company_token_logs`に履歴を残す（`company_profiles.token_balance`を他の場所から直接UPDATEしない）。

- トークンは付与のたびに有効期限を「付与日+180日」へ一律更新する簡易実装。有効期限切れの残高は`getEffectiveTokenBalance()`が実質0として返す。
- **消費ルール**: スカウト送信1件につき1トークン、「おすすめ表示」設定（7/14/30日固定選択）は1日あたり1トークン。残高不足時は`consumeTokens()`がfalseを返し402＋`{insufficientTokens:true}`。
- 審査承認時に無料30トークン付与（上記参照）。`pending`の企業は`token_balance=0`のまま。

## 運営専用管理画面

- `/admin/companies`: 審査申請一覧・承認/却下（`sessionStorage`の`adminApiToken`で`x-admin-token`ゲート）。
- `/admin/dashboard`: お問い合わせ・企業/エージェント・学生の3タブを持つ統合管理画面。認証は既存の`ADMIN_API_TOKEN`をそのまま「管理者パスワード」として使う（新しいPages Secretは追加していない）。LP・共通ヘッダー/フッターには一切リンクを置いていない「秘密URL」方式。
  - お問い合わせタブ: `contact_inquiries`（`status`カラム）、`GET/POST /api/admin/contact-inquiries`。
  - 企業・エージェントタブ: `src/components/admin/CompanyManagementPanel.tsx`を`/admin/companies`と共用。
  - 学生タブ: `GET /api/admin/users`（`users`×`exam_results`COUNT結合、検索・フィルタはクライアント側）。
  - `x-admin-token`検証は`functions/_lib/adminAuth.ts`の`checkAdminAuth()`に一本化（詳細は`auth-sessions`スキル参照）。

新しい管理者用APIを追加する際は、この`checkAdminAuth()`を必ず使うこと（過去に`admin/questions.ts`だけこれをバイパスしてインライン重複実装していた実例がある）。
