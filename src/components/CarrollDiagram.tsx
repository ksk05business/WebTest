// SPIの3条件集合問題で使う「キャロル表」を、伝統的な見た目（大きな四角を十字で4分割し、
// 各区画の中に○囲みの数字＝3つ目の条件「あり」、その下に「なし」の数字を添える）に近い形で
// 描画するコンポーネント。2条件（col/row）で4区画に分け、各区画の中でさらに3つ目の条件
// （inner/outer）を表す。値が未確定のステップでは省略（undefined）すると「？」を表示する。
//
// MDX内でネストしたオブジェクトリテラル（例: topLeft={{ inner: 8, outer: 18 }}）をpropsとして
// 渡すと、next-mdx-remote/rscのコンパイル結果でundefinedになってしまう不具合が実際に発生したため、
// 各値をフラットな個別propsとして受け取る設計にしている。
type CellValue = number | string | undefined;

function QuadCell({
  inner,
  outer,
  outerLabel,
}: {
  inner: CellValue;
  outer: CellValue;
  outerLabel: string;
}) {
  return (
    <div className="flex w-24 flex-col items-center justify-center gap-1.5 border-2 border-gray-800 py-4 sm:w-28">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-700 text-sm font-bold text-gray-900">
        {inner ?? "？"}
      </span>
      <span className="text-[10px] leading-tight text-gray-500">
        {outerLabel}
        <br />
        {outer ?? "？"}
      </span>
    </div>
  );
}

export function CarrollDiagram({
  colLeftLabel,
  colRightLabel,
  rowTopLabel,
  rowBottomLabel,
  innerLabel,
  outerLabel,
  topLeftInner,
  topLeftOuter,
  topRightInner,
  topRightOuter,
  bottomLeftInner,
  bottomLeftOuter,
  bottomRightInner,
  bottomRightOuter,
  caption,
}: {
  colLeftLabel: string;
  colRightLabel: string;
  rowTopLabel: string;
  rowBottomLabel: string;
  innerLabel: string;
  outerLabel: string;
  topLeftInner?: CellValue;
  topLeftOuter?: CellValue;
  topRightInner?: CellValue;
  topRightOuter?: CellValue;
  bottomLeftInner?: CellValue;
  bottomLeftOuter?: CellValue;
  bottomRightInner?: CellValue;
  bottomRightOuter?: CellValue;
  caption?: string;
}) {
  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2">
      <div className="inline-flex flex-col items-center">
        <div className="grid grid-cols-[3.5rem_repeat(2,1fr)] items-end text-center text-xs font-semibold text-gray-600">
          <div />
          <div>{colLeftLabel}</div>
          <div>{colRightLabel}</div>
        </div>
        <div className="grid grid-cols-[3.5rem_repeat(2,1fr)] items-center">
          <div className="px-1 text-center text-xs font-semibold text-gray-600">{rowTopLabel}</div>
          <QuadCell inner={topLeftInner} outer={topLeftOuter} outerLabel={outerLabel} />
          <QuadCell inner={topRightInner} outer={topRightOuter} outerLabel={outerLabel} />
          <div className="px-1 text-center text-xs font-semibold text-gray-600">{rowBottomLabel}</div>
          <QuadCell inner={bottomLeftInner} outer={bottomLeftOuter} outerLabel={outerLabel} />
          <QuadCell inner={bottomRightInner} outer={bottomRightOuter} outerLabel={outerLabel} />
        </div>
      </div>
      {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
    </div>
  );
}
