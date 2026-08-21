"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// エビングハウスの忘却曲線の概念をもとにした「イメージ図」。
// 実際の記憶定着率を測定した数値ではなく、「復習しないと記憶は急速に薄れるが、
// 適切なタイミングで復習すると定着率が回復・維持される」という一般的な傾向を
// 視覚的に伝えるための概算値。
const DATA = [
  { x: "学習直後", no: 100, with: 100 },
  { x: "1日後", no: 40, with: 40 },
  { x: "1日後（復習）", no: 40, with: 96 },
  { x: "3日後", no: 25, with: 70 },
  { x: "3日後（復習）", no: 25, with: 97 },
  { x: "7日後", no: 21, with: 78 },
  { x: "7日後（復習）", no: 21, with: 98 },
  { x: "14日後", no: 20, with: 85 },
  { x: "14日後（復習）", no: 20, with: 99 },
  { x: "長期記憶へ定着", no: 20, with: 97 },
];

export function ForgettingCurveChart() {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={DATA} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="no"
            name="復習しない場合"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="with"
            name="Webテストナビの復習サイクル"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
