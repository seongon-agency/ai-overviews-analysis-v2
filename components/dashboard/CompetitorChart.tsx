'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CompetitorMetrics } from '@/lib/types';

interface CompetitorChartProps {
  competitors: CompetitorMetrics[];
  brandName: string;
  limit?: number;
}

export function CompetitorChart({ competitors, brandName, limit = 15 }: CompetitorChartProps) {
  // Find user's brand and separate it
  const userBrand = competitors.find(
    c => c.brand.toLowerCase() === brandName.toLowerCase()
  );
  const otherBrands = competitors.filter(
    c => c.brand.toLowerCase() !== brandName.toLowerCase()
  );

  // Take top N + ensure user's brand is included
  const topOthers = otherBrands.slice(0, limit - (userBrand ? 1 : 0));
  const chartData = userBrand ? [userBrand, ...topOthers] : topOthers;

  // Reverse for horizontal bar chart (top items at top)
  const reversedData = [...chartData].reverse();

  const isUserBrand = (brand: string) =>
    brand.toLowerCase() === brandName.toLowerCase();

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">Citations vs Mentions by Brand</h3>
      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
        <BarChart data={reversedData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" />
          <YAxis
            type="category"
            dataKey="brand"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [value, name === 'citedCount' ? 'Citations' : 'Mentions']}
          />
          <Legend />
          <Bar dataKey="citedCount" name="Citations" fill="#87CEEB">
            {reversedData.map((entry, index) => (
              <Cell
                key={`cite-${index}`}
                fill={isUserBrand(entry.brand) ? '#FFD700' : '#87CEEB'}
                stroke={isUserBrand(entry.brand) ? '#B8860B' : '#5DADE2'}
                strokeWidth={isUserBrand(entry.brand) ? 2 : 1}
              />
            ))}
          </Bar>
          <Bar dataKey="mentionedCount" name="Mentions" fill="#F08080">
            {reversedData.map((entry, index) => (
              <Cell
                key={`mention-${index}`}
                fill={isUserBrand(entry.brand) ? '#FF6B35' : '#F08080'}
                stroke={isUserBrand(entry.brand) ? '#CC5500' : '#E57373'}
                strokeWidth={isUserBrand(entry.brand) ? 2 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {userBrand && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-sm font-medium text-yellow-800">
            Your Brand Performance: {brandName}
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            Rank #{competitors.findIndex(c => c.brand.toLowerCase() === brandName.toLowerCase()) + 1} overall
            &nbsp;•&nbsp;
            {userBrand.citedCount} citations
            &nbsp;•&nbsp;
            {userBrand.mentionedCount} mentions
          </div>
        </div>
      )}
    </div>
  );
}
