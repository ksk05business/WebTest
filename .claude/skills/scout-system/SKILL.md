---
name: scout-system
description: 企業から学生へのスカウト機能（匿名2段階開示・同意設計・個人情報の第三者提供）を扱うときに読む。scoutsテーブル、consent_events、functions/api/scouts.ts・company/scouts.ts、ScoutSendModal・ScoutDetailModal・ScoutInbox、利用規約・プライバシーポリシーとの整合性を含む。個人情報保護法・リクナビ事件の教訓を踏まえた設計判断の経緯が重要。
---

# スカウト機能（第三者提供）

## 事業モデルと法的な前提（最重要）

学生の成績・個人情報を提携企業へスカウト目的で提供し、その対価を収益源とする計画。個人情報保護法上、第三者提供には本人の明確な同意が必須であり、**リクナビ内定辞退率問題（2019年）を直接の教訓**として設計している。

- `app/terms/page.tsx`・`app/privacy/page.tsx`は弁護士レビュー前提の下書き。**実際に第三者提供を開始する前に、文面と事業モデル（職業紹介事業許可の要否を含む）について弁護士のレビューを必ず受けること。**
- `company_profiles`は職業安定法上「募集情報等提供事業」として運営する前提（`provider_business_type`）。

## スカウト同意の設計判断（経緯に注意 — 複数回上書きされている）

1. **2026-08-21（初回実装）**: リクナビ事件の教訓を踏まえ、「利用規約・プライバシーポリシーへの同意」（`agreedTerms`、必須）と「スカウト目的での第三者提供への同意」（`scoutConsent`、任意）はチェックボックスを分離し、`scoutConsent`はデフォルトOFF・本サービス利用の必須条件にしない方針を採用。
2. **同日中に別指示で上書き**: `scoutConsent`のデフォルトを**ON**に変更（`useState(true)`）。
3. **2026-08-27に再度上書き**: `scoutConsent`用の独立チェックボックスを完全に廃止し、`scoutConsent: agreedToPrivacy`（プライバシーポリシーへの同意に統合）として送信するよう変更。この結果、学生から見ると「スカウト対象になりたくない」という選択が、プライバシーポリシーへの同意（＝サービス利用の必須条件）とセットになり、事実上のデフォルトオプトイン相当になっている。**個人情報保護法の第三者提供同意（独立した意思確認）の観点からは望ましくない設計である可能性が高く、公開前に弁護士レビューで必ず確認すべき点として明記しておく。**

**今後この設計を再検討する際は、上記の経緯（慎重な設計→ユーザー指示による2度の上書き）を踏まえること。** サーバー側（`functions/api/register.ts`）は`agreedTerms`と`scoutConsent`を独立フィールドとして受け取る設計を維持しているため、フロントの送り方だけを変更すれば設計方針を戻せる。

- スカウト同意は`/mypage`からいつでも撤回できる（`functions/api/consent.ts`）。
- 同意・撤回は`consent_events`テーブルに履歴として記録する（個人情報保護法29条の第三者提供記録の裏付け）。

## スキーマとAPI

- **`scouts`テーブル**: 2段階開示フラグ`is_anonymous`。企業は`users.scout_consent = 1`の学生の匿名属性（`university_category`/`faculty_type`/`industry_first`〜`third`/`exam_results.deviation_score`/`desired_occupations`）のみを見て匿名スカウトを送る（`is_anonymous=1`で作成、`title`必須）。学生が`/mypage`で「承諾」した場合のみ`status='accepted'`かつ`is_anonymous=0`に更新し、そのスカウトに限り氏名・メールが開示される。「辞退」は`status='declined'`のまま`is_anonymous`は1を維持し開示しない。運営は手動マッチングを行わず、システムが状態遷移を処理するのみ。`is_read`フラグ（既読管理）も持つ。
- **`functions/api/scouts.ts`**（学生向け、セッション認証必須）: GETで自分宛の一覧、PUT `{scoutId, action:'accept'|'decline'|'read'}`で応答（`status='sent'`のものにしか作用しない。`'read'`は既読フラグのみ更新する冪等操作）。
- **`functions/api/company/scouts.ts`**（企業向け、セッション認証＋`status==='active'`必須）: GETで候補者検索（匿名属性のみ、`universityCategory`/`facultyType`/`industry`/`minDeviation`/`desiredOccupation`でフィルタ）、POSTでスカウト送信（`status='sent'`の重複送信は409。**トークン消費を伴う**、`company-platform`スキル参照）。
- **`functions/api/company/sent-scouts.ts`**: 企業が送信した全スカウトを返す。`is_anonymous=0`（学生承諾済み）の行だけ実名・メールをSQLのCASE式で開示。

## UIコンポーネント

- `src/components/ScoutSendModal.tsx`: 件名・本文・テンプレート選択を持つ送信モーダル（`/company/dashboard`から開く）。トークン残高不足時は`insufficientTokens`フラグを見て`/company/tokens`（または`/company/quotation`）への案内を表示する。
- `app/company/scouts/page.tsx`: 送信済みスカウトの履歴・ステータス管理（検索・送信画面とは責務を分離、`GET /api/company/sent-scouts`を利用）。
- `src/components/ScoutDetailModal.tsx`（学生側）: 詳細表示→承諾確認→辞退確認の3ビューを1モーダル内で切り替え。開いた瞬間に未読なら既読PUTを発行する。
- `src/components/ScoutInbox.tsx`（`/dashboard`）・`DashboardHeader.tsx`の未読バッジ: `status==='sent' && !isRead`の件数を表示。

## 大学区分・希望職種など匿名属性の扱い

`users.university_category`（大学名そのものは開示せず、通称区分のみ企業に開示する）は`src/data/universityCategories.ts`の`getUniversityCategory()`でマッピングする。詳細（手動入力大学の区分処理、区分一覧）は `student-registration` スキルを参照。
