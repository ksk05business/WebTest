// TG-WEB従来型推論の「集合の重なり（ベン図）」記事用。この記事自体は「図を描かず公式で解く」
// ことを売りにしているが、公式の各項が具体的にどの領域の人数を指しているかを示す補助図として使う。
// 2集合・3集合どちらも円の位置は固定のレイアウト（近似的な配置。厳密な正八角形的対称性は求めない）で、
// 各領域の数値だけをpropsで受け取って表示する。MDX経由のため数値も文字列propsで渡す。
export function VennDiagram({
  variant,
  labels,
  values,
  separator = ",",
  caption,
}: {
  variant: "2" | "3";
  labels: string;
  values: string;
  separator?: string;
  caption?: string;
}) {
  const labelList = labels.split(separator).map((s) => s.trim());
  const valueList = values.split(separator).map((s) => s.trim());

  if (variant === "2") {
    const [labelA, labelB] = labelList;
    const [onlyA, onlyB, both] = valueList;
    return (
      <div className="not-prose my-6 flex flex-col items-center gap-2">
        <svg viewBox="0 0 220 180" width={260} height={213}>
          <circle cx="90" cy="95" r="65" fill="#dbeafe" fillOpacity={0.7} stroke="#60a5fa" strokeWidth={2} />
          <circle cx="140" cy="95" r="65" fill="#fde68a" fillOpacity={0.5} stroke="#d97706" strokeWidth={2} />
          <text x="55" y="35" fontSize="13" fontWeight="bold" fill="#1d4ed8">{labelA}</text>
          <text x="165" y="35" fontSize="13" fontWeight="bold" fill="#b45309">{labelB}</text>
          <text x="58" y="100" fontSize="16" fontWeight="bold" fill="#1e293b" textAnchor="middle">{onlyA}</text>
          <text x="172" y="100" fontSize="16" fontWeight="bold" fill="#1e293b" textAnchor="middle">{onlyB}</text>
          <text x="115" y="100" fontSize="16" fontWeight="bold" fill="#1e293b" textAnchor="middle">{both}</text>
        </svg>
        {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
      </div>
    );
  }

  const [labelA, labelB, labelC] = labelList;
  const [onlyA, onlyB, onlyC, ab, ac, bc, abc] = valueList;
  return (
    <div className="not-prose my-6 flex flex-col items-center gap-2">
      <svg viewBox="0 0 240 220" width={260} height={238}>
        <circle cx="95" cy="90" r="65" fill="#dbeafe" fillOpacity={0.55} stroke="#60a5fa" strokeWidth={2} />
        <circle cx="145" cy="90" r="65" fill="#fde68a" fillOpacity={0.45} stroke="#d97706" strokeWidth={2} />
        <circle cx="120" cy="140" r="65" fill="#dcfce7" fillOpacity={0.5} stroke="#16a34a" strokeWidth={2} />
        <text x="55" y="30" fontSize="12" fontWeight="bold" fill="#1d4ed8">{labelA}</text>
        <text x="165" y="30" fontSize="12" fontWeight="bold" fill="#b45309">{labelB}</text>
        <text x="110" y="205" fontSize="12" fontWeight="bold" fill="#15803d">{labelC}</text>
        <text x="68" y="70" fontSize="14" fontWeight="bold" fill="#1e293b" textAnchor="middle">{onlyA}</text>
        <text x="172" y="70" fontSize="14" fontWeight="bold" fill="#1e293b" textAnchor="middle">{onlyB}</text>
        <text x="120" y="182" fontSize="14" fontWeight="bold" fill="#1e293b" textAnchor="middle">{onlyC}</text>
        <text x="120" y="65" fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="middle">{ab}</text>
        <text x="82" y="130" fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="middle">{ac}</text>
        <text x="158" y="130" fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="middle">{bc}</text>
        <text x="120" y="105" fontSize="13" fontWeight="bold" fill="#1e293b" textAnchor="middle">{abc}</text>
      </svg>
      {caption && <p className="text-center text-[11px] leading-relaxed text-gray-400">{caption}</p>}
    </div>
  );
}
