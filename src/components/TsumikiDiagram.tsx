// 「積み木の個数」記事用の図解。実際にDBへ投入済みの問題（id:5207,5208）のSVGをそのまま流用し、
// 真上から見た段数の図、および真上から見た図（×）＋正面から見た図（最大段数）を示す。
// 静的な自社作成SVG文字列（ユーザー入力ではない）をdangerouslySetInnerHTMLで描画する。
const DIAGRAMS: Record<string, string> = {
  grid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><rect x="0" y="0" width="160" height="160" fill="#ffffff"/><svg x="0" y="0" width="160" height="160" viewBox="0 0 130 130">
<rect x="10" y="10" width="40" height="40" fill="#fff" stroke="#333"/><text x="26" y="35" font-size="18">2</text>
<rect x="50" y="10" width="40" height="40" fill="#fff" stroke="#333"/><text x="66" y="35" font-size="18">1</text>
<rect x="90" y="10" width="40" height="40" fill="#fff" stroke="#333"/><text x="106" y="35" font-size="18">3</text>
<rect x="10" y="50" width="40" height="40" fill="#fff" stroke="#333"/><text x="26" y="75" font-size="18">1</text>
<rect x="50" y="50" width="40" height="40" fill="#fff" stroke="#333"/><text x="66" y="75" font-size="18">4</text>
<rect x="90" y="50" width="40" height="40" fill="#fff" stroke="#333"/><text x="106" y="75" font-size="18">2</text>
<rect x="10" y="90" width="40" height="40" fill="#fff" stroke="#333"/><text x="26" y="115" font-size="18">3</text>
<rect x="50" y="90" width="40" height="40" fill="#fff" stroke="#333"/><text x="66" y="115" font-size="18">2</text>
<rect x="90" y="90" width="40" height="40" fill="#fff" stroke="#333"/><text x="106" y="115" font-size="18">1</text>
</svg></svg>`,
  topFront: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150" width="320" height="150"><rect x="0" y="0" width="320" height="150" fill="#ffffff"/><svg x="0" y="0" width="150" height="150" viewBox="0 0 130 130">
<rect x="10" y="10" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="26" y="35" font-size="18">×</text>
<rect x="50" y="10" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="66" y="35" font-size="18">×</text>
<rect x="90" y="10" width="40" height="40" fill="#fff" stroke="#333"/>
<rect x="10" y="50" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="26" y="75" font-size="18">×</text>
<rect x="50" y="50" width="40" height="40" fill="#fff" stroke="#333"/>
<rect x="90" y="50" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="106" y="75" font-size="18">×</text>
<rect x="10" y="90" width="40" height="40" fill="#fff" stroke="#333"/>
<rect x="50" y="90" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="66" y="115" font-size="18">×</text>
<rect x="90" y="90" width="40" height="40" fill="#dbe9f7" stroke="#333"/><text x="106" y="115" font-size="18">×</text>
</svg><svg x="170" y="0" width="150" height="69" viewBox="0 0 130 60">
<rect x="10" y="10" width="40" height="40" fill="#f7e3c4" stroke="#333"/><text x="26" y="35" font-size="18">3</text>
<rect x="50" y="10" width="40" height="40" fill="#f7e3c4" stroke="#333"/><text x="66" y="35" font-size="18">2</text>
<rect x="90" y="10" width="40" height="40" fill="#f7e3c4" stroke="#333"/><text x="106" y="35" font-size="18">2</text>
</svg></svg>`,
};

export function TsumikiDiagram({ variant }: { variant: "grid" | "topFront" }) {
  return (
    <div
      className="mx-auto my-4 w-full max-w-xs [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: DIAGRAMS[variant] }}
    />
  );
}
