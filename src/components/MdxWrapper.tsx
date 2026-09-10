import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CallToActionCTA } from "@/src/components/CallToActionCTA";
import { ChatBubble } from "@/src/components/ChatBubble";
import { PointBox } from "@/src/components/PointBox";
import { CheckList, CheckItem } from "@/src/components/CheckList";
import { CarrollDiagram } from "@/src/components/CarrollDiagram";

// MDX本文中から直接呼び出せるコンポーネント一覧。新しいカスタムコンポーネントを
// MDX記事内で使いたい場合はここに追加すること。
// admin/MdxLivePreview.tsx（管理画面のリアルタイムプレビュー）でも全く同じ描画結果にするため、
// このコンポーネント一覧とremark/rehypeプラグイン設定をここから共有エクスポートする
// （2箇所で別々に保守すると設定がドリフトする恐れがあるため、必ずここを唯一の情報源とすること）。
export const MDX_COMPONENTS = { CallToActionCTA, ChatBubble, PointBox, CheckList, CheckItem, CarrollDiagram };
export const MDX_REMARK_PLUGINS = [remarkGfm, remarkMath];
export const MDX_REHYPE_PLUGINS = [rehypeKatex];

// SEOブログ記事（MDX）を描画する共通コンポーネント。Server Component（RSC）として動作し、
// Next.jsの静的エクスポート（output: "export"）でもビルド時にレンダリングされる。
// 数式はremark-math（$...$ / $$...$$記法をASTへ）+ rehype-katex（KaTeXでHTML化）で処理する。
// remark-gfmはテーブル記法（|列|列|）等のGitHub Flavored Markdown拡張を有効化する
// （標準のMDX/CommonMarkにはテーブル記法が含まれておらず、これが無いと`| a | b |`は
// 単なる地の文としてそのまま出力されてしまう。実際にこの不具合が発生し追加した）。
export function MdxWrapper({ source }: { source: string }) {
  return (
    <article className="prose prose-blue max-w-none">
      <MDXRemote
        source={source}
        components={MDX_COMPONENTS}
        options={{
          mdxOptions: {
            remarkPlugins: MDX_REMARK_PLUGINS,
            rehypePlugins: MDX_REHYPE_PLUGINS,
          },
        }}
      />
    </article>
  );
}
