// 円の内部に弦を引いたときの領域分割数を視覚的に示す図。TG-WEBの「図形の分割数」問題
// （tgweb_traditional_math / 図形問題）の解説用。座標は scripts/generate-circle-chords-svg.mjs
// で「弦同士の交点が十分離れていて見やすい」配置を探索し、静的に埋め込んだもの
// （実行時にジオメトリ計算はしない）。3本の弦はID:5185とID:5186で共通にし、
// ID:5186では4本目（オレンジ）を追加した図として見た目の連続性を持たせている。
type Point = [number, number];

const CHORDS_3: Point[][] = [
  [
    [57.7, 20.6],
    [107.8, 189.7],
  ],
  [
    [174.5, 49.6],
    [38.2, 165.4],
  ],
  [
    [189.8, 106.5],
    [26.7, 47.8],
  ],
];

const CHORD_4: Point[] = [
  [40.2, 167.3],
  [129.2, 14.9],
];

const LABELS_3: Point[] = [
  [51, 44],
  [113, 45],
  [167, 80],
  [97, 91],
  [46, 104],
  [137, 135],
  [77, 162],
];

const LABELS_4: Point[] = [
  [91, 37],
  [51, 44],
  [134, 53],
  [82, 78],
  [167, 80],
  [101, 95],
  [42, 101],
  [71, 127],
  [137, 135],
  [77, 162],
  [41, 164],
];

const CHORD_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#f97316"]; // 赤・青・緑・オレンジ

export function CircleChordsDiagram({ lines }: { lines: 3 | 4 }) {
  const chords = lines === 4 ? [...CHORDS_3, CHORD_4] : CHORDS_3;
  const labels = lines === 4 ? LABELS_4 : LABELS_3;

  return (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto my-2 h-56 w-56"
      role="img"
      aria-label={`円に弦を${lines}本引いて${labels.length}個の領域に分けた図`}
    >
      <circle cx={100} cy={100} r={90} stroke="#374151" strokeWidth={2} fill="none" />
      {chords.map((chord, i) => (
        <line
          key={i}
          x1={chord[0][0]}
          y1={chord[0][1]}
          x2={chord[1][0]}
          y2={chord[1][1]}
          stroke={CHORD_COLORS[i]}
          strokeWidth={2}
        />
      ))}
      {labels.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={8} fill="white" opacity={0.85} />
          <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#111827">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
