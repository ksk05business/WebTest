// 「図形の組み合わせ」記事用の図解。実際にDBへ投入済みの問題（id:2067,2068）のSVGをそのまま流用し、
// 直角二等辺三角形1枚の角度と、2枚を組み合わせた例を示す。
// 静的な自社作成SVG文字列（ユーザー入力ではない）をdangerouslySetInnerHTMLで描画する。
const DIAGRAMS: Record<string, string> = {
  singlePiece: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="140" height="105">
<polygon points="10,80 90,80 90,10" fill="#dbe9f7" stroke="#2b5f9e" stroke-width="2"/>
<text x="20" y="72" font-size="11">45°</text>
<text x="70" y="30" font-size="11">45°</text>
<text x="78" y="76" font-size="11">90°</text>
</svg>`,
  twoPieces: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="220" height="132">
<polygon points="20,100 100,100 100,20" fill="#dbe9f7" stroke="#2b5f9e" stroke-width="2"/>
<polygon points="100,100 180,100 100,20" fill="#f7e3c4" stroke="#c07a2b" stroke-width="2"/>
</svg>`,
};

export function KumiawaseDiagram({ variant }: { variant: "singlePiece" | "twoPieces" }) {
  return (
    <div
      className="mx-auto my-4 w-full max-w-xs [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: DIAGRAMS[variant] }}
    />
  );
}
