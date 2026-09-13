---
name: question-bank
description: D1の questions テーブル（問題バンク）を扱う作業向け。新しい問題の追加・投入、category/sub_category の命名規則、テスト種別（SPI/玉手箱/TG-WEB/GAB/SCOA）ごとの分類、長文のグループ出題（passage_group_id）、画像問題（image_data_uri）、模試専用問題（is_mock_only）、問題ID表示（questionCode）を扱うときに読む。
---

# 問題バンク（questions テーブル）

## スキーマの要点

`schema.sql` の `questions` テーブル: `category`（大分類）, `sub_category`（単元、`questions.sub_category` の値は `src/data/practiceUnits.ts` の `subCategory` と完全一致させる）, `title`（任意、主に長文のタイトル）, `question_text`, `tables_json`（表問題）, `options`（JSON配列、ラベル無し）, `correct_answer`（0始まりインデックス）, `explanation`（JSON配列、解説ステップごとに1要素）, `difficulty`（1〜5）, `status`（'draft'|'published'|'archived'）, `originality_note`, `passage_group_id`（任意）, `image_data_uri`（任意）, `is_mock_only`（デフォルト0）。

選択肢ラベル（A〜E）はAPI側（`functions/_lib/questionFormat.ts`の`toClientQuestion()`）でインデックス順に付与する。DBには`options`をラベル無しJSON配列として保持する。

## category / sub_category の命名規則（テスト種別ごと）

`src/data/practiceUnits.ts` の `PRACTICE_UNIT_GROUPS_BY_TEST` が唯一の正とする定義。新しい問題を追加する前に必ずこのファイルで対象の `category`/`subCategory` を確認すること（**この値と1文字でもズレるとその問題はUIに一切表示されない**）。

- **SPI**: `category` は `non_verbal`（推論／損益算／集合／割合・比／場合の数・確率／速さ・時間・距離／資料の読み取り／仕事算／分割払い／濃度算）, `verbal`（二語の関係／熟語の成り立ち／語彙／語句の用法／文の並べ替え／長文読解、いずれも`memorization:true`扱いだが長文読解のみ対象外）, `structural`（文章の構造化／分類・グループ化）, `english`（語意（同意語・反意語）／英英辞典／空欄補充／長文読解（英語））。
- **玉手箱**: `category` は `tamatebako_math`（四則逆算／図表の読み取り／表の空欄推測）, `tamatebako_verbal`（論理的読解 GAB形式／趣旨判定 IMAGES形式／趣旨把握）, `tamatebako_english`（論理的読解 GAB形式／長文読解 IMAGES形式）。**SPIの`non_verbal`/`verbal`/`english`とは意図的に別名にしている**（テスト種別をまたぐ集計ロジックが混同しないようにするため）。
- **TG-WEB**: `tgweb_traditional_verbal`（空欄補充／並べ替え）, `tgweb_traditional_nonverbal`, `tgweb_new_verbal`（同義語・対義語／ことわざ／慣用句／四字熟語）, `tgweb_new_nonverbal`, `tgweb_english`。
- **GAB/C-GAB**: `gab_verbal`, `gab_quantitative`, `gab_english`（長文読解）。
- **SCOA**: `scoa_language`（本番模試で唯一実データがある分野）。数理・論理・常識・英語（`scoa_math`/`scoa_logic`/`scoa_common_sense`/`scoa_english`）は将来分野で実データなし。

新しいテスト種別・大分類を追加したら `functions/_lib/questionFormat.ts` の `CATEGORY_CODE` にも接頭辞を追記すること（未登録でも動作は壊れないが、`#SPI-NV-005`のような問題IDバッジが表示されなくなるだけ）。

## 問題の投入方法

**管理者用問題追加API** `POST /api/admin/questions`（`x-admin-token`ヘッダー必須、`ADMIN_API_TOKEN`と一致させる）。単発オブジェクトまたは `{questions: [...]}` の一括どちらも受け付ける。選択肢は2〜5件の制限がある（超える場合はこのAPIを使えないので生SQLで直接INSERTする）。

**大量投入の定番フロー**（Downloads配下等にユーザーがMarkdown等で問題を提供してきた場合）:
1. ソースの形式を確認し、`scripts/seed-<内容>.mts` としてNode.js（`node:fs`）でパースするスクリプトを書く（既存の `scripts/seed-*.mts` に多数の実例があるので、似た形式のものを参考にする）。
2. 選択肢は必ずシャッフルしてから投入する（元データの正解が特定の記号に偏っていることが多く、実際に過去のバッチで「正解が常にA/B」という偏りが発覚した実例がある）。`correctAnswer`もシャッフル後のインデックスに再計算すること。
3. `originality_note` は市販本の文章を書き写さず、「ユーザー提供のオリジナル問題（...）。市販教材・書籍からの引用なし。」のような一文を記録する。
4. `{questions: [...]}` 形式のJSONを生成し、まずローカルD1（`npm run pages:dev` 起動後、`curl -X POST http://127.0.0.1:8788/api/admin/questions`）で投入・`GET /api/questions`で取得確認する。
5. 本番へは `wrangler d1 execute --remote` 経由のcurlが自動モードの安全フィルタでブロックされることがあるため、その場合はJSONをSQLの`INSERT`文に変換し（`node`のワンショットスクリプトで `INSERT INTO questions (...) VALUES (...)` を生成）、`npx wrangler d1 execute webtest-db --remote --file=<生成したsql>` で適用する。適用後は`SELECT COUNT(*)`で件数を突き合わせ、`GROUP BY question_text HAVING COUNT(*)>1`で重複が無いか確認する。
6. 生成したパーサースクリプト・JSON・SQLは**コミットしない**（既存の`scripts/seed-*.mts`と同じ運用、一度きりの投入アーティファクトのため）。

**wrangler d1 executeが「Network connection lost」で失敗した場合**: D1は失敗時に自動的に元の状態へロールバックする仕様。件数やサンプル行を`SELECT`で確認し、実際に書き込まれていないことを確認してから同じファイルで安全に再試行できる。

## 長文のグループ出題（passage_group_id）

同じ長文（パッセージ）から出題される複数の設問を常に連続して出題したい場合、対象の全行に同一の`passage_group_id`（整数）を割り当てる。`GET /api/questions`（`functions/api/questions.ts`）は、SQLレベルの`ORDER BY RANDOM()`ではなく**アプリケーション側でグループ化してからグループ単位でシャッフルし、グループ内は`id`昇順を保つ**方式になっている。`passage_group_id`が無い問題は自分の`id`を仮のグループキーとして扱われ、従来通り1問単位でランダム出題される（後方互換）。

新しく長文バッチを追加する際は、既存の最大`passage_group_id`と衝突しない範囲（例: 20001〜）を使うこと。`SELECT MAX(passage_group_id) FROM questions`で事前に確認する。

## 画像問題（image_data_uri）

R2等の外部オブジェクトストレージは未導入のため、グラフ等の画像は`data:image/png;base64,...`形式のdata URIをそのままD1の`TEXT`カラム（`image_data_uri`）に保存する方式。画像1枚あたり40〜100KB程度が目安。大量に追加する場合はD1容量・レスポンスサイズの観点からR2導入を検討すべき。フロント側は`next/image`が静的エクスポート+data URIと相性が悪いため、素の`<img>`タグ（eslint-disableコメント付き）を使う。

## is_mock_only（模試専用フラグ）

`GET /api/questions`はデフォルトで`is_mock_only=0`（練習問題プール）のみを対象にする。`?mockOnly=1`を指定すると模試専用問題のみが対象になる。本番模試（`/test`）専用に問題プールを分離したい場合に使う（現状SCOAのみこの分離運用、他テストは全問`is_mock_only=0`）。

`GET /api/question-units`（単元選択画面の収録問題数バッジ）は2026-09-13よりCloudflareのCache APIで5分間キャッシュしている（`cloudflare-pages-gotchas`スキル参照）。新しい問題を`published`にした直後、本番でバッジの件数が最大5分ほど反映されないことがあるが仕様通り（動作確認時は`?`付きの別クエリではキャッシュキーが変わらないので、キャッシュを避けたい場合は`wrangler pages deployment tail`等で実際のDB件数を直接確認すること）。

## src/data/questions.ts が型定義しか持たない理由

2026-08-21に`src/data/questions.ts`にハードコードしていたSPI問題を`questions`テーブル（D1）へ完全移行した。移行後、配列本体は削除し`Question`/`TableBlock`の**型定義のみ**を残している（`/test`が今もこの型をクライアント側の形状として使うため）。移行に使った`scripts/generate-seed-questions.mts`は二度と実行できない一度きりの移行アーティファクトで、`tsconfig.json`の`exclude`によりNext.jsのビルド時型チェック対象から外されている。**この型ファイルにデータの配列が無いのは意図的であり、バグではない。**

## 過去に実際に起きた事故と教訓

- **`/test`へのカテゴリ漏れ**: `app/test/page.tsx`（本番模試＝SPI3専用のはず）が`GET /api/questions`を**カテゴリ絞り込み無しで**呼んでいたため、玉手箱等の新カテゴリを`published`にした瞬間、SPIの本番模試に他テストの問題が混入する状態になっていた。`SPI_CATEGORIES = ["verbal","non_verbal","structural","english"]`を明示的に`?category=`として渡すよう修正済み。**新しいテスト種別のデータを`published`にする際は、`/test`（`testType`によるフィルタ機構が無い）への意図しない混入が起きないか必ず確認すること。**
- **Pages Functionsの入れ子ルート404**: `functions/api/questions/units.ts`（`functions/api/questions.ts`と同名ベースのディレクトリ）を作ったところ、本番デプロイ後に404になった（Cloudflare Pages Functionsは「同名ファイルとディレクトリの共存」非対応、ローカルの`wrangler pages dev`では気づけない）。フラットな`functions/api/question-units.ts`（ハイフン区切り）に改名して解決。**新しい入れ子ルートを作る際は、同じベース名の`.ts`ファイルが既に存在しないか確認し、可能ならデプロイ後に本番URLへ直接curlして確認すること。**
