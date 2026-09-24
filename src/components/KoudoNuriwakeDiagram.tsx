// 「高難度の塗り分け・敷き詰め」記事用の図解。rectTilingは実際にDBへ投入済みの問題
// （id:5213、直角三角形2枚→3×4長方形の例）のSVGをそのまま流用する。cyclicRing（環状の
// 隣接関係）・bowtie（2つの三角形が1点を共有する構造）・lcmCube（最小公倍数で立方体を作る
// イメージ）は、対応する実問題（id:5212, 5214, 5215）に画像が無いため新規に描画する。
const REUSED_DIAGRAMS: Record<string, string> = {
  rectTiling: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 101" width="130" height="101"><rect x="0" y="0" width="130" height="101" fill="#ffffff"/><svg x="0" y="0" width="130" height="101" viewBox="0 0 90 70">
<polygon points="10,60 70,60 10,10" fill="#dbe9f7" stroke="#2b5f9e"/>
<polygon points="70,60 10,10 70,10" fill="#f7e3c4" stroke="#c07a2b"/>
</svg></svg>`,
};

const RING_LABELS = ["A", "B", "C", "D", "E", "F"];

function CyclicRing() {
  const cx = 110;
  const cy = 100;
  const rOuter = 90;
  const rInner = 40;
  const n = RING_LABELS.length;
  const wedges = RING_LABELS.map((label, i) => {
    const a0 = (Math.PI * 2 * i) / n - Math.PI / 2;
    const a1 = (Math.PI * 2 * (i + 1)) / n - Math.PI / 2;
    const x0o = cx + rOuter * Math.cos(a0);
    const y0o = cy + rOuter * Math.sin(a0);
    const x1o = cx + rOuter * Math.cos(a1);
    const y1o = cy + rOuter * Math.sin(a1);
    const x0i = cx + rInner * Math.cos(a0);
    const y0i = cy + rInner * Math.sin(a0);
    const x1i = cx + rInner * Math.cos(a1);
    const y1i = cy + rInner * Math.sin(a1);
    const am = (a0 + a1) / 2;
    const rm = (rOuter + rInner) / 2;
    const xm = cx + rm * Math.cos(am);
    const ym = cy + rm * Math.sin(am);
    return (
      <g key={label}>
        <path
          d={`M ${x0i} ${y0i} L ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 0 0 ${x0i} ${y0i} Z`}
          fill={i % 2 === 0 ? "#dbe9f7" : "#fdf3e0"}
          stroke="#333"
          strokeWidth={1.5}
        />
        <text x={xm} y={ym + 6} fontSize={18} textAnchor="middle" fontWeight="bold" fill="#333">
          {label}
        </text>
      </g>
    );
  });
  return (
    <svg viewBox="0 0 220 200" className="mx-auto my-4 h-auto w-full max-w-xs">
      {wedges}
    </svg>
  );
}

function Bowtie() {
  return (
    <svg viewBox="0 0 260 140" className="mx-auto my-4 h-auto w-full max-w-xs">
      <polygon points="70,20 20,120 120,120" fill="#fdf3e0" stroke="#333" strokeWidth={1.5} />
      <polygon points="190,20 140,120 240,120" fill="#dbe9f7" stroke="#333" strokeWidth={1.5} />
      <text x="70" y="45" fontSize={17} textAnchor="middle" fontWeight="bold" fill="#333">
        A
      </text>
      <text x="45" y="105" fontSize={17} textAnchor="middle" fontWeight="bold" fill="#333">
        B
      </text>
      <text x="130" y="80" fontSize={17} textAnchor="middle" fontWeight="bold" fill="#c0392b">
        C
      </text>
      <text x="215" y="105" fontSize={17} textAnchor="middle" fontWeight="bold" fill="#333">
        D
      </text>
      <text x="190" y="45" fontSize={17} textAnchor="middle" fontWeight="bold" fill="#333">
        E
      </text>
    </svg>
  );
}

function LcmCube() {
  const rows: { label: string; unit: number; times: number }[] = [
    { label: "縦", unit: 2, times: 21 },
    { label: "横", unit: 3, times: 14 },
    { label: "高さ", unit: 7, times: 6 },
  ];
  return (
    <svg viewBox="0 0 320 150" className="mx-auto my-4 h-auto w-full max-w-sm">
      {rows.map((r, i) => {
        const y = 20 + i * 45;
        return (
          <g key={r.label}>
            <text x={0} y={y + 15} fontSize={14} fontWeight="bold" fill="#333">
              {r.label}
            </text>
            <rect x={40} y={y} width={18} height={22} fill="#dbe9f7" stroke="#2b5f9e" />
            <text x={49} y={y + 16} fontSize={11} textAnchor="middle" fill="#2b5f9e">
              {r.unit}
            </text>
            <text x={70} y={y + 16} fontSize={16} fill="#333">
              ×{r.times}
            </text>
            <text x={130} y={y + 16} fontSize={16} fill="#333">
              =
            </text>
            <rect x={150} y={y} width={140} height={22} fill="#f7e3c4" stroke="#c07a2b" />
            <text x={220} y={y + 16} fontSize={13} textAnchor="middle" fill="#c07a2b" fontWeight="bold">
              42
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function KoudoNuriwakeDiagram({
  variant,
}: {
  variant: "rectTiling" | "cyclicRing" | "bowtie" | "lcmCube";
}) {
  if (variant === "cyclicRing") return <CyclicRing />;
  if (variant === "bowtie") return <Bowtie />;
  if (variant === "lcmCube") return <LcmCube />;
  return (
    <div
      className="mx-auto my-4 w-full max-w-xs [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: REUSED_DIAGRAMS[variant] }}
    />
  );
}
