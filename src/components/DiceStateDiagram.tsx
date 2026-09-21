// TG-WEBのサイコロ問題（転がし系）の解説用。6面の状態を、真上から見た十字型展開図として示す。
// 上面を中心に、東西南北の側面をコンパスの向きそのまま（北=上、南=下、東=右、西=左）に配置し、
// 下面はさらにその下に展開する。「転がしても動かない軸（面のペア）」をaxisで指定すると、
// その2面を強調表示できる（axis="ns"なら北・南、axis="ew"なら東・西を固定面として強調）。
// MDX（next-mdx-remote/rsc）経由で使うため、他コンポーネント（CarrollDiagram等）と同様に
// 全propsを文字列で受け取る設計にしている。
function FaceCell({ label, face, highlight }: { label: string; face: string; highlight?: boolean }) {
  return (
    <div
      className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 sm:h-16 sm:w-16 ${
        highlight ? "border-amber-400 bg-amber-50" : "border-gray-300 bg-white"
      }`}
    >
      <span className="text-[10px] leading-tight text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-900">{face}</span>
    </div>
  );
}

export function DiceStateDiagram({
  up,
  down,
  north,
  south,
  east,
  west,
  axis,
  caption,
}: {
  up: string;
  down: string;
  north: string;
  south: string;
  east: string;
  west: string;
  axis?: "ns" | "ew";
  caption?: string;
}) {
  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-1.5">
        <div />
        <FaceCell label="北" face={north} highlight={axis === "ns"} />
        <div />
        <FaceCell label="西" face={west} highlight={axis === "ew"} />
        <FaceCell label="上" face={up} />
        <FaceCell label="東" face={east} highlight={axis === "ew"} />
        <div />
        <FaceCell label="南" face={south} highlight={axis === "ns"} />
        <div />
        <div />
        <FaceCell label="下" face={down} />
        <div />
      </div>
      {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
    </div>
  );
}
