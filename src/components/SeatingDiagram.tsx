// TG-WEB従来型推論の「座席の位置関係」記事用。円卓（circle）と一列（row）の
// 2パターンに対応する。
//
// circle: 「Xの右隣はY」のような関係を1つの輪として見せることが目的のため、
// 実際に着席した人が中心を向いたときの物理的な左右（＝画面上では反時計回りが右隣になる）
// までは表現せず、「orderで渡した並び順どおりに矢印（→）でつないだら1周する」という
// 論理的なつながりだけを図示する（キャプションで「→は右隣の関係」であることを明記する）。
// 矢印の向きを画面の時計回り/反時計回りのどちらにするかで悩まず済むよう、あえてこの設計にした。
//
// row: 座席番号付きの一列を左から右へ並べるだけのシンプルな図。
//
// MDX経由で使うため、配列・オブジェクトではなく区切り文字（デフォルト","）で連結した
// 1本の文字列でpropsを受け取る。
function polarPoint(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

export function SeatingDiagram({
  type,
  order,
  seatNumbers,
  separator = ",",
  caption,
}: {
  type: "circle" | "row";
  order: string;
  seatNumbers?: string;
  separator?: string;
  caption?: string;
}) {
  const names = order.split(separator).map((s) => s.trim()).filter(Boolean);

  if (type === "row") {
    const numbers = seatNumbers
      ? seatNumbers.split(separator).map((s) => s.trim())
      : names.map((_, i) => String(i + 1));
    return (
      <div className="not-prose my-6 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {names.map((name, i) => (
            <div key={i} className="flex w-12 flex-col items-center gap-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-gray-300 bg-white text-base font-bold text-gray-900">
                {name}
              </div>
              <span className="text-[10px] text-gray-400">{numbers[i]}番</span>
            </div>
          ))}
        </div>
        {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
      </div>
    );
  }

  const n = names.length;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 26;
  const rArrow = rOuter - 30;
  const startAngle = -Math.PI / 2;
  const step = (2 * Math.PI) / n;
  const inset = Math.min(0.28, step * 0.28);

  const points = names.map((_, i) => polarPoint(cx, cy, rOuter, startAngle + i * step));
  const arcs = names.map((_, i) => {
    const a1 = startAngle + i * step + inset;
    const a2 = startAngle + ((i + 1) % n) * step - inset + (i === n - 1 ? 2 * Math.PI : 0);
    const p1 = polarPoint(cx, cy, rArrow, a1);
    const p2 = polarPoint(cx, cy, rArrow, a2);
    return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${rArrow} ${rArrow} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  });

  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="absolute inset-0"
        >
          <defs>
            <marker id="seatArrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#60a5fa" />
            </marker>
          </defs>
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="4 4" />
          {arcs.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#60a5fa" strokeWidth={2} markerEnd="url(#seatArrowhead)" />
          ))}
        </svg>
        {points.map((p, i) => (
          <div
            key={i}
            className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-base font-bold text-gray-900"
            style={{ left: p.x, top: p.y }}
          >
            {names[i]}
          </div>
        ))}
      </div>
      {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
    </div>
  );
}
