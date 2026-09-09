---
name: practice-review-modes
description: 練習問題モード（/practice）・本番模試モード（/test）・単元選択UI・復習機能（忘却曲線ベースの/review、誤答復習ノート、ダッシュボード横断のスキマ暗記復習）を扱うときに読む。ExamModeSelectModal、PracticeUnitSelector、testExplainers、practiceUnitsの構造を含む。
---

# 練習・模試モードと復習機能

## 模試（本番モード）と練習問題（トレーニングモード）の違い

`app/test/page.tsx`（模試）と`app/practice/page.tsx`（練習）は同じ出題・即時採点・解説表示ロジックを共有するが、以下が異なる:
- 模試は1問60秒のカウントダウン、練習は経過時間のカウントアップ。
- 模試は終了後`/result`へ遷移、練習は画面内完了サマリー表示。
- 模試は`localStorage`の`spiResult`/`spiResultHistory`を更新するが、練習は更新しない。
- `POST /api/exam-results`に`isPractice: true`を付けると、`exam_results`への正式記録（偏差値・受検回数に反映）は行われないが、間違えた問題の復習キュー登録（下記）は本番模試と同じロジックで実行される。

## テスト種別の汎用化パターン

`ExamModeSelectModal`・`PracticeUnitSelector`は`testType.id`で分岐する汎用設計。新しいテスト種別を追加する際はこの2つのマップを埋める:
- `src/data/testExplainers.ts`の`TEST_EXPLAINERS: Record<string, TestExplainer>`（「〜とは？」解説アコーディオン用）。
- `src/data/practiceUnits.ts`の`PRACTICE_UNIT_GROUPS_BY_TEST: Record<string, PracticeUnitGroup[]>`（単元一覧、`DEFAULT_TEST_ID = "spi"`）。単元の`category`/`subCategory`命名規則は`question-bank`スキルを参照。

`testType.available`（本番模試を実際に受けられるか）と、単元一覧を持つかどうか（`hasPracticeContent`、`PRACTICE_UNIT_GROUPS_BY_TEST`にエントリがあるか）は**別軸**。`available: false`のまま（本番模試は未提供）でも「〜とは？」解説と練習問題の単元ブラウズだけは提供できる。`questions`テーブルに`test_type`列自体が無く`/test`はSPI専用の作りのため、新テスト種別を安易に`available: true`にすると、SPI以外の問題が別テストと称して`/test`に出題されてしまう危険がある（`question-bank`スキルの「`/test`へのカテゴリ漏れ」参照）。

`testType`クエリパラメータは`ExamModeSelectModal`→`/practice`→`PracticeUnitSelector`→`BackToUnitsLink`まで一貫して引き回す。

## 単元選択UI

`/practice`に`?category=`が無い状態でアクセスすると`src/components/PracticeUnitSelector.tsx`が単元一覧を表示する。単元カードをクリックした瞬間に`/practice?category=...&subCategory=...`へ直接遷移（「選択してから練習スタート」の2段階UIは廃止済み）。0件（準備中）の単元はクリックしても遷移せず、2.5秒で消えるトーストを表示する。「収録問題数」バッジは`GET /api/question-units`（`category`・`sub_category`でGROUP BY件数）から取得する。

ランダム総合練習（`/practice?category=all`）は、`PRACTICE_UNIT_GROUPS_BY_TEST[testId]`から該当テストの大分類一覧を導出して`?category=`に複数指定する（カテゴリ無指定にすると他テストの問題が混入する。`question-bank`スキル参照）。

`app/practice/page.tsx`の`BackToUnitsLink`は、単元一覧選択画面自体を除く全描画状態（エラー・完了・読み込み中・出題中）の先頭に常時表示し、確認ダイアログ無しで即座に`/practice`（単元一覧）へ戻る（練習モードは進捗を保存しない前提のため離脱確認は不要と判断）。

## 復習機能は2系統ある（統合しない設計）

**混同注意**: このアプリには役割の異なる復習系統が2つ併存している。

1. **`user_question_reviews`（エビングハウスの忘却曲線ベース、`/review`専用）**: ユーザー×問題ごとに1行のみ保持し、`review_stage`（0〜4）と`next_review_at`を上書き更新する。スケジュールは`functions/_lib/reviewSchedule.ts`の`nextIntervalDaysAfterStage()`（1→3→7→14→30日の5段階、不正解で`stage=0`に戻り翌日再スケジュール）。対象は`functions/_lib/knowledgeCategories.ts`の`KNOWLEDGE_REVIEW_CATEGORIES`（現状`verbal`/`english`/`tamatebako_verbal`/`tamatebako_english`のみ）で、登録は`enqueueWrongLanguageAnswers`（旧`enqueueWrongVerbalAnswers`）。`GET/POST /api/review`、`app/review/page.tsx`が消化する。
2. **`user_question_history`（生ログ、全テスト・全単元共通）**: `{user_id, question_id, test_type, correct, is_practice, answered_at}`を1回答=1行で記録する。「テスト種別ごとに今何を間違えたままか」を動的判定するためのもの。`functions/api/practice/history.ts`のGETが「直近の解答が不正解のまま」の問題を`ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY answered_at DESC)`で判定して返す（一度間違えても後で正解していれば対象から外れる）。

新しい復習系機能を作る際は、どちらの系統に属するか最初に決めること。むやみに統合しない（役割が違う: ①は「いつ復習すべきか」のスケジューラ、②は「今何を間違えたままか」の動的判定）。

## 復習UIの導線（2箇所、意味が違う）

- **各テスト単元選択ページ上部の「復習ノート」**（オレンジ系、`PracticeUnitSelector.tsx`）: `GET /api/practice/history?testType=<id>&countOnly=1`、そのテストの全分野横断。クリックで`/practice?testType=<id>&category=wrong_review`。
- **ダッシュボード横断の「スキマ暗記復習」**（エメラルド系、`PerformanceDashboard.tsx`、`MemorizationReviewBanner`）: `GET /api/practice/history?scope=memorization`、`memorization: true`単元のみをテスト種別問わず横断集計。「暗記系」判定は`src/data/practiceUnits.ts`の`PracticeUnit.memorization`フラグ（判定基準は「スマホの移動中に1問単位でサクッと解けるか」、長文読解等まとまった文章が必要な単元は同じ言語カテゴリでも対象外）。`getMemorizationUnitKeys()`で導出。

`app/practice/page.tsx`の`?scope=wrong`（`testType`併用、単一テスト誤答のみ）と`?scope=memorization`（全テスト横断）で出題対象が変わる。`scope=memorization`は複数テストの問題が1セッションに混在しうるため、完了時POSTを`rawCategory→testId`でグルーピングしテストごとに個別送信する。

## カテゴリ別偏差値（PerformanceDashboard）

`functions/api/exam-results.ts`のGETは、`questions`テーブルから`DISTINCT category, sub_category`を取得して小分類→大分類の対応表を作り、ユーザーの`category_scores_json`履歴（直近20件）をこの対応表で大分類ごとに集計する。母集団は「直近500件の`exam_results.category_scores_json`を同じ対応表でバケット化した受験ごとの正答率リスト」とし、既存の`calculateDeviationScore()`をそのまま流用する。**全体の偏差値と同じ「簡易実装」であり、サンプルが少ない/母集団が無い場合は50固定になる。** レスポンスの`bestDeviationScore`・`categoryBreakdown`を`PerformanceDashboard`が描画する。評価ランク（S〜D）はサーバー側には持たず、クライアントの`getRank()`で算出する。

## 問題ID表示

`questions.category`とD1側の`ROW_NUMBER() OVER (PARTITION BY category ORDER BY id)`から`#SPI-NV-005`のような表示用コードを動的導出する（新DBカラムは追加していない）。詳細は`question-bank`スキルの`CATEGORY_CODE`の節を参照。
