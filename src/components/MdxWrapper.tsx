import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CallToActionCTA } from "@/src/components/CallToActionCTA";
import { ChatBubble } from "@/src/components/ChatBubble";
import { PointBox } from "@/src/components/PointBox";
import { CheckList, CheckItem } from "@/src/components/CheckList";

// MDX本文中から直接呼び出せるコンポーネント一覧。新しいカスタムコンポーネントを
// MDX記事内で使いたい場合はここに追加すること。
const MDX_COMPONENTS = { CallToActionCTA, ChatBubble, PointBox, CheckList, CheckItem };

// SEOブログ記事（MDX）を描画する共通コンポーネント。Server Component（RSC）として動作し、
// Next.jsの静的エクスポート（output: "export"）でもビルド時にレンダリングされる。
// 数式はremark-math（$...$ / $$...$$記法をASTへ）+ rehype-katex（KaTeXでHTML化）で処理する。
export function MdxWrapper({ source }: { source: string }) {
  return (
    <article className="prose prose-blue max-w-none">
      <MDXRemote
        source={source}
        components={MDX_COMPONENTS}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
          },
        }}
      />
    </article>
  );
}
