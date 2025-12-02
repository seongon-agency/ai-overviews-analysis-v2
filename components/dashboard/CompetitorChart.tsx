'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CompetitorMetrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompetitorChartProps {
  competitors: CompetitorMetrics[];
  brandName: string;
  limit?: number;
}

export function CompetitorChart({ competitors, limit = 15 }: CompetitorChartProps) {
  // Find user's brand and separate it
  const userBrand = competitors.find(c => c.isUserBrand);
  const otherBrands = competitors.filter(c => !c.isUserBrand);

  // Take top N + ensure user's brand is included
  const topOthers = otherBrands.slice(0, limit - (userBrand ? 1 : 0));
  const chartData = userBrand ? [userBrand, ...topOthers] : topOthers;

  // Reverse for horizontal bar chart (top items at top)
  const reversedData = [...chartData].reverse();

  const isUserBrandEntry = (entry: CompetitorMetrics) => entry.isUserBrand === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Citations vs Mentions by Brand</CardTitle>
      </CardHeader>
      <CardContent>
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
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="citedCount" name="Citations" fill="hsl(210 100% 70%)">
              {reversedData.map((entry, index) => (
                <Cell
                  key={`cite-${index}`}
                  fill={isUserBrandEntry(entry) ? 'hsl(45 93% 47%)' : 'hsl(210 100% 70%)'}
                  stroke={isUserBrandEntry(entry) ? 'hsl(45 93% 37%)' : 'hsl(210 100% 50%)'}
                  strokeWidth={isUserBrandEntry(entry) ? 2 : 1}
                />
              ))}
            </Bar>
            <Bar dataKey="mentionedCount" name="Mentions" fill="hsl(270 70% 70%)">
              {reversedData.map((entry, index) => (
                <Cell
                  key={`mention-${index}`}
                  fill={isUserBrandEntry(entry) ? 'hsl(25 95% 53%)' : 'hsl(270 70% 70%)'}
                  stroke={isUserBrandEntry(entry) ? 'hsl(25 95% 43%)' : 'hsl(270 70% 50%)'}
                  strokeWidth={isUserBrandEntry(entry) ? 2 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {userBrand && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm font-medium text-amber-900">
              Your Brand Performance: {userBrand.brand}
            </div>
            <div className="text-sm text-amber-700 mt-1">
              Rank #{competitors.findIndex(c => c.isUserBrand) + 1} overall
              &nbsp;•&nbsp;
              {userBrand.citedCount} citations
              &nbsp;•&nbsp;
              {userBrand.mentionedCount} mentions
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
