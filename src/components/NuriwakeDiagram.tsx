// 「塗り分け」記事用の図解。実際にDBへ投入済みの問題（id:2071-2074）のSVGをそのまま流用し、
// 領域の隣接構造（鎖状／輪状／中心型／2つの三角形）を示す。
// 静的な自社作成SVG文字列（ユーザー入力ではない）をdangerouslySetInnerHTMLで描画する。
const DIAGRAMS: Record<string, string> = {
  chain: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 100" width="340" height="106">
<rect x="10" y="10" width="70" height="80" fill="#fff" stroke="#333"/><text x="38" y="55" font-size="18">A</text>
<rect x="80" y="10" width="70" height="80" fill="#fff" stroke="#333"/><text x="108" y="55" font-size="18">B</text>
<rect x="150" y="10" width="70" height="80" fill="#fff" stroke="#333"/><text x="178" y="55" font-size="18">C</text>
<rect x="220" y="10" width="70" height="80" fill="#fff" stroke="#333"/><text x="248" y="55" font-size="18">D</text>
</svg>`,
  cycle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="180" height="180">
<rect x="10" y="10" width="90" height="90" fill="#fff" stroke="#333"/><text x="45" y="65" font-size="18">A</text>
<rect x="100" y="10" width="90" height="90" fill="#fff" stroke="#333"/><text x="135" y="65" font-size="18">B</text>
<rect x="100" y="100" width="90" height="90" fill="#fff" stroke="#333"/><text x="135" y="155" font-size="18">C</text>
<rect x="10" y="100" width="90" height="90" fill="#fff" stroke="#333"/><text x="45" y="155" font-size="18">D</text>
</svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" width="220" height="220">
<rect x="90" y="10" width="80" height="80" fill="#fff" stroke="#333"/><text x="122" y="58" font-size="18">A</text>
<rect x="170" y="90" width="80" height="80" fill="#fff" stroke="#333"/><text x="202" y="138" font-size="18">B</text>
<rect x="90" y="170" width="80" height="80" fill="#fff" stroke="#333"/><text x="122" y="218" font-size="18">C</text>
<rect x="10" y="90" width="80" height="80" fill="#fff" stroke="#333"/><text x="42" y="138" font-size="18">D</text>
<rect x="90" y="90" width="80" height="80" fill="#fdf3e0" stroke="#333"/><text x="122" y="138" font-size="18">O</text>
</svg>`,
  twinTriangle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220" width="300" height="220">
<polygon points="150,20 60,180 150,127" fill="#fff" stroke="#333"/><text x="110" y="120" font-size="17">A</text>
<polygon points="60,180 240,180 150,127" fill="#fff" stroke="#333"/><text x="145" y="168" font-size="17">B</text>
<polygon points="240,180 150,20 150,127" fill="#fff" stroke="#333"/><text x="175" y="120" font-size="17">C</text>
<polygon points="150,20 60,180 15,110" fill="#fdf3e0" stroke="#333"/><text x="55" y="115" font-size="16">D</text>
<polygon points="150,20 240,180 285,110" fill="#fdf3e0" stroke="#333"/><text x="235" y="115" font-size="16">E</text>
</svg>`,
};

export function NuriwakeDiagram({ variant }: { variant: "chain" | "cycle" | "star" | "twinTriangle" }) {
  return (
    <div
      className="mx-auto my-4 w-full max-w-xs [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: DIAGRAMS[variant] }}
    />
  );
}
