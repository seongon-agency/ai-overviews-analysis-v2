'use client';

import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface RankSparklineProps {
  data: { rank: number | null }[];
  width?: number;
  height?: number;
}

export function RankSparkline({ data, width = 60, height = 24 }: RankSparklineProps) {
  // Filter out nulls and prepare data
  const chartData = data
    .map((d, idx) => ({
      idx,
      rank: d.rank,
      // Invert rank for display (lower rank = higher on chart)
      invertedRank: d.rank ? 11 - Math.min(d.rank, 10) : null
    }))
    .filter(d => d.invertedRank !== null);

  if (chartData.length < 2) {
    return null;
  }

  // Determine trend color
  const firstRank = chartData[0]?.rank || 0;
  const lastRank = chartData[chartData.length - 1]?.rank || 0;
  const color = lastRank < firstRank ? '#22c55e' : lastRank > firstRank ? '#ef4444' : '#9ca3af';

  return (
    <div style={{ width, height }} className="inline-block">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[0, 10]} hide />
          <Line
            type="monotone"
            dataKey="invertedRank"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
