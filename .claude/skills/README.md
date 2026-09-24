# Skills 一覧（Webテストナビ）

このディレクトリは [Claude Code](https://claude.com/claude-code) の Skills 機能で使う、機能領域ごとの詳細ドキュメント集です。各サブディレクトリの `SKILL.md` に、その機能を触るときに必要な設計判断の経緯・DBスキーマの詳細・過去に実際に起きた障害の教訓がまとまっています。

`CLAUDE.md`（リポジトリ直下）にはプロジェクト全体で常に守るべき最小限の規約だけを置き、機能固有の詳細はすべてここに分離しています。

## 呼び出し方

- **自動読み込み（通常はこれでOK）**: Claude Codeが作業内容とここにある各skillの`description`を照合し、関連するskillを自動的に読み込みます。何もしなくても、該当する機能を触ろうとした時点で自動的に参照されます。
- **明示的に呼び出す**: チャットで `/<skill名>`（例: `/question-bank`）と入力すると、そのskillを明示的に読み込ませられます。「このskillの内容を踏まえて」と作業前に確認したい場合に使います。
- **人間が読む場合**: 各skillのリンク先（`<skill名>/SKILL.md`）をそのままGitHub上で開けば、Markdownとして読めます。

## 一覧

| skill | 説明 | こんな作業のときに読む |
|---|---|---|
| [`question-bank`](question-bank/SKILL.md) | D1の`questions`テーブル（問題バンク）の全体像 | 新しい問題の追加・投入、category/sub_category命名、長文のグループ出題、画像問題、模試専用問題、選択肢ラベル等クライアント側の型規約 |
| [`auth-sessions`](auth-sessions/SKILL.md) | ログイン・セッション認証・管理者トークン | 学生/企業向けAPIの認可ロジック、新しいAPIエンドポイントで「誰の操作か」を判定する処理を書くとき |
| [`scout-system`](scout-system/SKILL.md) | 企業→学生のスカウト機能（匿名2段階開示） | scoutsテーブル、同意設計、個人情報の第三者提供に関わる画面・APIを触るとき |
| [`company-platform`](company-platform/SKILL.md) | 企業アカウント（申請・審査・プロフィール・トークン課金・見積） | `/company/*`・`/admin/*`配下の画面、企業向け課金ロジックを触るとき |
| [`practice-review-modes`](practice-review-modes/SKILL.md) | 練習問題モード・本番模試モード・復習機能 | `/practice`・`/test`・`/review`、単元選択UI、忘却曲線ベースの復習ロジックを触るとき |
| [`student-registration`](student-registration/SKILL.md) | 学生の会員登録・ログイン・プロフィールフォーム | `/register`・`/login`・`/mypage`のフォーム項目・選択肢マッピングを触るとき |
| [`cloudflare-pages-gotchas`](cloudflare-pages-gotchas/SKILL.md) | Cloudflare Pages Functions・D1特有のハマりどころ | D1スキーマ変更・本番マイグレーション、Pages Functionsのルーティング追加、メール送信設定を触るとき |
| [`seo-blog-authoring`](seo-blog-authoring/SKILL.md) | SEOブログ（`/blog`）記事の執筆・MDXコンポーネント | `content/blog/*.mdx`の新規作成・編集、SEO/LLMO対応、MDXカスタムコンポーネントの追加をするとき |
| [`generate-short-script`](generate-short-script/SKILL.md) | SNSショート動画（TikTok/Shorts/Reels）の台本作成 | ショート動画の構成・台本を作るとき |
| [`frontend-architecture`](frontend-architecture/SKILL.md) | 各ページの役割分担・Tailwind CSSのスタイリング規約 | 新しいページの追加、既存ページの改修、UIの見た目調整をするとき |

## 新しいskillを追加するときのルール

- 1skill＝1機能領域。既存skillのどれにも収まらない新しい機能領域ができたら、新規ディレクトリ＋`SKILL.md`を作る（`name`/`description`のfrontmatterは既存skillの書式に合わせる）。
- `description`には「何を扱うか」と「どんな作業のときに読むべきか」を具体的に書く（Claude Codeがこの文字列で自動読み込みの判定をするため）。
- 新しいskillを作ったら、`CLAUDE.md`のskill一覧表とこのファイルの一覧表の両方に追記する。
