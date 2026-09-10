"use client";

import { useEffect, useState } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import { MDX_COMPONENTS, MDX_REMARK_PLUGINS, MDX_REHYPE_PLUGINS } from "@/src/components/MdxWrapper";

type MDXContentComponent = React.ComponentType<{ components?: Record<string, unknown> }>;

// 管理画面のブログ記事編集・新規作成モーダルで、本文（MDX文字列）をブラウザ上でリアルタイムに
// コンパイル・描画するプレビュー。本番の記事描画（src/components/MdxWrapper.tsx、
// next-mdx-remote/rsc・サーバーコンポーネント）とは実行環境が異なる（こちらは@mdx-js/mdxの
// evaluate()でブラウザ内コンパイル）ため実装は完全に別物だが、remark/rehypeプラグイン設定と
// カスタムコンポーネント一覧はMdxWrapper.tsxから直接importして共有し、見た目が本番と
// ずれないようにしている。
export function MdxLivePreview({ source }: { source: string }) {
  const [Content, setContent] = useState<MDXContentComponent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!source.trim()) {
        setContent(null);
        setError(null);
        return;
      }
      evaluate(source, {
        ...jsxRuntime,
        remarkPlugins: MDX_REMARK_PLUGINS,
        rehypePlugins: MDX_REHYPE_PLUGINS,
      })
        .then(({ default: MDXContent }) => {
          if (cancelled) return;
          setContent(() => MDXContent as MDXContentComponent);
          setError(null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setContent(null);
          setError(e instanceof Error ? e.message : "プレビューの生成に失敗しました");
        });
      // 400ms のデバウンス。1文字入力するたびにMDXを再コンパイルすると重くなるため。
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">MDXのコンパイルでエラーが発生しました</p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{error}</pre>
      </div>
    );
  }

  if (!Content) {
    return <p className="p-4 text-sm text-gray-400">本文を入力するとここにプレビューが表示されます。</p>;
  }

  return (
    <article className="prose prose-blue max-w-none p-1">
      <Content components={MDX_COMPONENTS} />
    </article>
  );
}
