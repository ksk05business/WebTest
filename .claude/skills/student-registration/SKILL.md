---
name: student-registration
description: 学生の会員登録（/register）・ログイン・プロフィール（/mypage）フォームを扱うときに読む。大学名の入力と大学区分マッピング、希望職種・志望業界の選択肢、AuthLayout/IconInput、Enterキーのフォーカス移動を含む。
---

# 学生登録・プロフィール

## 画面とロジック

`app/register/page.tsx`（`/api/register`にPOST）、`app/login/page.tsx`（`/api/login`にPOST）、成功時はどちらも`localStorage`の`spiUser`を保存して`/dashboard`へ遷移する。`app/mypage/page.tsx`（画面タイトルは「プロフィール設定」、URLは`/mypage`のまま）は個人属性の閲覧/編集2モード制（`mode: "view"|"edit"`）。更新APIは新規に作らず既存の`GET/PUT /api/me`を使っている。

`src/components/AuthLayout.tsx`（`/login`・`/register`共通ラッパー、`lg:`以上でグラデーションビジュアルパネル）と`src/components/IconInput.tsx`（Lucideアイコン付き入力欄）がデザインを担う。`AuthLayout`は`maxWidthClassName`等の任意propで`/register`だけ横幅を広げてコンパクト化できる（未指定時は`/login`と同じ見た目を維持、非破壊的拡張）。

`focusNextField()`（`app/register/page.tsx`）がフォーム内の入力要素をDOM順に走査し、Enterキーで次の要素へフォーカス移動する（`<select>`要素自体には付けていない、ネイティブ挙動が不定なため）。

## 大学名と大学区分（university_category）

`users.university_category`は**匿名開示用の大学区分**（大学名そのものは企業に開示しない、スカウト機能で使う）。`src/data/universityCategories.ts`の`getUniversityCategory()`で大学名からマッピングし、`register.ts`・`me.ts`のPUTで自動算出・保存する。

11区分: 旧帝一科／TOCKY／電農名繊／その他国公立大学／早慶上理／GMARCH／関関同立／日東駒専／産近甲龍／その他私立大学／海外大学。全100校が漏れなくマッピングされていることをスクリプトで検証済み（既存ユーザー分は登録・更新のタイミングでしか埋まらないため古いレコードはNULLの可能性がある）。

**手動入力大学の区分処理（重要な仕組み）**: 一覧に無い大学は「その他国公立大学」「その他私立大学」「海外大学」の3択（`MANUAL_ENTRY_UNIVERSITIES`）から選んでから自由入力する。**この選んだ区分がそのまま`university_category`として保存される**（`manualUniversityCategory`をリクエストボディで受け取り、`MANUAL_ENTRY_UNIVERSITIES`に含まれる値なら優先、無ければ`getUniversityCategory(university)`にフォールバック）。`UniversityField`は`onManualCategoryChange`で選択区分を親に伝え、マイページでは`initialManualCategory`として再表示・再保存時も区分を保持する。**この仕組みが無いと、手動入力大学は常にフォールバック値（その他私立大学）に丸められる不具合が起きる**（過去に海外大学入力でこの不具合が発生した実例がある）。

## 希望職種（desired_occupations）

`src/data/formOptions.ts`の`DESIRED_OCCUPATIONS`から最大3つまで選択（`users.desired_occupations`にJSON文字列配列として保存）。バリデーションは`functions/_lib/desiredOccupations.ts`の`parseDesiredOccupations()`に集約。**マスタ一覧は`functions/_lib/desiredOccupations.ts`と`src/data/formOptions.ts`に別々に定義してあるため、選択肢を増減する際は両方を修正すること**（本来は一本化できたが独立させたまま実装されている）。

フロントは`src/components/LimitedCheckboxGroup.tsx`（上限件数を超えると選択自体をブロック）を`/register`・`/mypage`で使用。企業側の検索フィルタは`desired_occupations`がJSON配列カラムのため`u.desired_occupations LIKE '%"<値>"%'`をOR結合する方式（`IN`句が使えない）。

## 志望業界（industry_first/second/third）

`src/data/formOptions.ts`の`INDUSTRY_GROUPS`（大分類10グループ・計38業種、optgroup付き）。フラット化した`INDUSTRIES`も同ファイルからエクスポートされる（企業側フィルタ等で使う）。**この分類は過去に複数回再編されている**（旧: 43業種グループ→フラット10種類→現行の10グループ38業種）。既存ユーザーの登録データには旧分類・旧旧分類の値が残っている場合がある（`scripts/migrate-industry-values.mts`で本番へは移行適用済み）。

## スカウト同意との関係

登録フォームの`scoutConsent`送信ロジックには複数回の設計変更の経緯がある。詳細・法的な注意点は`scout-system`スキルを参照すること（このファイルでは触れない）。
