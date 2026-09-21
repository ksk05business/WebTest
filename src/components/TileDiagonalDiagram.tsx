// TG-WEBの「タイルと対角線」問題（tgweb_traditional_math / 図形問題）の解説用。
// 縦2マス×横3マスの長方形に左上から右下へ対角線を引いた例を固定で描画する。
// 対角線が通る4マス（W+H-GCD(W,H) = 3+2-1 = 4）をハイライトし、公式の意味を視覚化する。
const COLS = 3;
const ROWS = 2;
const CELL = 70;
const PAD = 15;

// 対角線が実際に通過するマス（列, 行）。row0=上段, row1=下段。
const HIGHLIGHTED: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [2, 1],
];

function isHighlighted(col: number, row: number): boolean {
  return HIGHLIGHTED.some(([c, r]) => c === col && r === row);
}

export function TileDiagonalDiagram() {
  const width = COLS * CELL + PAD * 2;
  const height = ROWS * CELL + PAD * 2;

  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push(
        <rect
          key={`${col}-${row}`}
          x={PAD + col * CELL}
          y={PAD + row * CELL}
          width={CELL}
          height={CELL}
          fill={isHighlighted(col, row) ? "#fde68a" : "#ffffff"}
          stroke="#9ca3af"
          strokeWidth={1.5}
        />
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto my-4 h-auto w-full max-w-xs"
      role="img"
      aria-label="縦2マス×横3マスの長方形に対角線を引き、対角線が通る4マスをハイライトした図"
    >
      {cells}
      <line
        x1={PAD}
        y1={PAD}
        x2={PAD + COLS * CELL}
        y2={PAD + ROWS * CELL}
        stroke="#dc2626"
        strokeWidth={3}
      />
    </svg>
  );
}
