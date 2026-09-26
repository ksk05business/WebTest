# Webテストナビ（shukatsu-webtest.com）

新卒向けのWebテスト対策アプリです。SPI3・玉手箱・TG-WEB・GAB/C-GAB・CAB・SCOAといった主要な適性検査の練習問題・模試を無料で提供しつつ、学生の学習データをもとに企業から学生へスカウトを届ける「2段階開示型」の逆求人機能を持つ、個人開発・運用中のWebサービスです。

## 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| フロントエンド | Next.js（App Router, `output: "export"` 静的サイト）/ TypeScript / Tailwind CSS |
| バックエンド | Cloudflare Pages Functions（エッジ関数）/ Cloudflare D1（SQLite互換のエッジDB） |
| 認証 | 自前実装（PBKDF2によるパスワードハッシュ化、セッション管理、メールOTPによるパスワード再設定、Google/LINEログイン連携） |
| CI/CD | GitHub Actions（push/PR時の型チェック・ビルド自動実行）、Cloudflare Pagesによる自動デプロイ |
| その他 | Cloudflare KVを使ったレートリミット（外部APIの従量課金保護）、Cloudflare Email Sending、PDF自動生成（見積書） |

## 主な機能

- **模試・練習問題エンジン**: 6種類のWebテスト形式に対応した1,000問超の問題プール。長文パッセージ単位のグループ出題、表・画像を含む問題形式にも対応（SPI3・SCOAは本番形式の模試、その他は単元別の練習問題として提供）。
- **忘却曲線ベースの復習機能**: エビングハウスの忘却曲線を踏まえ、間違えた問題を最適なタイミングで自動的に再出題するアルゴリズムを実装。
- **2段階開示型スカウト機能**: 個人情報保護法・職業安定法上の論点を踏まえ、学生本人の明示的な同意なしには個人を特定できる情報を企業へ渡さない設計。
- **企業向け管理画面**: 利用審査・承認フロー、トークン課金、候補者検索、見積書PDFの自動生成。
- **SEO/LLMOを意識したブログ基盤**: MDXベースの記事管理、構造化データ（JSON-LD、FAQPage）を実装し、検索エンジンだけでなくAI検索クローラー（GPTBot等）からの参照も意識。

## 設計上の工夫

- 静的サイト出力（`output: "export"`）とエッジ関数を組み合わせ、ホスティングコストを抑えながら会員登録・模試採点・スカウトといった動的機能を実現。
- 外部の有料DBサービスを使わず、Cloudflare D1のみでデータ永続化を完結させている。
- 個人開発ゆえの保守性確保のため、「肥大化したファイルは分割する」「重複ロジックは共通化する」といった開発ルールを明文化し、AIコーディングエージェント（Claude Code）と協働しながら開発している。

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
