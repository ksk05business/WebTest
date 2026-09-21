// TG-WEBの「正十二面体の展開図」問題（tgweb_traditional_math / 図形問題）の解説用。
// 座標は scripts/seed_tgweb_dodecahedron_net_10.json（DB投入済みの実問題、面11→面4が正解の設問）の
// imageDataUriをデコードして得た実際の展開図の座標をそのまま使用（実行時にジオメトリ計算はしない）。
// 面1（中心）／面2〜6（内側の輪）／面7〜11（外側の輪）／面12（頂点）という構造で、
// 面11（基準）をオレンジ、面6・2（隣り合う内側の輪）を薄黄、面4（向かい合う正解）を赤でハイライトする。
type Face = {
  num: number;
  points: string;
  label: [number, number];
};

const FACES: Face[] = [
  { num: 1, points: "231.8,277.5 283.7,277.5 299.7,326.8 257.7,357.4 215.7,326.8", label: [257.7, 318.2] },
  { num: 2, points: "189.8,247.0 205.8,197.6 257.7,197.6 273.8,247.0 231.8,277.5", label: [231.8, 238.3] },
  { num: 3, points: "325.7,247.0 367.7,277.5 351.6,326.8 299.7,326.8 283.7,277.5", label: [325.7, 296.1] },
  { num: 4, points: "309.6,357.4 325.7,406.7 283.7,437.2 241.7,406.7 257.7,357.4", label: [283.7, 398.1] },
  { num: 5, points: "189.8,406.7 173.7,357.4 215.7,326.8 257.7,357.4 241.7,406.7", label: [215.7, 376.0] },
  { num: 6, points: "147.8,277.5 189.8,247.0 231.8,277.5 215.7,326.8 163.8,326.8", label: [189.8, 296.1] },
  { num: 7, points: "205.8,197.6 189.8,148.2 231.8,117.7 273.8,148.2 257.7,197.6", label: [231.8, 166.9] },
  { num: 8, points: "163.8,68.3 147.8,117.7 95.8,117.7 79.8,68.3 121.8,37.8", label: [121.8, 87.0] },
  { num: 9, points: "267.6,486.6 215.7,486.6 199.7,437.2 241.7,406.7 283.7,437.2", label: [241.7, 455.9] },
  { num: 10, points: "121.8,197.6 105.8,247.0 53.8,247.0 37.8,197.6 79.8,167.1", label: [79.8, 216.2] },
  { num: 11, points: "163.8,167.1 205.8,197.6 189.8,247.0 137.8,247.0 121.8,197.6", label: [163.8, 216.2] },
  { num: 12, points: "147.8,117.7 163.8,167.1 121.8,197.6 79.8,167.1 95.8,117.7", label: [121.8, 158.4] },
];

const BASE_FACE = 11;
const ADJACENT_INNER_FACES = [6, 2];
const OPPOSITE_FACE = 4;

function faceStyle(num: number): { fill: string; stroke: string; text: string } {
  if (num === BASE_FACE) return { fill: "#f7e3c4", stroke: "#c07a2b", text: "#7a4a12" };
  if (num === OPPOSITE_FACE) return { fill: "#fecaca", stroke: "#dc2626", text: "#7f1d1d" };
  if (ADJACENT_INNER_FACES.includes(num)) return { fill: "#fef9c3", stroke: "#ca8a04", text: "#713f12" };
  return { fill: "#f4f4f4", stroke: "#aaa", text: "#333" };
}

export function DodecahedronNetDiagram() {
  return (
    <svg
      viewBox="0 0 405.5 524.4"
      className="mx-auto my-4 h-auto w-full max-w-xs"
      role="img"
      aria-label="正十二面体の展開図。面11をオレンジ、隣り合う面6・2を薄黄、向かい合う面4を赤でハイライトした図"
    >
      {FACES.map((face) => {
        const style = faceStyle(face.num);
        return (
          <polygon
            key={face.num}
            points={face.points}
            fill={style.fill}
            stroke={style.stroke}
            strokeWidth={faceStyle(face.num).fill === "#f4f4f4" ? 1.5 : 3}
          />
        );
      })}
      <g fontFamily="Hiragino Kaku Gothic ProN, Yu Gothic, sans-serif" fontSize={15} fontWeight="bold" textAnchor="middle">
        {FACES.map((face) => {
          const style = faceStyle(face.num);
          return (
            <text key={face.num} x={face.label[0]} y={face.label[1]} fill={style.text}>
              {face.num}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
