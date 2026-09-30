// 推論記事（命題の対偶、駅伝の順位、不等号の順位など）で使う「A→B→C」のような
// 鎖状の関係を横並びの箱＋矢印で見せる汎用コンポーネント。矢印の記号（→や＞）を
// 変えるだけで、命題の含意チェーンにも大小関係の順位チェーンにも使い回せる。
// MDX（next-mdx-remote/rsc）経由で使うため、他コンポーネント同様に配列やオブジェクトを
// propsとして渡さず、区切り文字（デフォルト全角読点「、」）で連結した1本の文字列で受け取る。
export function ChainDiagram({
  items,
  separator = ",",
  arrow = "→",
  caption,
}: {
  items: string;
  separator?: string;
  arrow?: string;
  caption?: string;
}) {
  const nodes = items.split(separator).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex min-h-11 items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-center text-sm font-bold leading-snug text-gray-900">
              {node}
            </div>
            {i < nodes.length - 1 && (
              <span className="text-lg font-bold text-blue-500">{arrow}</span>
            )}
          </div>
        ))}
      </div>
      {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
    </div>
  );
}
